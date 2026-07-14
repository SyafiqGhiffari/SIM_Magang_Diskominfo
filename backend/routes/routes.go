package routes

import (
	"sim-magang-backend/controllers"
	"sim-magang-backend/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	api := router.Group("/api")

	// ── SEMENTARA untuk testing email — HAPUS sebelum deploy ke production! ──
	api.GET("/test-email", controllers.TestKirimEmail)

	// Endpoint publik: cek apakah ada admin yang sedang online (untuk ChatWidget)
	api.GET("/chat/admin-status", controllers.GetAdminOnlineStatus)

	// Auth Web Pendaftaran
	pendaftaran := api.Group("/pendaftaran")
	{
		pendaftaran.POST("/register", controllers.RegisterPendaftaran)
		pendaftaran.POST("/login", controllers.LoginPendaftaran)
		pendaftaran.POST("/logout",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.LogoutPendaftaran,
		)

		// Request reset password (kirim link ke email)
		pendaftaran.POST("/forgot-password", controllers.RequestForgotPassword)

		// Reset password menggunakan token dari link email
		pendaftaran.POST("/reset-password", controllers.ResetPassword)

		// Profil user pendaftaran (hanya menampilkan user_id, email, role, dan auth_type)
		pendaftaran.GET("/profile",
			middlewares.AuthMiddleware("pendaftaran"),
			func(c *gin.Context) {
				c.JSON(200, gin.H{
					"success": true,
					"message": "Profile pendaftaran berhasil diakses",
					"data": gin.H{
						"user_id":   c.GetFloat64("user_id"),
						"email":     c.GetString("email"),
						"role":      c.GetString("role"),
						"auth_type": c.GetString("auth_type"),
					},
				})
			},
		)

		// Profil lengkap user
		pendaftaran.GET("/me",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.GetProfilPendaftaran,
		)

		// Update profil (nama, no_hp, dan institusi)
		pendaftaran.PUT("/update-profil",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.UpdateProfilPendaftaran,
		)

		// Upload foto profil
		pendaftaran.POST("/upload-foto",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.UploadFotoProfilPendaftaran,
		)

		// Hapus foto profil
		pendaftaran.DELETE("/hapus-foto",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.HapusFotoProfilPendaftaran,
		)

		// Request ganti email (kirim OTP)
		pendaftaran.POST("/request-ganti-email",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.RequestGantiEmail,
		)

		// Verifikasi OTP ganti email
		pendaftaran.POST("/verifikasi-ganti-email",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.VerifikasiGantiEmail,
		)

		// Ganti password
		pendaftaran.PUT("/ganti-password",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.GantiPasswordPendaftaran,
		)

		// Form Pendaftaran Magang
		pendaftaran.POST("/magang",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.CreatePendaftaranMagang,
		)

		// Cek Status Pendaftaran Magang Peserta
		pendaftaran.GET("/magang/status",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.GetStatusPendaftaranSaya,
		)

		// Revisi Dokumen Pendaftaran Magang Peserta
		pendaftaran.PUT("/magang/revisi",
			middlewares.AuthMiddleware("pendaftaran"),
			controllers.RevisiDokumenPendaftaranMagang,
		)

		// ── CHAT ──
		chat := pendaftaran.Group("/chat")
		chat.Use(middlewares.AuthMiddleware("pendaftaran"))
		{
			// Ambil/buat sesi aktif
			chat.POST("/session", controllers.GetOrCreateChatSession)
			// Polling pesan
			chat.GET("/messages", controllers.GetChatMessages)
			// Kirim pesan (+ FAQ auto-reply check)
			chat.POST("/message", controllers.SendChatMessage)
			// Jumlah pesan belum dibaca
			chat.GET("/unread", controllers.GetChatUnreadCount)
			// Daftar FAQ publik
			chat.GET("/faq", controllers.GetPublicFAQ)
			// Daftar quick action aktif (tombol pintasan di chat widget)
			chat.GET("/quick-actions", controllers.GetQuickActions)
			// Gunakan quick action — catat ke riwayat chat
			chat.POST("/quick-action/:id", controllers.UseQuickAction)
		}
	}

	// Auth Web Manajemen
	manajemen := api.Group("/manajemen")
	{
		manajemen.POST("/register", controllers.RegisterManajemen)
		manajemen.POST("/login", controllers.LoginManajemen)
		manajemen.POST("/logout",
			middlewares.AuthMiddleware("manajemen"),
			controllers.LogoutManajemen,
		)
		
		manajemen.PUT("/ganti-password",
			middlewares.AuthMiddleware("manajemen"),
			controllers.GantiPasswordManajemen,
		)

		manajemen.GET("/profile",
			middlewares.AuthMiddleware("manajemen"),
			func(c *gin.Context) {
				c.JSON(200, gin.H{
					"success": true,
					"message": "Profile manajemen berhasil diakses",
					"data": gin.H{
						"user_id":   c.GetFloat64("user_id"),
						"email":     c.GetString("email"),
						"role":      c.GetString("role"),
						"auth_type": c.GetString("auth_type"),
					},
				})
			},
		)

		manajemen.GET("/admin/dashboard",
			middlewares.AuthMiddleware("manajemen"),
			middlewares.RoleMiddleware("admin"),
			func(c *gin.Context) {
				c.JSON(200, gin.H{
					"success": true,
					"message": "Dashboard admin berhasil diakses",
				})
			},
		)

		manajemen.GET("/mentor/dashboard",
			middlewares.AuthMiddleware("manajemen"),
			middlewares.RoleMiddleware("mentor"),
			func(c *gin.Context) {
				c.JSON(200, gin.H{
					"success": true,
					"message": "Dashboard mentor berhasil diakses",
				})
			},
		)

		manajemen.GET("/peserta/dashboard",
			middlewares.AuthMiddleware("manajemen"),
			middlewares.RoleMiddleware("peserta"),
			func(c *gin.Context) {
				c.JSON(200, gin.H{
					"success": true,
					"message": "Dashboard peserta berhasil diakses",
				})
			},
		)

		// Route khusus Admin
		admin := manajemen.Group("/admin")
		admin.Use(middlewares.AuthMiddleware("manajemen"), middlewares.RoleMiddleware("admin"))
		{
			// ── KELOLA AKUN MANAJEMEN (hanya admin) ──
			admin.POST("/akun", controllers.RegisterManajemen)
			admin.GET("/akun", controllers.GetAllUserManajemen)
			admin.PUT("/akun/:id/status", controllers.UpdateStatusUserManajemen)
			admin.DELETE("/akun/:id", controllers.DeleteUserManajemen)

			// Admin melihat semua data pendaftaran magang
			admin.GET("/pendaftaran", controllers.GetAllPendaftaranMagang)

			// Admin melihat detail pendaftaran magang
			admin.GET("/pendaftaran/:id", controllers.GetDetailPendaftaranMagang)

			// Admin menerima atau menolak pendaftaran magang
			admin.PUT("/pendaftaran/:id/status", controllers.UpdateStatusPendaftaranMagang)

			// ── CHAT ADMIN ──
			// Semua sesi chat yang masuk
			admin.GET("/chat/sessions", controllers.AdminGetChatSessions)
			// Pesan dalam satu sesi
			admin.GET("/chat/session/:id/messages", controllers.AdminGetSessionMessages)
			// Balas pesan
			admin.POST("/chat/session/:id/reply", controllers.AdminReplyChatSession)
			// Tutup sesi
			admin.PUT("/chat/session/:id/close", controllers.AdminCloseChatSession)

			// ── FAQ CRUD ──
			admin.GET("/faq", controllers.AdminGetFAQ)
			admin.POST("/faq", controllers.AdminCreateFAQ)
			admin.PUT("/faq/:id", controllers.AdminUpdateFAQ)
			admin.DELETE("/faq/:id", controllers.AdminDeleteFAQ)
		}
	}
}
