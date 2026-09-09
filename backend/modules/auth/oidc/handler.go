package oidc

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// InitiateOIDCLogin handles the OIDC login initiation
func InitiateOIDCLogin(service *OIDCService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authURL, err := service.InitiateLogin(c.Request.Context(), c.ClientIP())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Failed to initiate OIDC login",
			})
			return
		}

		// Redirect to OIDC provider
		c.Redirect(http.StatusFound, authURL)
	}
}

// HandleOIDCCallback handles the OIDC provider callback
func HandleOIDCCallback(service *OIDCService) gin.HandlerFunc {
	return func(c *gin.Context) {
		code := c.Query("code")
		state := c.Query("state")

		if code == "" || state == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Missing code or state parameter",
			})
			return
		}

		// Handle callback
		result, err := service.HandleCallback(c.Request.Context(), code, state, c.ClientIP())
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Authentication failed",
				"details": err.Error(),
			})
			return
		}

		// TODO: Create session using existing session service
		// For now, return user info
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"user": gin.H{
				"id":       result.User.ID,
				"username": result.User.Username,
				"email":    result.User.Email,
				"nickname": result.User.Nickname,
			},
			"is_new": result.IsNew,
			"message": func() string {
				if result.IsNew {
					return "Account created successfully"
				}
				return "Login successful"
			}(),
		})

		// TODO: Redirect to dashboard after setting session cookie
		// c.Redirect(http.StatusFound, "/dashboard")
	}
}

// GetOIDCConfig returns OIDC configuration info for frontend
func GetOIDCConfig(config *OIDCConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !config.Enabled {
			c.JSON(http.StatusOK, gin.H{
				"enabled": false,
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"enabled":  true,
			"loginURL": "/api/v1/auth/oidc/login",
			"provider": config.ProviderURL,
			"scopes":   config.Scopes,
		})
	}
}
