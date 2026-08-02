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

	api.GET("/bidang", controllers.GetPublicBidang)

	// Endpoint publik: seluruh konten landing page dalam satu response
	api.GET("/landing", controllers.GetLandingPublik)

	// Endpoint publik: FAQ untuk landing page (tanpa login)
	// Mendukung query ?kategori= dan ?cari=
	api.GET("/faq", controllers.GetFaqPublik)
	// Saran jawaban otomatis saat calon peserta mengetik pertanyaan
	api.POST("/faq/saran", controllers.SaranFaqPublik)
	// Kirim pertanyaan dari form halaman FAQ
	api.POST("/faq/ask", controllers.KirimPertanyaanPublik)

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
			// Buka jawaban dari chip "Mungkin maksud Anda"
			chat.POST("/saran/:id", controllers.BukaSaranFAQ)
			// Nilai jawaban bot dengan jempol naik/turun
			chat.POST("/faq/:id/feedback", controllers.KirimFeedbackFAQ)
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

		manajemen.GET("/me",
			middlewares.AuthMiddleware("manajemen"),
			controllers.GetProfilManajemen,
		)

		manajemen.PUT("/me",
			middlewares.AuthMiddleware("manajemen"),
			controllers.UpdateProfilManajemen,
		)

		manajemen.POST("/upload-foto",
			middlewares.AuthMiddleware("manajemen"),
			controllers.UploadFotoProfilManajemen,
		)

		manajemen.DELETE("/hapus-foto",
			middlewares.AuthMiddleware("manajemen"),
			controllers.HapusFotoProfilManajemen,
		)

		// ── NOTIFIKASI IN-APP (semua role manajemen, difilter per role di controller) ──
		notif := manajemen.Group("/notifikasi")
		notif.Use(middlewares.AuthMiddleware("manajemen"))
		{
			notif.GET("", controllers.GetNotifikasiSaya)
			notif.GET("/unread-count", controllers.GetUnreadNotifikasiCount)
			notif.PUT("/:id/baca", controllers.BacaNotifikasi)
			notif.PUT("/semua/baca", controllers.BacaSemuaNotifikasi)
			notif.DELETE("/semua/hapus", controllers.HapusSemuaNotifikasi)
			notif.DELETE("/:id", controllers.HapusNotifikasi)
		}

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

		// Route khusus Mentor
		mentor := manajemen.Group("/mentor")
		mentor.Use(middlewares.AuthMiddleware("manajemen"), middlewares.RoleMiddleware("mentor"))
		{
			mentor.GET("/presensi", controllers.GetPresensiMentor)
			mentor.GET("/presensi/statistik", controllers.GetStatistikPresensiMentor)
			mentor.PUT("/presensi/:id", controllers.UpdatePresensiMentor)
			mentor.GET("/pengajuan-izin", controllers.GetPengajuanIzinMentor)
			mentor.PUT("/pengajuan-izin/:id", controllers.ProsesPengajuanIzinMentor)
		}

		// ── Route khusus Peserta (presensi & pengajuan izin) ──
		peserta := manajemen.Group("/peserta")
		peserta.Use(middlewares.AuthMiddleware("manajemen"), middlewares.RoleMiddleware("peserta"))
		{
			// READ-ONLY: tetap terbuka walau masa magang sudah selesai
			peserta.GET("/presensi/hari-ini", controllers.GetStatusPresensiHariIni)
			peserta.GET("/presensi/riwayat", controllers.GetRiwayatPresensiSaya)
			peserta.GET("/pengajuan-izin", controllers.GetPengajuanIzinSaya)

			// AKSI TULIS: hanya untuk peserta yang masih aktif magang
			aktif := peserta.Group("", middlewares.MagangAktifMiddleware())
			{
				aktif.POST("/presensi/masuk", controllers.PresensiMasuk)
				aktif.POST("/presensi/pulang", controllers.PresensiPulang)
				aktif.POST("/pengajuan-izin", controllers.BuatPengajuanIzin)
				aktif.DELETE("/pengajuan-izin/:id", controllers.BatalkanPengajuanIzin)
			}
		}

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
			admin.GET("/akun", controllers.GetAllUserManajemen)
			admin.POST("/akun", controllers.RegisterManajemen)
			admin.PUT("/akun/:id", controllers.UpdateUserManajemen)
			admin.PUT("/akun/:id/status", controllers.UpdateStatusUserManajemen)
			admin.PUT("/akun/:id/bidang", controllers.AssignBidangMentor)
			admin.GET("/mentor/:id/peserta", controllers.GetPesertaBimbinganMentor)
			admin.POST("/akun/:id/foto", controllers.UploadFotoUserManajemen)
			admin.GET("/akun/:id/cek-hapus", controllers.CekUserBisaDihapus)
			admin.DELETE("/akun/:id", controllers.DeleteUserManajemen)

			// kelola bidang magang
			admin.GET("/bidang", controllers.GetAllBidang)
			admin.POST("/bidang", controllers.CreateBidang)
			admin.PUT("/bidang/:id", controllers.UpdateBidang)
			admin.PATCH("/bidang/:id/toggle-status", controllers.ToggleStatusBidang)
			admin.GET("/bidang/:id/cek-hapus", controllers.CekBidangBisaDihapus)
			admin.DELETE("/bidang/:id", controllers.DeleteBidang)

			// pengaturan jam kerja & hari libur (untuk presensi peserta)
			admin.GET("/jam-kerja", controllers.GetAllJamKerja)
			admin.PUT("/jam-kerja/:id", controllers.UpdateJamKerja)

			admin.GET("/hari-libur", controllers.GetAllHariLibur)
			admin.POST("/hari-libur", controllers.CreateHariLibur)
			admin.PUT("/hari-libur/:id", controllers.UpdateHariLibur)
			admin.DELETE("/hari-libur/:id", controllers.DeleteHariLibur)
			admin.POST("/hari-libur/sync-nasional", controllers.SyncHariLiburNasional)

			// ── DATA PRESENSI (read-only untuk admin) ──
			admin.GET("/presensi", controllers.GetAllPresensi)
			admin.GET("/presensi/statistik", controllers.GetStatistikPresensi)
			admin.GET("/presensi/opsi-filter", controllers.GetOpsiFilterPresensi)
			admin.GET("/presensi/rekap", controllers.GetRekapPresensi)
			admin.GET("/presensi/rekap/matriks", controllers.GetMatriksPresensi)
			admin.GET("/presensi/rekap/:peserta_id", controllers.GetRekapPeserta)
			admin.GET("/presensi/:id", controllers.GetPresensi)

			// ── KELOLA SERTIFIKAT ──
			admin.GET("/sertifikat", controllers.GetAllSertifikat)
			admin.POST("/sertifikat", controllers.CreateSertifikat)
			admin.PUT("/sertifikat/:id", controllers.UpdateSertifikat)
			admin.DELETE("/sertifikat/:id", controllers.DeleteSertifikat)

			// pengaturan (template) sertifikat
			admin.GET("/pengaturan-sertifikat", controllers.GetPengaturanSertifikat)
			admin.PUT("/pengaturan-sertifikat", controllers.UpdatePengaturanSertifikat)
			admin.POST("/pengaturan-sertifikat/upload/:jenis", controllers.UploadFilePengaturanSertifikat)
			admin.DELETE("/pengaturan-sertifikat/upload/:jenis", controllers.DeleteFilePengaturanSertifikat)

			// template sertifikat (banyak template)
			admin.GET("/template-sertifikat", controllers.GetAllTemplateSertifikat)
			admin.GET("/template-sertifikat/:id", controllers.GetTemplateSertifikat)
			admin.POST("/template-sertifikat", controllers.CreateTemplateSertifikat)
			admin.PUT("/template-sertifikat/:id", controllers.UpdateTemplateSertifikat)
			admin.DELETE("/template-sertifikat/:id", controllers.DeleteTemplateSertifikat)
			admin.POST("/template-sertifikat/:id/upload/:jenis", controllers.UploadFileTemplateSertifikat)
			admin.DELETE("/template-sertifikat/:id/upload/:jenis", controllers.DeleteFileTemplateSertifikat)

			// ── TEMPLATE SURAT PENERIMAAN (banyak template + tata letak) ──
			admin.GET("/template-surat", controllers.GetAllTemplateSurat)
			admin.GET("/template-surat/bawaan", controllers.GetTataLetakBawaanSurat)
			admin.GET("/template-surat/:id", controllers.GetTemplateSurat)
			admin.POST("/template-surat", controllers.CreateTemplateSurat)
			admin.PUT("/template-surat/:id", controllers.UpdateTemplateSurat)
			admin.DELETE("/template-surat/:id", controllers.DeleteTemplateSurat)
			admin.POST("/template-surat/:id/duplikat", controllers.DuplikatTemplateSurat)
			admin.GET("/template-surat/:id/pratinjau", controllers.PratinjauTemplateSurat)
			admin.GET("/template-surat/:id/peta", controllers.PetaTemplateSurat)
			admin.POST("/template-surat/:id/upload/:jenis", controllers.UploadFileTemplateSurat)
			admin.DELETE("/template-surat/:id/upload/:jenis", controllers.DeleteFileTemplateSurat)

			// kelola akun peserta
			admin.POST("/pendaftaran/:id/buat-akun-peserta", controllers.CreateAkunPeserta)
			admin.GET("/akun-peserta", controllers.GetAllAkunPeserta)
			admin.GET("/akun-peserta/:id", controllers.GetDetailAkunPeserta)
			admin.PUT("/akun-peserta/:id/mentor", controllers.AssignMentorPeserta)
			admin.POST("/akun-peserta/:id/reset-password", controllers.ResetPasswordAkunPeserta)

			// Admin melihat semua data pendaftaran magang
			admin.GET("/pendaftaran", controllers.GetAllPendaftaranMagang)

			// Admin melihat detail pendaftaran magang
			admin.GET("/pendaftaran/:id", controllers.GetDetailPendaftaranMagang)

			// Admin menerima atau menolak pendaftaran magang
			admin.PUT("/pendaftaran/:id/status", controllers.UpdateStatusPendaftaranMagang)

			// ── SURAT PENERIMAAN MAGANG ──
			admin.GET("/surat-penerimaan", controllers.GetAllSuratPenerimaan)
			admin.GET("/surat-penerimaan/:id", controllers.GetSuratPenerimaan)
			admin.GET("/surat-penerimaan/:id/unduh", controllers.DownloadSuratPenerimaan)
			admin.POST("/surat-penerimaan", controllers.CreateSuratPenerimaan)
			admin.POST("/surat-penerimaan/:id/kirim-email", controllers.KirimUlangEmailSuratPenerimaan)
			// Pratinjau draf: hanya menghasilkan PDF sementara, tidak menyimpan apa pun
			admin.POST("/surat-penerimaan/pratinjau", controllers.PratinjauSuratPenerimaan)
			admin.PUT("/surat-penerimaan/:id", controllers.UpdateSuratPenerimaan)
			admin.DELETE("/surat-penerimaan/:id", controllers.DeleteSuratPenerimaan)

			// ── PENGATURAN LANDING PAGE (identitas, kontak, status pendaftaran) ──
			admin.GET("/pengaturan-landing", controllers.GetPengaturanLanding)
			admin.PUT("/pengaturan-landing", controllers.UpdatePengaturanLanding)
			admin.POST("/pengaturan-landing/upload/:jenis", controllers.UploadFilePengaturanLanding)
			admin.DELETE("/pengaturan-landing/upload/:jenis", controllers.DeleteFilePengaturanLanding)

			// slide gambar hero landing page
			admin.GET("/hero-slide", controllers.GetHeroSlides)
			admin.POST("/hero-slide", controllers.CreateHeroSlide)
			admin.PUT("/hero-slide/:id", controllers.UpdateHeroSlide)
			admin.DELETE("/hero-slide/:id", controllers.DeleteHeroSlide)

			// pengaturan tampilan bidang di landing page
			admin.GET("/bidang-tampilan", controllers.GetTampilanBidang)
			admin.PUT("/bidang-tampilan/:id", controllers.UpdateTampilanBidang)

			// konten landing page (persyaratan, dokumen, alur, benefit, misi, tujuan, keunggulan)
			admin.GET("/landing-konten/:jenis", controllers.GetKontenLanding)
			admin.POST("/landing-konten/:jenis", controllers.CreateKontenLanding)
			admin.PUT("/landing-konten/:jenis/urutan", controllers.UrutkanKontenLanding)
			admin.PUT("/landing-konten-item/:id", controllers.UpdateKontenLanding)
			admin.DELETE("/landing-konten-item/:id", controllers.DeleteKontenLanding)
			
			// menu navigasi landing page (route dikunci, hanya label & urutan yang bisa diubah)
			admin.GET("/landing-menu", controllers.GetMenuLanding)
			admin.PUT("/landing-menu/urutan", controllers.UrutkanMenuLanding)
			admin.PUT("/landing-menu/:id", controllers.UpdateMenuLanding)

			// pengaturan surat penerimaan (kop, redaksi, penandatangan)
			admin.GET("/pengaturan-surat", controllers.GetPengaturanSuratPenerimaan)
			admin.PUT("/pengaturan-surat", controllers.UpdatePengaturanSuratPenerimaan)
			admin.POST("/pengaturan-surat/upload/:jenis", controllers.UploadFilePengaturanSurat)
			admin.DELETE("/pengaturan-surat/upload/:jenis", controllers.DeleteFilePengaturanSurat)

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
			// PENTING: rute statis harus didaftarkan SEBELUM rute ber-parameter
			admin.GET("/faq/pratinjau", controllers.AdminPratinjauQuickAction)
			admin.GET("/faq/analitik", controllers.AdminAnalitikFaq)
			admin.GET("/faq/ekspor", controllers.AdminEksporFaqCSV)
			admin.GET("/faq/contoh-impor", controllers.AdminContohImporCSV)
			admin.POST("/faq/massal", controllers.AdminAksiMassalFAQ)
			admin.POST("/faq/impor", controllers.AdminImporFaqCSV)
			admin.PUT("/faq/urutan", controllers.AdminReorderFAQ)
			admin.PUT("/faq/:id", controllers.AdminUpdateFAQ)
			admin.DELETE("/faq/:id", controllers.AdminDeleteFAQ)

			// ── PERTANYAAN MASUK (bahan FAQ baru) ──
			// Sengaja memakai prefix terpisah agar tidak bentrok dengan /faq/:id
			admin.GET("/pertanyaan-faq", controllers.AdminGetPertanyaanFaq)
			admin.PUT("/pertanyaan-faq/:id", controllers.AdminUpdatePertanyaanFaq)
			admin.DELETE("/pertanyaan-faq/:id", controllers.AdminDeletePertanyaanFaq)
		}
	}
}
