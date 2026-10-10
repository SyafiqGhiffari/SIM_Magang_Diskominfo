// ==============================================================================
// SISTEM INFORMASI MANAJEMEN MAGANG (SIM MAGANG) - DISKOMINFO PONOROGO
// CENTRAL ROUTE DEFINITION (routes.go)
//
// File ini merupakan pusat konfigurasi seluruh endpoint API backend (Gin Framework).
// Rute diorganisasi secara modular berdasarkan domain dan hak akses (Role):
// 1. setupPublicRoutes     : Akses umum tanpa login (Landing Page, FAQ, Master Bidang)
// 2. setupPendaftaranRoutes: Alur calon peserta magang (Registrasi, Formulir, Status, Chat)
// 3. setupManajemenRoutes  : Alur portal internal manajemen (Auth, Profil, Notifikasi)
//    ├── setupMentorRoutes : [ROLE: MENTOR] - Bimbingan, Presensi, Tugas, Penilaian, Laporan
//    ├── setupPesertaRoutes: [ROLE: PESERTA] - Presensi Geofence, Logbook, Tugas, Sertifikat
//    └── setupAdminRoutes  : [ROLE: ADMIN] - Kelola Akun, Seleksi, Master Data, Surat, Sertifikat
// ==============================================================================

package routes

import (
	"sim-magang-backend/controllers"
	"sim-magang-backend/middlewares"

	"github.com/gin-gonic/gin"
)

// SetupRoutes menginisialisasi seluruh rute API aplikasi
func SetupRoutes(router *gin.Engine) {
	api := router.Group("/api")

	// 1. Rute Publik (Landing page, status admin chat, FAQ)
	setupPublicRoutes(api)

	// 2. Rute Portal Web Pendaftaran Magang
	setupPendaftaranRoutes(api)

	// 3. Rute Portal Web Manajemen (Admin, Mentor, Peserta)
	setupManajemenRoutes(api)
}

// ==============================================================================
// 1. RUTE PUBLIK (AKSES TERBUKA TANPA AUTENTIKASI)
// ==============================================================================
func setupPublicRoutes(api *gin.RouterGroup) {
	// Status online admin (untuk indikator aktif di widget chat landing page)
	api.GET("/chat/admin-status", controllers.GetAdminOnlineStatus)

	// Master data bidang magang yang terbuka untuk pendaftaran publik
	api.GET("/bidang", controllers.GetPublicBidang)

	// Konten agregat landing page (identitas, hero slide, benefit, alur, kuota)
	api.GET("/landing", controllers.GetLandingPublik)

	// Tanya jawab umum (FAQ) landing page
	api.GET("/faq", controllers.GetFaqPublik)              // Ambil daftar FAQ publik (filter ?kategori= & ?cari=)
	api.POST("/faq/saran", controllers.SaranFaqPublik)     // Saran otomatis saat calon peserta mengetik pertanyaan
	api.POST("/faq/ask", controllers.KirimPertanyaanPublik) // Kirim pertanyaan baru jika tidak ditemukan di FAQ
}

// ==============================================================================
// 2. RUTE PORTAL WEB PENDAFTARAN CALON PESERTA
// ==============================================================================
func setupPendaftaranRoutes(api *gin.RouterGroup) {
	pendaftaran := api.Group("/pendaftaran")

	// ── 2.1 Rute Tamu / Belum Login (Guest) ──
	pendaftaran.POST("/register", controllers.RegisterPendaftaran)             // Registrasi akun pendaftar baru
	pendaftaran.POST("/login", controllers.LoginPendaftaran)                   // Autentikasi login pendaftar
	pendaftaran.POST("/forgot-password", controllers.RequestForgotPassword)   // Permintaan link reset password via email
	pendaftaran.POST("/reset-password", controllers.ResetPassword)             // Eksekusi reset password via token email

	// ── 2.2 Rute Terautentikasi Calon Peserta ──
	auth := pendaftaran.Group("", middlewares.AuthMiddleware("pendaftaran"))
	{
		// Sesi & Keamanan Akun
		auth.POST("/logout", controllers.LogoutPendaftaran)                       // Keluar dari sesi login
		auth.POST("/ping", controllers.PingPendaftaran)                           // Cek validitas token sesi
		auth.PUT("/ganti-password", controllers.GantiPasswordPendaftaran)         // Ubah password akun
		auth.GET("/riwayat-login", controllers.GetRiwayatLoginPendaftaran)        // Riwayat login akun

		// Informasi & Pengaturan Profil
		auth.GET("/profile", func(c *gin.Context) {                              // Data ringkas token sesi
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
		})
		auth.GET("/me", controllers.GetProfilPendaftaran)                         // Profil lengkap calon peserta
		auth.PUT("/update-profil", controllers.UpdateProfilPendaftaran)           // Perbarui nama, no hp, institusi
		auth.POST("/upload-foto", controllers.UploadFotoProfilPendaftaran)        // Unggah foto profil
		auth.DELETE("/hapus-foto", controllers.HapusFotoProfilPendaftaran)        // Hapus foto profil
		auth.POST("/request-ganti-email", controllers.RequestGantiEmail)          // Request kode OTP ganti email
		auth.POST("/verifikasi-ganti-email", controllers.VerifikasiGantiEmail)    // Verifikasi OTP ganti email

		// Formulir & Pengajuan Magang
		auth.POST("/magang", controllers.CreatePendaftaranMagang)                 // Kirim berkas pendaftaran magang baru
		auth.GET("/magang/status", controllers.GetStatusPendaftaranSaya)          // Cek status seleksi pendaftaran saya
		auth.PUT("/magang/revisi", controllers.RevisiDokumenPendaftaranMagang)    // Unggah revisi berkas pendaftaran

		// Denyut Keberadaan (Heartbeat status online)
		auth.PUT("/denyut", controllers.PesertaDenyut)

		// Layanan Chat & Bantuan Bimbingan Pendaftar
		chat := auth.Group("/chat")
		{
			chat.POST("/session", controllers.GetOrCreateChatSession)              // Buat / ambil sesi chat aktif
			chat.GET("/messages", controllers.GetChatMessages)                    // Muat pesan dalam sesi chat
			chat.POST("/message", controllers.SendChatMessage)                    // Kirim pesan teks (+ auto reply bot)
			chat.GET("/unread", controllers.GetChatUnreadCount)                   // Hitung pesan belum dibaca
			chat.GET("/faq", controllers.GetPublicFAQ)                            // Daftar FAQ cepat dalam widget chat
			chat.GET("/quick-actions", controllers.GetQuickActions)               // Tombol aksi cepat interaktif
			chat.POST("/quick-action/:id", controllers.UseQuickAction)            // Gunakan aksi cepat ke dalam chat
			chat.POST("/saran/:id", controllers.BukaSaranFAQ)                     // Buka saran jawaban FAQ
			chat.POST("/faq/:id/feedback", controllers.KirimFeedbackFAQ)          // Nilai jawaban bot (suka/tidak suka)
			chat.POST("/lampiran", controllers.PesertaKirimLampiran)              // Kirim file / gambar lampiran chat
		}
	}
}

// ==============================================================================
// 3. RUTE PORTAL WEB MANAJEMEN INTERNAL (ADMIN, MENTOR, PESERTA)
// ==============================================================================
func setupManajemenRoutes(api *gin.RouterGroup) {
	manajemen := api.Group("/manajemen")

	// ── 3.1 Rute Tamu Manajemen (Guest) ──
	manajemen.POST("/register", controllers.RegisterManajemen)                                 // Registrasi user manajemen
	manajemen.POST("/login", controllers.LoginManajemen)                                       // Login portal manajemen
	manajemen.POST("/forgot-password", controllers.RequestForgotPasswordManajemen)             // Permintaan reset password
	manajemen.POST("/reset-password", controllers.ResetPasswordManajemen)                     // Eksekusi reset password

	// ── 3.2 Rute Terautentikasi Manajemen Bersama (Semua Role: Admin, Mentor, Peserta) ──
	auth := manajemen.Group("", middlewares.AuthMiddleware("manajemen"))
	{
		// Sesi & Keamanan Akun
		auth.POST("/logout", controllers.LogoutManajemen)                                      // Keluar dari portal
		auth.POST("/ping", controllers.PingManajemen)                                          // Ping sesi login
		auth.PUT("/ganti-password", controllers.GantiPasswordManajemen)                        // Ubah sandi akun
		auth.GET("/riwayat-login", controllers.GetRiwayatLoginManajemen)                       // Riwayat aktivitas login

		// Profil Akun Manajemen
		auth.GET("/profile", func(c *gin.Context) {                                           // Data ringkas token sesi
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
		})
		auth.GET("/me", controllers.GetProfilManajemen)                                        // Profil lengkap user login
		auth.PUT("/me", controllers.UpdateProfilManajemen)                                     // Perbarui profil
		auth.POST("/upload-foto", controllers.UploadFotoProfilManajemen)                       // Unggah foto profil
		auth.DELETE("/hapus-foto", controllers.HapusFotoProfilManajemen)                       // Hapus foto profil
		auth.POST("/request-ganti-email", controllers.RequestGantiEmailManajemen)              // Request OTP ganti email
		auth.POST("/verifikasi-ganti-email", controllers.VerifikasiGantiEmailManajemen)        // Verifikasi OTP ganti email

		// Data Referensi Umum (Bisa diakses seluruh role manajemen)
		auth.GET("/template-rapor/aktif", controllers.GetTemplateRaporAktif)                  // Template rapor aktif
		auth.GET("/hari-libur", controllers.GetAllHariLibur)                                   // Kalender hari libur operasional
		auth.GET("/jam-kerja", controllers.GetAllJamKerja)                                     // Jam kerja resmi kantor

		// Modul Notifikasi In-App Bersama
		setupNotifikasiRoutes(auth)

		// ── 3.3 Sub-Modul Role Mentor ──
		setupMentorRoutes(auth)

		// ── 3.4 Sub-Modul Role Peserta Magang ──
		setupPesertaRoutes(auth)

		// ── 3.5 Sub-Modul Role Admin / Pengelola Sistem ──
		setupAdminRoutes(auth)
	}
}

// ==============================================================================
// 4. SUB-MODUL NOTIFIKASI IN-APP (BERSAMA)
// ==============================================================================
func setupNotifikasiRoutes(rg *gin.RouterGroup) {
	notif := rg.Group("/notifikasi")
	{
		notif.GET("", controllers.GetNotifikasiSaya)                      // Daftar notifikasi pengguna login
		notif.GET("/unread-count", controllers.GetUnreadNotifikasiCount)   // Hitung jumlah notifikasi belum dibaca
		notif.PUT("/:id/baca", controllers.BacaNotifikasi)                 // Tandai satu notifikasi telah dibaca
		notif.PUT("/semua/baca", controllers.BacaSemuaNotifikasi)          // Tandai seluruh notifikasi telah dibaca
		notif.DELETE("/semua/hapus", controllers.HapusSemuaNotifikasi)     // Hapus seluruh notifikasi saya
		notif.DELETE("/:id", controllers.HapusNotifikasi)                  // Hapus satu notifikasi
		notif.POST("/test", controllers.KirimNotifikasiTest)               // Simulasi pengiriman notifikasi test
	}
}

// ==============================================================================
// 5. SUB-MODUL ROLE MENTOR PEMBIMBING
// ==============================================================================
func setupMentorRoutes(rg *gin.RouterGroup) {
	mentor := rg.Group("/mentor", middlewares.RoleMiddleware("mentor"))
	{
		// Cek Akses Dashboard Mentor
		mentor.GET("/dashboard", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "message": "Dashboard mentor berhasil diakses"})
		})

		// Antrean Bimbingan & Daftar Peserta
		mentor.GET("/antrean/hitungan", controllers.GetHitunganAntreanMentor)                  // Hitungan badge antrean tugas/izin
		mentor.GET("/peserta", controllers.GetPesertaBimbinganSaya)                            // Daftar peserta bimbingan aktif

		// Monitoring Presensi & Persetujuan Izin Peserta
		mentor.GET("/presensi", controllers.GetPresensiMentor)                                 // Daftar log presensi peserta
		mentor.GET("/presensi/statistik", controllers.GetStatistikPresensiMentor)              // Statistik kehadiran peserta
		mentor.PUT("/presensi/:id", controllers.UpdatePresensiMentor)                          // Koreksi status presensi peserta
		mentor.GET("/pengajuan-izin", controllers.GetPengajuanIzinMentor)                      // Daftar pengajuan izin peserta
		mentor.GET("/pengajuan-izin/statistik", controllers.GetStatistikPengajuanIzinMentor)  // Statistik izin/sakit
		mentor.PUT("/pengajuan-izin/:id", controllers.ProsesPengajuanIzinMentor)               // Setujui / tolak pengajuan izin

		// Penilaian Aspek Teknis & Non-Teknis Peserta Bimbingan
		mentor.GET("/penilaian", controllers.GetPesertaBimbinganPenilaian)                      // Ringkasan status penilaian bimbingan
		mentor.GET("/penilaian/:peserta_id", controllers.GetDetailPenilaianPeserta)            // Form detail nilai peserta
		mentor.POST("/penilaian/:peserta_id", controllers.SimpanPenilaianPeserta)              // Simpan evaluasi nilai peserta

		// Materi Pembelajaran Bimbingan Mentor
		mentor.GET("/materi", controllers.GetMateriMentor)                                     // Daftar materi buatan mentor
		mentor.GET("/materi/kategori", controllers.GetKategoriMateri)                          // Kategori materi bimbingan
		mentor.POST("/materi/kategori", controllers.CreateKategoriMateri)                      // Tambah kategori materi baru
		mentor.PUT("/materi/kategori/:id", controllers.UpdateKategoriMateri)                  // Ubah kategori materi
		mentor.DELETE("/materi/kategori/:id", controllers.DeleteKategoriMateri)               // Hapus kategori materi
		mentor.GET("/materi/peserta-bimbingan", controllers.GetPesertaBimbinganUntukMateri)    // Opsi target peserta materi
		mentor.POST("/materi", controllers.CreateMateriMentor)                                 // Terbitkan materi pembelajaran baru
		mentor.PUT("/materi/:id", controllers.UpdateMateriMentor)                              // Perbarui materi pembelajaran
		mentor.DELETE("/materi/:id", controllers.DeleteMateriMentor)                           // Hapus materi pembelajaran

		// Penugasan Magang & Kuis Interaktif
		mentor.GET("/tugas", controllers.GetTugasMentor)                                       // Daftar tugas & kuis buatan mentor
		mentor.GET("/tugas/peserta-bimbingan", controllers.GetPesertaBimbinganUntukTugas)      // Opsi target peserta penugasan
		mentor.POST("/tugas", controllers.CreateTugasMentor)                                   // Buat penugasan / kuis baru
		mentor.PUT("/tugas/:id", controllers.UpdateTugasMentor)                                // Perbarui penugasan / kuis
		mentor.DELETE("/tugas/:id", controllers.DeleteTugasMentor)                             // Hapus tugas & berkas lampirannya
		mentor.GET("/tugas/:id/pengumpulan", controllers.GetPengumpulanTugasMentor)            // Lihat hasil kumpul tugas peserta
		mentor.POST("/tugas/pengumpulan/:pengumpulan_id/review", controllers.ReviewPengumpulanTugasMentor) // Nilai / beri revisi tugas
		mentor.POST("/tugas/nilai-nol", controllers.SetNilaiNolTugasMentor)                    // Tetapkan nilai 0 bagi yang lewat batas

		// Verifikasi Laporan Akhir Magang
		mentor.GET("/laporan-akhir", controllers.GetLaporanAkhirMentor)                        // Daftar laporan akhir bimbingan
		mentor.POST("/laporan-akhir/:pendaftaran_id/verifikasi", controllers.VerifikasiLaporanAkhirMentor) // ACC / minta revisi laporan
		mentor.POST("/laporan-akhir/:pendaftaran_id/pengingat", controllers.KirimPengingatLaporanMentor)   // Kirim email pengingat laporan
	}
}

// ==============================================================================
// 6. SUB-MODUL ROLE PESERTA MAGANG
// ==============================================================================
func setupPesertaRoutes(rg *gin.RouterGroup) {
	peserta := rg.Group("/peserta", middlewares.RoleMiddleware("peserta"))
	{
		// ── 6.1 Akses Informasi & Riwayat (Terbuka untuk Peserta Aktif & Alumni Selesai Magang) ──
		peserta.GET("/dashboard", controllers.GetDashboardPeserta)                             // Ringkasan dashboard peserta
		peserta.GET("/presensi/hari-ini", controllers.GetStatusPresensiHariIni)                // Cek status presensi hari ini
		peserta.GET("/presensi/riwayat", controllers.GetRiwayatPresensiSaya)                   // Riwayat presensi kehadiran saya
		peserta.GET("/pengajuan-izin", controllers.GetPengajuanIzinSaya)                       // Riwayat pengajuan izin/sakit saya
		peserta.GET("/penilaian", controllers.GetNilaiSaya)                                     // Lihat transkrip nilai magang saya
		peserta.GET("/sertifikat", controllers.GetSertifikatPesertaSaya)                       // Unduh e-sertifikat kelulusan magang
		peserta.GET("/logbook", controllers.GetLogbookPeserta)                                 // Riwayat catatan logbook kegiatan
		peserta.GET("/materi", controllers.GetMateriPeserta)                                   // Modul & materi pembelajaran bimbingan
		peserta.GET("/tugas", controllers.GetTugasPeserta)                                     // Daftar penugasan & kuis magang
		peserta.GET("/laporan-akhir", controllers.GetLaporanAkhirPeserta)                       // Cek status pengumpulan laporan akhir
		peserta.POST("/laporan-akhir", controllers.UploadLaporanAkhirPeserta)                  // Unggah dokumen laporan akhir magang
		peserta.POST("/upload-dokumen", controllers.UploadDokumenPeserta)                      // Unggah dokumen persyaratan profil

		// ── 6.2 Aksi Harian Khusus Peserta yang Masih Berstatus Magang Aktif ──
		aktif := peserta.Group("", middlewares.MagangAktifMiddleware())
		{
			aktif.POST("/presensi/masuk", controllers.PresensiMasuk)                           // Presensi masuk (selfie + GPS geofence)
			aktif.POST("/presensi/pulang", controllers.PresensiPulang)                         // Presensi pulang (selfie + GPS geofence)
			aktif.POST("/pengajuan-izin", controllers.BuatPengajuanIzin)                       // Ajukan permohonan izin / sakit baru
			aktif.DELETE("/pengajuan-izin/:id", controllers.BatalkanPengajuanIzin)             // Batalkan izin yang masih pending
			aktif.PUT("/logbook/:id", controllers.UpdateLogbookPeserta)                        // Tulis / perbarui logbook harian
			aktif.POST("/tugas/:id/kumpul", controllers.KumpulTugasPeserta)                    // Kumpulkan berkas tugas magang
			aktif.POST("/tugas/:id/kumpul-kuis", controllers.KumpulKuisPeserta)                // Kirim jawaban kuis pilihan ganda
		}
	}
}

// ==============================================================================
// 7. SUB-MODUL ROLE ADMIN / PENGELOLA SISTEM
// ==============================================================================
func setupAdminRoutes(rg *gin.RouterGroup) {
	admin := rg.Group("/admin", middlewares.RoleMiddleware("admin"))
	{
		// Cek Akses Dashboard Admin
		admin.GET("/dashboard", func(c *gin.Context) {
			c.JSON(200, gin.H{"success": true, "message": "Dashboard admin berhasil diakses"})
		})

		// Ringkasan Statistik & Antrean Tindakan Admin
		admin.GET("/dashboard/ringkasan", controllers.GetRingkasanDashboardAdmin)              // Statistik ringkas angka dashboard
		admin.GET("/antrean/hitungan", controllers.AdminHitunganAntrean)                        // Badge antrean verifikasi tertunda
		admin.GET("/bantuan/hitungan", controllers.AdminHitunganBantuan)                        // Badge pesan bantuan & FAQ masuk

		// Kelola Akun Portal Manajemen (Admin & Mentor)
		admin.GET("/akun", controllers.GetAllUserManajemen)                                     // Daftar seluruh akun manajemen
		admin.POST("/akun", controllers.RegisterManajemen)                                      // Buat akun admin / mentor baru
		admin.PUT("/akun/:id", controllers.UpdateUserManajemen)                                 // Edit profil akun manajemen
		admin.PUT("/akun/:id/status", controllers.UpdateStatusUserManajemen)                    // Aktifkan / nonaktifkan akun
		admin.PUT("/akun/:id/bidang", controllers.AssignBidangMentor)                           // Tetapkan bidang bimbingan mentor
		admin.GET("/mentor/:id/peserta", controllers.GetPesertaBimbinganMentor)                 // Lihat peserta bimbingan mentor
		admin.POST("/akun/:id/foto", controllers.UploadFotoUserManajemen)                       // Unggah foto akun manajemen
		admin.GET("/akun/:id/cek-hapus", controllers.CekUserBisaDihapus)                        // Validasi relasi sebelum hapus
		admin.DELETE("/akun/:id", controllers.DeleteUserManajemen)                              // Hapus akun manajemen

		// Master Data Bidang Magang
		admin.GET("/bidang", controllers.GetAllBidang)                                          // Daftar seluruh master bidang
		admin.POST("/bidang", controllers.CreateBidang)                                         // Tambah bidang baru
		admin.PUT("/bidang/:id", controllers.UpdateBidang)                                      // Edit nama / kuota bidang
		admin.PATCH("/bidang/:id/toggle-status", controllers.ToggleStatusBidang)                // Aktif/nonaktifkan pendaftaran bidang
		admin.GET("/bidang/:id/cek-hapus", controllers.CekBidangBisaDihapus)                    // Cek apakah bidang sedang dipakai
		admin.DELETE("/bidang/:id", controllers.DeleteBidang)                                   // Hapus bidang magang

		// Pengaturan Jam Kerja & Hari Libur Kalender
		admin.GET("/jam-kerja", controllers.GetAllJamKerja)                                     // Daftar jam masuk & pulang kantor
		admin.PUT("/jam-kerja/:id", controllers.UpdateJamKerja)                                 // Perbarui jam kerja
		admin.GET("/hari-libur", controllers.GetAllHariLibur)                                   // Daftar hari libur manual & nasional
		admin.POST("/hari-libur", controllers.CreateHariLibur)                                  // Tambah hari libur manual
		admin.PUT("/hari-libur/:id", controllers.UpdateHariLibur)                               // Edit hari libur
		admin.DELETE("/hari-libur/:id", controllers.DeleteHariLibur)                            // Hapus hari libur
		admin.POST("/hari-libur/sync-nasional", controllers.SyncHariLiburNasional)              // Sinkronisasi libur nasional dari API

		// Monitoring & Rekapitulasi Presensi Peserta
		admin.GET("/presensi", controllers.GetAllPresensi)                                      // Data presensi seluruh peserta
		admin.GET("/presensi/statistik", controllers.GetStatistikPresensi)                      // Statistik kehadiran global
		admin.GET("/presensi/opsi-filter", controllers.GetOpsiFilterPresensi)                   // Opsi filter bidang/jenjang/status
		admin.GET("/presensi/rekap", controllers.GetRekapPresensi)                              // Rekap total hadir, izin, sakit, alpa
		admin.GET("/presensi/rekap/matriks", controllers.GetMatriksPresensi)                    // Rekap matriks tanggal vs peserta
		admin.GET("/presensi/rekap/:peserta_id", controllers.GetRekapPeserta)                   // Detail rekap per individu
		admin.GET("/presensi/:id", controllers.GetPresensi)                                     // Detail satu catatan presensi

		// Pengaturan Standar Bobot & Rekap Penilaian
		admin.GET("/pengaturan-penilaian", controllers.GetPengaturanPenilaian)                  // Bobot aspek teknis & non-teknis
		admin.PUT("/pengaturan-penilaian", controllers.UpdatePengaturanPenilaian)               // Perbarui bobot penilaian
		admin.GET("/penilaian", controllers.GetAllRekapPenilaianAdmin)                          // Rekap seluruh nilai peserta magang
		admin.GET("/penilaian/:peserta_id", controllers.GetDetailPenilaianPeserta)              // Detail nilai satu peserta

		// Desain & Manajemen Template Rapor Transkrip
		admin.GET("/template-rapor", controllers.GetAllTemplateRapor)                           // Daftar template rapor nilai
		admin.GET("/template-rapor/aktif", controllers.GetTemplateRaporAktif)                   // Template rapor yang sedang aktif
		admin.GET("/template-rapor/:id", controllers.GetTemplateRapor)                          // Detail konfigurasi template rapor
		admin.POST("/template-rapor", controllers.CreateTemplateRapor)                          // Tambah template rapor baru
		admin.PUT("/template-rapor/:id", controllers.UpdateTemplateRapor)                       // Edit template rapor
		admin.DELETE("/template-rapor/:id", controllers.DeleteTemplateRapor)                    // Hapus template rapor
		admin.PUT("/template-rapor/:id/default", controllers.SetDefaultTemplateRapor)           // Tetapkan sebagai template utama
		admin.POST("/template-rapor/:id/duplikat", controllers.DuplikatTemplateRapor)          	// Gandakan template rapor
		admin.POST("/template-rapor/:id/upload/:jenis", controllers.UploadFileTemplateRapor)    // Unggah background/kop rapor
		admin.DELETE("/template-rapor/:id/upload/:jenis", controllers.DeleteFileTemplateRapor) 	// Hapus background/kop rapor

		// Seleksi & Verifikasi Berkas Pendaftaran Magang
		admin.GET("/pendaftaran", controllers.GetAllPendaftaranMagang)                          // Daftar seluruh berkas pendaftar
		admin.GET("/pendaftaran/:id", controllers.GetDetailPendaftaranMagang)                   // Detail berkas & lampiran pendaftar
		admin.PUT("/pendaftaran/:id/status", controllers.UpdateStatusPendaftaranMagang)         // Terima / Tolak / Minta Revisi berkas

		// Penerbitan Akun Login Peserta Magang (Setelah Diterima)
		admin.POST("/pendaftaran/:id/buat-akun-peserta", controllers.CreateAkunPeserta)         // Generate akun peserta magang
		admin.GET("/akun-peserta", controllers.GetAllAkunPeserta)                               // Daftar seluruh akun peserta
		admin.GET("/akun-peserta/:id", controllers.GetDetailAkunPeserta)                        // Detail data akun peserta
		admin.PUT("/akun-peserta/:id/mentor", controllers.AssignMentorPeserta)                  // Tetapkan / ganti mentor pembimbing

		// Pembuatan & Pengiriman Surat Penerimaan
		admin.GET("/surat-penerimaan", controllers.GetAllSuratPenerimaan)                       // Riwayat surat penerimaan magang
		admin.GET("/surat-penerimaan/:id", controllers.GetSuratPenerimaan)                      // Detail data surat penerimaan
		admin.GET("/surat-penerimaan/:id/unduh", controllers.DownloadSuratPenerimaan)           // Download PDF resmi surat
		admin.POST("/surat-penerimaan", controllers.CreateSuratPenerimaan)                      // Terbitkan surat penerimaan baru
		admin.POST("/surat-penerimaan/:id/kirim-email", controllers.KirimUlangEmailSuratPenerimaan) // Kirim ulang email surat
		admin.POST("/surat-penerimaan/pratinjau", controllers.PratinjauSuratPenerimaan)         // Pratinjau draf PDF sebelum cetak
		admin.PUT("/surat-penerimaan/:id", controllers.UpdateSuratPenerimaan)                   // Perbarui isi surat penerimaan
		admin.DELETE("/surat-penerimaan/:id", controllers.DeleteSuratPenerimaan)                // Batalkan / hapus surat penerimaan

		// Pengaturan & Desain Tata Letak Surat Penerimaan
		admin.GET("/pengaturan-surat", controllers.GetPengaturanSuratPenerimaan)                // Pengaturan kop, nomor, penandatangan
		admin.PUT("/pengaturan-surat", controllers.UpdatePengaturanSuratPenerimaan)             // Perbarui pengaturan surat
		admin.POST("/pengaturan-surat/upload/:jenis", controllers.UploadFilePengaturanSurat)    // Unggah kop / ttd surat
		admin.DELETE("/pengaturan-surat/upload/:jenis", controllers.DeleteFilePengaturanSurat)  // Hapus kop / ttd surat
		admin.GET("/template-surat", controllers.GetAllTemplateSurat)                           // Daftar template surat
		admin.GET("/template-surat/bawaan", controllers.GetTataLetakBawaanSurat)                // Tata letak default surat
		admin.GET("/template-surat/:id", controllers.GetTemplateSurat)                          // Detail konfigurasi template surat
		admin.POST("/template-surat", controllers.CreateTemplateSurat)                          // Buat template surat baru
		admin.PUT("/template-surat/:id", controllers.UpdateTemplateSurat)                       // Edit template surat
		admin.DELETE("/template-surat/:id", controllers.DeleteTemplateSurat)                    // Hapus template surat
		admin.POST("/template-surat/:id/duplikat", controllers.DuplikatTemplateSurat)          // Duplikat template surat
		admin.GET("/template-surat/:id/pratinjau", controllers.PratinjauTemplateSurat)         // Pratinjau template surat
		admin.GET("/template-surat/:id/peta", controllers.PetaTemplateSurat)                    // Peta posisi koordinat elemen
		admin.POST("/template-surat/:id/upload/:jenis", controllers.UploadFileTemplateSurat)    // Unggah aset template surat
		admin.DELETE("/template-surat/:id/upload/:jenis", controllers.DeleteFileTemplateSurat)  // Hapus aset template surat

		// Kelola & Terbitkan E-Sertifikat Magang
		admin.GET("/sertifikat", controllers.GetAllSertifikat)                                  // Daftar sertifikat yang diterbitkan
		admin.POST("/sertifikat", controllers.CreateSertifikat)                                 // Terbitkan nomor & berkas sertifikat
		admin.PUT("/sertifikat/:id", controllers.UpdateSertifikat)                              // Edit data sertifikat
		admin.DELETE("/sertifikat/:id", controllers.DeleteSertifikat)                           // Batalkan / hapus sertifikat
		admin.GET("/pengaturan-sertifikat", controllers.GetPengaturanSertifikat)                // Konfigurasi dasar sertifikat
		admin.PUT("/pengaturan-sertifikat", controllers.UpdatePengaturanSertifikat)             // Edit konfigurasi dasar
		admin.POST("/pengaturan-sertifikat/upload/:jenis", controllers.UploadFilePengaturanSertifikat) // Unggah aset sertifikat
		admin.DELETE("/pengaturan-sertifikat/upload/:jenis", controllers.DeleteFilePengaturanSertifikat) // Hapus aset sertifikat
		admin.GET("/template-sertifikat", controllers.GetAllTemplateSertifikat)                 // Daftar template sertifikat
		admin.GET("/template-sertifikat/:id", controllers.GetTemplateSertifikat)                 // Detail template sertifikat
		admin.POST("/template-sertifikat", controllers.CreateTemplateSertifikat)                 // Buat template baru
		admin.PUT("/template-sertifikat/:id", controllers.UpdateTemplateSertifikat)              // Edit template sertifikat
		admin.DELETE("/template-sertifikat/:id", controllers.DeleteTemplateSertifikat)           // Hapus template sertifikat
		admin.POST("/template-sertifikat/:id/upload/:jenis", controllers.UploadFileTemplateSertifikat) // Unggah background sertifikat
		admin.DELETE("/template-sertifikat/:id/upload/:jenis", controllers.DeleteFileTemplateSertifikat) // Hapus background sertifikat

		// Kelola Tampilan & Konten Landing Page Publik
		admin.GET("/pengaturan-landing", controllers.GetPengaturanLanding)                      // Identitas instansi & kontak publik
		admin.PUT("/pengaturan-landing", controllers.UpdatePengaturanLanding)                   // Perbarui identitas landing
		admin.POST("/pengaturan-landing/upload/:jenis", controllers.UploadFilePengaturanLanding) // Unggah logo / favicon
		admin.DELETE("/pengaturan-landing/upload/:jenis", controllers.DeleteFilePengaturanLanding) // Hapus logo / favicon
		admin.GET("/hero-slide", controllers.GetHeroSlides)                                     // Banner slide hero landing
		admin.POST("/hero-slide", controllers.CreateHeroSlide)                                  // Tambah slide hero baru
		admin.PUT("/hero-slide/:id", controllers.UpdateHeroSlide)                               // Edit slide hero
		admin.DELETE("/hero-slide/:id", controllers.DeleteHeroSlide)                            // Hapus slide hero
		admin.GET("/bidang-tampilan", controllers.GetTampilanBidang)                            // Pengaturan kartu bidang di landing
		admin.PUT("/bidang-tampilan/:id", controllers.UpdateTampilanBidang)                     // Edit tampilan kartu bidang
		admin.GET("/landing-konten/:jenis", controllers.GetKontenLanding)                       // Konten benefit, alur, syarat, dll
		admin.POST("/landing-konten/:jenis", controllers.CreateKontenLanding)                   // Tambah item konten
		admin.PUT("/landing-konten/:jenis/urutan", controllers.UrutkanKontenLanding)            // Urutkan item konten
		admin.PUT("/landing-konten-item/:id", controllers.UpdateKontenLanding)                  // Edit satu item konten
		admin.DELETE("/landing-konten-item/:id", controllers.DeleteKontenLanding)               // Hapus satu item konten
		admin.GET("/landing-menu", controllers.GetMenuLanding)                                  // Menu navigasi header landing
		admin.PUT("/landing-menu/urutan", controllers.UrutkanMenuLanding)                       // Urutkan navigasi menu
		admin.PUT("/landing-menu/:id", controllers.UpdateMenuLanding)                           // Edit label navigasi menu

		// Customer Service Chat Support (Admin Helpdesk)
		admin.GET("/chat/sessions", controllers.AdminGetChatSessions)                           // Daftar sesi chat masuk dari pendaftar
		admin.GET("/chat/session/:id/messages", controllers.AdminGetSessionMessages)            // Muat seluruh percakapan sesi
		admin.POST("/chat/session/:id/reply", controllers.AdminReplyChatSession)                // Balas percakapan chat
		admin.PUT("/chat/session/:id/close", controllers.AdminCloseChatSession)                 // Tutup / selesaikan sesi chat
		admin.POST("/chat/session/:id/lampiran", controllers.AdminKirimLampiran)                // Kirim dokumen / foto lampiran
		admin.PUT("/chat/session/:id/sematkan", controllers.AdminSematkanSesi)                  // Pin / sematkan sesi prioritas
		admin.PUT("/chat/session/:id/tandai-belum-dibaca", controllers.AdminTandaiBelumDibaca)  // Tandai sesi belum terbaca
		admin.DELETE("/chat/pesan/:id", controllers.AdminHapusPesan)                            // Hapus pesan tertentu

		// Manajemen Basis Pengetahuan FAQ
		admin.GET("/faq", controllers.AdminGetFAQ)                                              // Daftar seluruh data FAQ
		admin.POST("/faq", controllers.AdminCreateFAQ)                                          // Tambah butir FAQ baru
		admin.GET("/faq/pratinjau", controllers.AdminPratinjauQuickAction)                      // Pratinjau tampilan quick action
		admin.GET("/faq/analitik", controllers.AdminAnalitikFaq)                                // Analitik pertanyaan paling dicari
		admin.GET("/faq/ekspor", controllers.AdminEksporFaqCSV)                                 // Ekspor daftar FAQ ke format CSV
		admin.GET("/faq/contoh-impor", controllers.AdminContohImporCSV)                         // Unduh berkas format contoh CSV
		admin.POST("/faq/massal", controllers.AdminAksiMassalFAQ)                               // Aksi hapus / aktifkan massal
		admin.POST("/faq/impor", controllers.AdminImporFaqCSV)                                  // Impor data FAQ dari CSV
		admin.PUT("/faq/urutan", controllers.AdminReorderFAQ)                                   // Urutkan posisi tampilan FAQ
		admin.PUT("/faq/:id", controllers.AdminUpdateFAQ)                                       // Edit isi pertanyaan & jawaban
		admin.DELETE("/faq/:id", controllers.AdminDeleteFAQ)                                    // Hapus FAQ

		// Pengelolaan Pertanyaan Masuk Pengunjung (Inbox Bahan FAQ Baru)
		admin.GET("/pertanyaan-faq", controllers.AdminGetPertanyaanFaq)                         // Daftar pertanyaan belum terjawab
		admin.PUT("/pertanyaan-faq/:id", controllers.AdminUpdatePertanyaanFaq)                  // Perbarui status pertanyaan
		admin.POST("/pertanyaan-faq/:id/balas", controllers.AdminBalasPertanyaanFaq)           // Balas pertanyaan via email
		admin.DELETE("/pertanyaan-faq/:id", controllers.AdminDeletePertanyaanFaq)               // Hapus pertanyaan pengunjung
	}
}
