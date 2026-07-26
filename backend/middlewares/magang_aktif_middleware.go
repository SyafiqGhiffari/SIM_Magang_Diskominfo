package middlewares

import (
	"net/http"

	"sim-magang-backend/config"
	"sim-magang-backend/models"

	"github.com/gin-gonic/gin"
)

// MagangAktifMiddleware memblokir aksi TULIS (presensi & pengajuan izin) bagi
// peserta yang masa magangnya sudah selesai. Endpoint baca tetap terbuka,
// sehingga alumni berada dalam mode read-only.
func MagangAktifMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := uint(c.GetFloat64("user_id"))

		var user models.UserManajemen
		if err := config.DB.Select("id", "role", "status_magang").First(&user, userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Akun tidak ditemukan",
			})
			c.Abort()
			return
		}

		if user.Role == "peserta" && user.StatusMagang == "selesai" {
			c.JSON(http.StatusForbidden, gin.H{
				"success":       false,
				"message":       "Masa magang Anda sudah berakhir. Anda masih dapat melihat riwayat presensi, raport, dan sertifikat.",
				"status_magang": "selesai",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}