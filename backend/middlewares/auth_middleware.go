package middlewares

import (
	"net/http"
	"os"
	"strings"

	"sim-magang-backend/config"
	"sim-magang-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(authType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Token tidak ditemukan"})
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		claims := jwt.MapClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Token tidak valid"})
			c.Abort()
			return
		}

		if claims["auth_type"] != authType {
			c.JSON(http.StatusForbidden, gin.H{"success": false, "message": "Token tidak sesuai dengan jenis login"})
			c.Abort()
			return
		}

		if authType == "pendaftaran" {
			sessionIDClaim, ok := claims["session_id"].(string)
			if !ok || sessionIDClaim == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Sesi tidak valid, silakan login ulang"})
				c.Abort()
				return
			}

			userIDFloat, _ := claims["user_id"].(float64)
			var user models.UserPendaftaran
			if err := config.DB.First(&user, uint(userIDFloat)).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "User tidak ditemukan"})
				c.Abort()
				return
			}

			if user.CurrentSessionID != sessionIDClaim {
				c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "Sesi Anda telah berakhir karena login di perangkat/browser lain"})
				c.Abort()
				return
			}
		}

		c.Set("user_id", claims["user_id"])
		c.Set("email", claims["email"])
		c.Set("role", claims["role"])
		c.Set("auth_type", claims["auth_type"])
		c.Next()
	}
}