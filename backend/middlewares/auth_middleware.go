package middlewares

import (
	"net/http"
	"os"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// Durasi idle timeout per peran
const (
	IdleTimeoutAdmin      = 30 * time.Minute
	IdleTimeoutMentor     = 45 * time.Minute
	IdleTimeoutPeserta    = 120 * time.Minute // 2 Jam
	IdleTimeoutPendaftar  = 120 * time.Minute // 2 Jam
	MinUpdateInterval     = 1 * time.Minute  // interval throttle update LastActivityAt
)

func getRoleIdleTimeout(role string) time.Duration {
	switch role {
	case "admin":
		return IdleTimeoutAdmin
	case "mentor":
		return IdleTimeoutMentor
	case "peserta":
		return IdleTimeoutPeserta
	default:
		return IdleTimeoutPendaftar
	}
}

func AuthMiddleware(authType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token tidak ditemukan",
				"code":    "TOKEN_NOT_FOUND",
			})
			c.Abort()
			return
		}

		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		claims := jwt.MapClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})
		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token tidak valid atau telah kedaluwarsa",
				"code":    "TOKEN_INVALID",
			})
			c.Abort()
			return
		}

		if claims["auth_type"] != authType {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Token tidak sesuai dengan jenis login",
				"code":    "AUTH_TYPE_MISMATCH",
			})
			c.Abort()
			return
		}

		now := time.Now()
		sessionIDClaim, _ := claims["session_id"].(string)
		userIDFloat, _ := claims["user_id"].(float64)
		userID := uint(userIDFloat)

		switch authType {
		case "manajemen":
			var user models.UserManajemen
			if err := config.DB.First(&user, userID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "User manajemen tidak ditemukan",
					"code":    "USER_NOT_FOUND",
				})
				c.Abort()
				return
			}

			if user.StatusAkun != "aktif" {
				c.JSON(http.StatusForbidden, gin.H{
					"success": false,
					"message": "Akun manajemen nonaktif. Akses login diblokir sementara.",
					"code":    "ACCOUNT_INACTIVE",
				})
				c.Abort()
				return
			}

			// Validasi single-device session (jika user memiliki CurrentSessionID aktif)
			if user.CurrentSessionID != "" && sessionIDClaim != "" && user.CurrentSessionID != sessionIDClaim {
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "Sesi Anda telah berakhir karena akun telah login di perangkat atau tab browser lain.",
					"code":    "SESSION_INVALIDATED",
				})
				c.Abort()
				return
			}

			// Validasi Role-Based Idle Timeout
			idleLimit := getRoleIdleTimeout(user.Role)
			if user.LastActivityAt != nil && time.Since(*user.LastActivityAt) > idleLimit {
				// Sesi idle terlampaui -> set offline & tolak request
				config.DB.Model(&user).Updates(map[string]interface{}{
					"is_online":          false,
					"current_session_id": "",
				})

				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "Sesi Anda telah berakhir karena tidak ada aktivitas (idle timeout). Silakan login kembali.",
					"code":    "SESSION_IDLE_TIMEOUT",
				})
				c.Abort()
				return
			}

			// Perbarui LastActivityAt jika selisih waktu sudah lebih dari 1 menit (throttle DB write)
			if user.LastActivityAt == nil || time.Since(*user.LastActivityAt) >= MinUpdateInterval {
				config.DB.Model(&user).Update("last_activity_at", &now)
			}

			c.Set("user_nama", user.Nama)

		case "pendaftaran":
			var user models.UserPendaftaran
			if err := config.DB.First(&user, userID).Error; err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "User pendaftaran tidak ditemukan",
					"code":    "USER_NOT_FOUND",
				})
				c.Abort()
				return
			}

			if user.StatusAkun != "aktif" {
				c.JSON(http.StatusForbidden, gin.H{
					"success": false,
					"message": "Akun pendaftaran nonaktif. Akses login diblokir sementara.",
					"code":    "ACCOUNT_INACTIVE",
				})
				c.Abort()
				return
			}

			// Validasi single-device session
			if user.CurrentSessionID != "" && sessionIDClaim != "" && user.CurrentSessionID != sessionIDClaim {
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "Sesi Anda telah berakhir karena akun telah login di perangkat atau tab browser lain.",
					"code":    "SESSION_INVALIDATED",
				})
				c.Abort()
				return
			}

			// Validasi Idle Timeout (2 Jam)
			if user.LastActivityAt != nil && time.Since(*user.LastActivityAt) > IdleTimeoutPendaftar {
				config.DB.Model(&user).Update("current_session_id", "")
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "Sesi Anda telah berakhir karena tidak ada aktivitas (idle timeout). Silakan login kembali.",
					"code":    "SESSION_IDLE_TIMEOUT",
				})
				c.Abort()
				return
			}

			// Perbarui LastActivityAt jika selisih waktu sudah lebih dari 1 menit
			if user.LastActivityAt == nil || time.Since(*user.LastActivityAt) >= MinUpdateInterval {
				config.DB.Model(&user).Update("last_activity_at", &now)
			}

			c.Set("user_nama", user.Nama)
		}

		c.Set("user_id", claims["user_id"])
		c.Set("email", claims["email"])
		c.Set("role", claims["role"])
		c.Set("auth_type", claims["auth_type"])
		c.Next()
	}
}