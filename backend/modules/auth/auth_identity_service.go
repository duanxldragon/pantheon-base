package auth

import (
	"strings"

	user "pantheon-platform/backend/modules/system/iam/user"
	"pantheon-platform/backend/pkg/common"
	"pantheon-platform/backend/pkg/platformprefs"
)

func (s *AuthService) GetUserRoles(userID uint64) ([]string, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	var roles []string
	err := s.db.Table("system_role").
		Select("system_role.role_key").
		Joins("JOIN system_user_role ON system_user_role.role_id = system_role.id").
		Where(systemUserRoleUserIDAndStatusWhereClause, userID, 1).
		Pluck("system_role.role_key", &roles).Error
	if err != nil {
		return nil, err
	}
	return roles, nil
}

func (s *AuthService) GetUserPerms(userID uint64) ([]string, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	var permissionKeys []string
	err := s.db.Table("system_role_permission").
		Select("DISTINCT system_role_permission.permission_key").
		Joins("JOIN system_user_role ON system_user_role.role_id = system_role_permission.role_id").
		Where(systemUserRoleUserIDAndPermsWhereClause, userID).
		Pluck("system_role_permission.permission_key", &permissionKeys).Error
	if err != nil {
		return nil, err
	}
	return mergePermissionKeys(permissionKeys), nil
}

func (s *AuthService) GetCurrentUserInfo(userID uint64) (*UserInfoResp, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, userID).Error; err != nil {
		return nil, err
	}

	roles, err := s.GetUserRoles(currentUser.ID)
	if err != nil {
		return nil, err
	}
	perms, err := s.GetUserPerms(currentUser.ID)
	if err != nil {
		return nil, err
	}

	return &UserInfoResp{
		ID:          currentUser.ID,
		Username:    currentUser.Username,
		Nickname:    currentUser.Nickname,
		Avatar:      currentUser.Avatar,
		Email:       currentUser.Email,
		Phone:       currentUser.Phone,
		Roles:       roles,
		Perms:       perms,
		Preferences: platformprefs.Parse(currentUser.PreferenceJSON),
	}, nil
}

func (s *AuthService) UpdateCurrentUserPreferences(userID uint64, req *UserPlatformPreferenceUpdateReq) (*UserPreferenceUpdateResult, error) {
	if s.db == nil {
		return nil, common.ErrDatabaseNotInitialized
	}

	var currentUser user.SystemUser
	if err := s.db.First(&currentUser, userID).Error; err != nil {
		return nil, err
	}

	previousPreferences := platformprefs.Parse(currentUser.PreferenceJSON)
	nextPreferences := platformprefs.Normalize(&platformprefs.PlatformPreference{
		Theme:       req.Theme,
		Language:    req.Language,
		LayoutMode:  req.LayoutMode,
		DensityMode: req.DensityMode,
	})
	preferenceJSON, err := platformprefs.Marshal(nextPreferences)
	if err != nil {
		return nil, err
	}

	if preferenceJSON != currentUser.PreferenceJSON {
		if err := s.db.Model(&user.SystemUser{}).
			Where("id = ?", userID).
			Update("preference_json", preferenceJSON).Error; err != nil {
			return nil, err
		}
	}

	userInfo, err := s.GetCurrentUserInfo(userID)
	if err != nil {
		return nil, err
	}

	return &UserPreferenceUpdateResult{
		User:      userInfo,
		Previous:  previousPreferences,
		Current:   nextPreferences,
		Persisted: preferenceJSON,
	}, nil
}

func mergePermissionKeys(groups ...[]string) []string {
	result := make([]string, 0)
	seen := make(map[string]struct{})
	for _, group := range groups {
		for _, item := range group {
			key := strings.TrimSpace(item)
			if key == "" {
				continue
			}
			if _, ok := seen[key]; ok {
				continue
			}
			seen[key] = struct{}{}
			result = append(result, key)
		}
	}
	return result
}
