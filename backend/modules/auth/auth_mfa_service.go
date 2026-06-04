package auth

import (
	"errors"
	"strings"
	"time"

	user "pantheon-platform/backend/modules/system/iam/user"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type authMFAService struct {
	auth *AuthService
}

func newAuthMFAService(auth *AuthService) *authMFAService {
	return &authMFAService{auth: auth}
}

func (s *authMFAService) CreateMFAChallenge(currentUser *user.SystemUser) (*MFAChallengeResp, error) {
	if s.auth.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
	}
	if currentUser == nil || currentUser.ID == 0 {
		return nil, errors.New("auth.mfa.user_invalid")
	}
	if !s.auth.getAuthRuntimePolicy().MFAEnabled {
		return nil, errors.New("auth.mfa.disabled")
	}

	var factor SystemAuthFactor
	err := s.auth.db.Where(userIDAndFactorTypeEnabledWhereClause, currentUser.ID, "totp", 1).First(&factor).Error
	setupRequired := errors.Is(err, gorm.ErrRecordNotFound)
	if err != nil && !setupRequired {
		return nil, err
	}

	secret := ""
	if setupRequired {
		var secretErr error
		secret, secretErr = generateTOTPSecret()
		if secretErr != nil {
			return nil, secretErr
		}
	}
	encryptedSecret, err := encryptMFASecret(secret)
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(5 * time.Minute)
	challenge := SystemAuthMFAChallenge{
		ChallengeID:     uuid.NewString(),
		UserID:          currentUser.ID,
		Purpose:         "login",
		SecretEncrypted: encryptedSecret,
		SetupRequired:   boolToInt(setupRequired),
		ExpiresAt:       expiresAt,
	}
	if err := s.auth.db.Create(&challenge).Error; err != nil {
		return nil, err
	}

	resp := &MFAChallengeResp{
		MFARequired:   true,
		ChallengeID:   challenge.ChallengeID,
		SetupRequired: setupRequired,
		ExpiresAt:     expiresAt.Format(time.RFC3339),
	}
	if setupRequired {
		resp.TOTPSecret = secret
		resp.TOTPProvisionURI = buildTOTPURL(currentUser.Username, secret)
	}
	return resp, nil
}

func (s *authMFAService) VerifyMFAChallenge(req *MFAVerifyReq, ip, userAgent string) (*AuthTokenResp, error) {
	if s.auth.db == nil {
		return nil, errors.New(errDatabaseNotInitialized)
	}
	if req == nil || strings.TrimSpace(req.ChallengeID) == "" {
		return nil, errors.New("auth.mfa.challenge_required")
	}

	now := time.Now()
	challenge, err := s.loadActiveMFAChallenge(strings.TrimSpace(req.ChallengeID), now)
	if err != nil {
		return nil, err
	}

	secret, err := s.loadMFAChallengeSecret(*challenge)
	if err != nil {
		return nil, err
	}
	if !validateTOTPCode(secret, req.Code, now) {
		return nil, errors.New("auth.mfa.code_invalid")
	}

	currentUser, err := s.loadMFAChallengeUser(challenge.UserID)
	if err != nil {
		return nil, err
	}

	if err := s.finalizeMFAChallenge(*challenge, secret, now); err != nil {
		return nil, err
	}

	roles, err := s.auth.GetUserRoles(currentUser.ID)
	if err != nil {
		return nil, err
	}
	tokenPair, err := s.auth.CreateSession(currentUser, roles, ip, userAgent)
	if err != nil {
		return nil, err
	}
	userInfo, err := s.auth.GetCurrentUserInfo(currentUser.ID)
	if err != nil {
		return nil, err
	}

	return &AuthTokenResp{
		Token:            tokenPair.AccessToken,
		AccessToken:      tokenPair.AccessToken,
		RefreshToken:     tokenPair.RefreshToken,
		TokenType:        tokenPair.TokenType,
		AccessExpiresAt:  tokenPair.AccessExpiresAt.Format("2006-01-02 15:04:05"),
		RefreshExpiresAt: tokenPair.RefreshExpiresAt.Format("2006-01-02 15:04:05"),
		SessionID:        tokenPair.SessionID,
		User:             userInfo,
	}, nil
}

func (s *authMFAService) loadActiveMFAChallenge(challengeID string, now time.Time) (*SystemAuthMFAChallenge, error) {
	var challenge SystemAuthMFAChallenge
	if err := s.auth.db.Where("challenge_id = ?", challengeID).First(&challenge).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("auth.mfa.challenge_invalid")
		}
		return nil, err
	}
	if challenge.ConsumedAt != nil || !challenge.ExpiresAt.After(now) {
		return nil, errors.New("auth.mfa.challenge_expired")
	}
	return &challenge, nil
}

func (s *authMFAService) loadMFAChallengeSecret(challenge SystemAuthMFAChallenge) (string, error) {
	if challenge.SetupRequired == 1 {
		return decryptMFASecret(challenge.SecretEncrypted)
	}

	var factor SystemAuthFactor
	if err := s.auth.db.Where(userIDAndFactorTypeEnabledWhereClause, challenge.UserID, "totp", 1).First(&factor).Error; err != nil {
		return "", errors.New("auth.mfa.factor_missing")
	}
	return decryptMFASecret(factor.SecretEncrypted)
}

func (s *authMFAService) loadMFAChallengeUser(userID uint64) (*user.SystemUser, error) {
	var currentUser user.SystemUser
	if err := s.auth.db.First(&currentUser, userID).Error; err != nil {
		return nil, err
	}
	if currentUser.Status == 2 {
		return nil, errors.New("user.login.error.disabled")
	}
	return &currentUser, nil
}

func (s *authMFAService) finalizeMFAChallenge(challenge SystemAuthMFAChallenge, secret string, now time.Time) error {
	return s.auth.db.Transaction(func(tx *gorm.DB) error {
		if challenge.SetupRequired == 1 {
			encryptedSecret, err := encryptMFASecret(secret)
			if err != nil {
				return err
			}
			if err := upsertMFAFactor(tx, challenge.UserID, encryptedSecret, now); err != nil {
				return err
			}
		}

		result := tx.Model(&SystemAuthMFAChallenge{}).
			Where("id = ? AND consumed_at IS NULL", challenge.ID).
			Update("consumed_at", &now)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return errors.New("auth.mfa.challenge_expired")
		}
		return nil
	})
}

func upsertMFAFactor(tx *gorm.DB, userID uint64, encryptedSecret string, now time.Time) error {
	var factor SystemAuthFactor
	err := tx.Where(userIDAndFactorTypeWhereClause, userID, "totp").First(&factor).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		factor = SystemAuthFactor{
			UserID:          userID,
			FactorType:      "totp",
			SecretEncrypted: encryptedSecret,
			Enabled:         1,
			ConfirmedAt:     &now,
		}
		return tx.Create(&factor).Error
	}
	if err != nil {
		return err
	}
	return tx.Model(&factor).Updates(map[string]any{
		"secret_encrypted": encryptedSecret,
		"enabled":          1,
		"confirmed_at":     &now,
	}).Error
}
