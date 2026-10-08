// ==============================================================================
// CONTROLLER: NOTIFIKASI CONTROLLER
// DESKRIPSI : Pengelolaan sistem notifikasi in-app untuk seluruh pengguna manajemen
//             (Admin, Mentor, Peserta). Termasuk sinkronisasi otomatis notifikasi
//             tugas, izin, laporan akhir, penandaan baca, dan pembersihan notifikasi.
// ROLE TERKAIT: [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// ==============================================================================

package controllers

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

func filterNotifikasi(c *gin.Context) (role string, userID uint) {
	role = c.GetString("role")
	userID = uint(c.GetFloat64("user_id"))
	return
}

var namaBulanSingkatID = map[string]string{
	"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun",
	"07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
}

func formatTglIndoSingkat(raw string) string {
	if raw == "" {
		return ""
	}
	tgl := strings.Split(raw, "T")[0]
	parts := strings.Split(tgl, "-")
	if len(parts) == 3 {
		bln := namaBulanSingkatID[parts[1]]
		if bln == "" {
			bln = parts[1]
		}
		d := strings.TrimPrefix(parts[2], "0")
		return fmt.Sprintf("%s %s %s", d, bln, parts[0])
	}
	return raw
}

func formatRentangTglIndo(mulai, selesai string) string {
	fMulai := formatTglIndoSingkat(mulai)
	fSelesai := formatTglIndoSingkat(selesai)
	if fMulai == "" {
		return fSelesai
	}
	if fSelesai == "" || fMulai == fSelesai {
		return fMulai
	}
	return fmt.Sprintf("%s s/d %s", fMulai, fSelesai)
}

// sinkronkanNotifikasiMentorIzin memastikan notifikasi in-app untuk pengajuan izin
// berstatus 'menunggu' selalu sinkron dan muncul di lonceng mentor pembimbing.
func sinkronkanNotifikasiMentorIzin(mentorID uint) {
	type IzinMenunggu struct {
		ID             uint
		PesertaID      uint
		NamaPeserta    string
		Jenis          string
		TanggalMulai   string
		TanggalSelesai string
		CreatedAt      time.Time
	}

	var izins []IzinMenunggu
	config.DB.Table("pengajuan_izins pi").
		Select("pi.id, pi.peserta_id, u.nama as nama_peserta, pi.jenis, pi.tanggal_mulai, pi.tanggal_selesai, pi.created_at").
		Joins("JOIN user_manajemens u ON u.id = pi.peserta_id").
		Joins("JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
		Where("p.mentor_id = ? AND pi.status = 'menunggu'", mentorID).
		Scan(&izins)

	for _, iz := range izins {
		var count int64
		config.DB.Model(&models.Notifikasi{}).
			Where("target_role = 'mentor' AND target_user_id = ? AND tipe = 'pengajuan_izin' AND ref_tabel = 'pengajuan_izins' AND ref_id = ?", mentorID, iz.ID).
			Count(&count)

		namaJenis := "Izin"
		if iz.Jenis == "sakit" {
			namaJenis = "Izin Sakit"
		}
		rentangTgl := formatRentangTglIndo(iz.TanggalMulai, iz.TanggalSelesai)
		pesanBaru := fmt.Sprintf("Peserta %s mengajukan %s (%s). Memerlukan verifikasi Anda.", iz.NamaPeserta, strings.ToLower(namaJenis), rentangTgl)

		if count == 0 {
			notif := models.Notifikasi{
				TargetRole:   "mentor",
				TargetUserID: &mentorID,
				Tipe:         "pengajuan_izin",
				Prioritas:    "tinggi",
				Judul:        fmt.Sprintf("Verifikasi %s Baru", namaJenis),
				Pesan:        pesanBaru,
				RefTabel:     "pengajuan_izins",
				RefID:        &iz.ID,
				UrlTujuan:    "/mentor/pengajuan-izin",
				CreatedAt:    iz.CreatedAt,
				UpdatedAt:    iz.CreatedAt,
			}
			config.DB.Create(&notif)
		} else {
			// Perbarui pesan jika ada notifikasi lama yang masih memuat format tanggal ISO panjang
			config.DB.Model(&models.Notifikasi{}).
				Where("target_role = 'mentor' AND target_user_id = ? AND tipe = 'pengajuan_izin' AND ref_tabel = 'pengajuan_izins' AND ref_id = ? AND pesan LIKE '%T00:%'", mentorID, iz.ID).
				Update("pesan", pesanBaru)
		}
	}

	// Otomatis tandai sudah dibaca notifikasi izin yang statusnya sudah bukan 'menunggu' (disetujui/ditolak)
	config.DB.Exec(`
		UPDATE notifikasis n
		JOIN pengajuan_izins pi ON pi.id = n.ref_id
		SET n.dibaca_pada = NOW()
		WHERE n.target_role = 'mentor'
		  AND n.target_user_id = ?
		  AND n.tipe = 'pengajuan_izin'
		  AND n.ref_tabel = 'pengajuan_izins'
		  AND n.dibaca_pada IS NULL
		  AND pi.status != 'menunggu'
	`, mentorID)

	// Bersihkan notifikasi untuk pengajuan izin yang sudah dihapus / dibatalkan
	config.DB.Exec(`
		DELETE n FROM notifikasis n
		LEFT JOIN pengajuan_izins pi ON pi.id = n.ref_id
		WHERE n.target_role = 'mentor'
		  AND n.target_user_id = ?
		  AND n.tipe = 'pengajuan_izin'
		  AND n.ref_tabel = 'pengajuan_izins'
		  AND pi.id IS NULL
	`, mentorID)
}

// sinkronkanNotifikasiMentorTugas memastikan notifikasi in-app untuk pengumpulan tugas
// berstatus 'menunggu' selalu sinkron dan muncul di lonceng mentor pembimbing.
func sinkronkanNotifikasiMentorTugas(mentorID uint) {
	type TugasMenunggu struct {
		ID          uint      `gorm:"column:id"`
		PesertaID   uint      `gorm:"column:peserta_id"`
		NamaPeserta string    `gorm:"column:nama_peserta"`
		TugasID     uint      `gorm:"column:tugas_id"`
		JudulTugas  string    `gorm:"column:judul_tugas"`
		TipeTugas   string    `gorm:"column:tipe_tugas"`
		CreatedAt   time.Time `gorm:"column:created_at"`
	}

	var list []TugasMenunggu
	config.DB.Table("pengumpulan_tugas pt").
		Select("pt.id, pt.peserta_id, u.nama as nama_peserta, tm.id as tugas_id, tm.judul as judul_tugas, tm.tipe_tugas as tipe_tugas, pt.created_at").
		Joins("JOIN user_manajemens u ON u.id = pt.peserta_id").
		Joins("JOIN tugas_magangs tm ON tm.id = pt.tugas_id").
		Where("(tm.mentor_id = ? OR pt.peserta_id IN (SELECT akun_peserta_id FROM pendaftaran_magangs WHERE mentor_id = ? AND status_pendaftaran = 'diterima')) AND pt.status = 'menunggu'", mentorID, mentorID).
		Scan(&list)

	for _, item := range list {
		var count int64
		config.DB.Model(&models.Notifikasi{}).
			Where("target_role = 'mentor' AND target_user_id = ? AND tipe = 'tugas_dikumpulkan' AND ref_tabel = 'pengumpulan_tugas' AND ref_id = ?", mentorID, item.ID).
			Count(&count)

		judul := "Tugas Baru Dikumpulkan"
		jenisTeks := "tugas"
		if item.TipeTugas == "kuis" {
			judul = "Jawaban Kuis Dikumpulkan"
			jenisTeks = "kuis"
		}
		pesan := fmt.Sprintf("Peserta %s telah mengumpulkan %s '%s'. Memerlukan review/penilaian Anda.", item.NamaPeserta, jenisTeks, item.JudulTugas)
		urlTujuan := fmt.Sprintf("/mentor/tugas/review?tugas_id=%d", item.TugasID)

		if count == 0 {
			notif := models.Notifikasi{
				TargetRole:   "mentor",
				TargetUserID: &mentorID,
				Tipe:         "tugas_dikumpulkan",
				Prioritas:    "normal",
				Judul:        judul,
				Pesan:        pesan,
				RefTabel:     "pengumpulan_tugas",
				RefID:        &item.ID,
				UrlTujuan:    urlTujuan,
				CreatedAt:    item.CreatedAt,
				UpdatedAt:    item.CreatedAt,
			}
			config.DB.Create(&notif)
		}
	}

	// Otomatis tandai sudah dibaca notifikasi tugas yang statusnya sudah bukan 'menunggu' (misal sudah dinilai)
	config.DB.Exec(`
		UPDATE notifikasis n
		JOIN pengumpulan_tugas pt ON pt.id = n.ref_id
		SET n.dibaca_pada = NOW()
		WHERE n.target_role = 'mentor'
		  AND n.target_user_id = ?
		  AND n.tipe = 'tugas_dikumpulkan'
		  AND n.ref_tabel = 'pengumpulan_tugas'
		  AND n.dibaca_pada IS NULL
		  AND pt.status != 'menunggu'
	`, mentorID)

	// Bersihkan notifikasi untuk pengumpulan tugas yang sudah dihapus / reset
	config.DB.Exec(`
		DELETE n FROM notifikasis n
		LEFT JOIN pengumpulan_tugas pt ON pt.id = n.ref_id
		WHERE n.target_role = 'mentor'
		  AND n.target_user_id = ?
		  AND n.tipe = 'tugas_dikumpulkan'
		  AND n.ref_tabel = 'pengumpulan_tugas'
		  AND pt.id IS NULL
	`, mentorID)
}

// sinkronkanNotifikasiMentorLaporan memastikan notifikasi in-app untuk naskah laporan akhir
// yang sudah diunggah peserta bimbingan tetapi belum disetujui selalu sinkron di lonceng mentor.
func sinkronkanNotifikasiMentorLaporan(mentorID uint) {
	type LaporanMenunggu struct {
		ID                uint      `gorm:"column:id"`
		AkunPesertaID     uint      `gorm:"column:akun_peserta_id"`
		NamaPeserta       string    `gorm:"column:nama_peserta"`
		JudulLaporanAkhir string    `gorm:"column:judul_laporan_akhir"`
		CreatedAt         time.Time `gorm:"column:created_at"`
	}

	var list []LaporanMenunggu
	config.DB.Table("pendaftaran_magangs p").
		Select("p.id, p.akun_peserta_id, u.nama as nama_peserta, p.judul_laporan_akhir, p.updated_at as created_at").
		Joins("JOIN user_manajemens u ON u.id = p.akun_peserta_id").
		Joins("LEFT JOIN penilaian_magangs pn ON pn.peserta_id = p.akun_peserta_id").
		Where("p.mentor_id = ? AND p.status_pendaftaran = 'diterima' AND p.file_laporan_akhir != '' AND (pn.laporan_akhir_disetujui IS NULL OR pn.laporan_akhir_disetujui = false)", mentorID).
		Scan(&list)

	for _, item := range list {
		var count int64
		config.DB.Model(&models.Notifikasi{}).
			Where("target_role = 'mentor' AND target_user_id = ? AND tipe = 'laporan_akhir' AND ref_tabel = 'pendaftaran_magangs' AND ref_id = ?", mentorID, item.ID).
			Count(&count)

		pesan := fmt.Sprintf("Peserta %s telah mengunggah Laporan Akhir Magang (%s). Silakan tinjau naskah dan luaran proyeknya.", item.NamaPeserta, item.JudulLaporanAkhir)
		urlTujuan := "/mentor/laporan-akhir"

		if count == 0 {
			notif := models.Notifikasi{
				TargetRole:   "mentor",
				TargetUserID: &mentorID,
				Tipe:         "laporan_akhir",
				Prioritas:    "tinggi",
				Judul:        "Laporan Akhir Menunggu Review",
				Pesan:        pesan,
				RefTabel:     "pendaftaran_magangs",
				RefID:        &item.ID,
				UrlTujuan:    urlTujuan,
				CreatedAt:    item.CreatedAt,
				UpdatedAt:    item.CreatedAt,
			}
			config.DB.Create(&notif)
		}
	}

	// Otomatis tandai sudah dibaca jika laporan akhir sudah disetujui
	config.DB.Exec(`
		UPDATE notifikasis n
		JOIN pendaftaran_magangs p ON p.id = n.ref_id
		JOIN penilaian_magangs pn ON pn.peserta_id = p.akun_peserta_id
		SET n.dibaca_pada = NOW()
		WHERE n.target_role = 'mentor'
		  AND n.target_user_id = ?
		  AND n.tipe = 'laporan_akhir'
		  AND n.ref_tabel = 'pendaftaran_magangs'
		  AND n.dibaca_pada IS NULL
		  AND pn.laporan_akhir_disetujui = true
	`, mentorID)

	// Bersihkan notifikasi untuk laporan akhir yang berkasnya sudah dikosongkan/dihapus
	config.DB.Exec(`
		DELETE n FROM notifikasis n
		JOIN pendaftaran_magangs p ON p.id = n.ref_id
		WHERE n.target_role = 'mentor'
		  AND n.target_user_id = ?
		  AND n.tipe = 'laporan_akhir'
		  AND n.ref_tabel = 'pendaftaran_magangs'
		  AND (p.file_laporan_akhir = '' OR p.file_laporan_akhir IS NULL)
	`, mentorID)
}

// sinkronkanNotifikasiPesertaLaporan memeriksa apakah peserta magang aktif mendekati akhir periode magang
// dan memberikan notifikasi pengingat in-app (H-14, H-7, H-3) untuk mengunggah naskah Laporan Akhir magang.
func sinkronkanNotifikasiPesertaLaporan(pesertaID uint) {
	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ? AND status_pendaftaran = 'diterima'", pesertaID).
		Order("id desc").First(&pendaftaran).Error; err != nil {
		return
	}

	// Cek apakah laporan sudah disetujui mentor
	var nilai models.PenilaianMagang
	laporanDisetujui := false
	if err := config.DB.Where("peserta_id = ?", pesertaID).First(&nilai).Error; err == nil {
		laporanDisetujui = nilai.LaporanAkhirDisetujui
	}

	// Jika laporan sudah disetujui atau berkas laporan sudah diunggah,
	// tandai notifikasi pengingat laporan akhir sebagai sudah dibaca agar tidak terus membebani lonceng/badge
	if laporanDisetujui || pendaftaran.FileLaporanAkhir != "" {
		config.DB.Model(&models.Notifikasi{}).
			Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'laporan_akhir' AND judul LIKE 'Pengingat%' AND dibaca_pada IS NULL", pesertaID).
			Update("dibaca_pada", time.Now())
		return
	}

	if pendaftaran.TanggalSelesai == "" {
		return
	}

	tSelesai, err := time.Parse("2006-01-02", pendaftaran.TanggalSelesai)
	if err != nil {
		return
	}

	now := time.Now()
	diff := tSelesai.Sub(now)
	sisaHari := int(math.Ceil(diff.Hours() / 24))

	// Hanya aktifkan pengingat jika sisa hari <= 14 hari
	if sisaHari > 14 {
		return
	}

	var judul, prioritas, pesan string

	if sisaHari <= 3 {
		prioritas = "tinggi"
		judul = "Pengingat Penting: Laporan Akhir Magang"
		if sisaHari <= 0 {
			pesan = "Periode magang Anda telah berakhir. Segera unggah Laporan Akhir Anda agar nilai akhir dan sertifikat kelulusan dapat diproses oleh mentor."
		} else {
			pesan = fmt.Sprintf("Masa magang Anda tersisa %d hari lagi. Segera unggah naskah Laporan Akhir (format kampus/sekolah Anda) untuk diverifikasi mentor pembimbing.", sisaHari)
		}
	} else if sisaHari <= 7 {
		prioritas = "tinggi"
		judul = "Batas Pengumpulan Laporan Akhir"
		pesan = fmt.Sprintf("Masa magang Anda tersisa %d hari lagi. Segera unggah naskah Laporan Akhir agar mentor pembimbing memiliki waktu cukup untuk mengevaluasi.", sisaHari)
	} else {
		prioritas = "normal"
		judul = "Pengingat Laporan Akhir Magang"
		pesan = fmt.Sprintf("Masa magang Anda tersisa %d hari lagi. Silakan mulai menyusun naskah Laporan Akhir sesuai pedoman kampus/sekolah Anda dan unggah ke SIM Magang.", sisaHari)
	}

	// Cegah duplikasi notifikasi dengan judul yang sama
	var count int64
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'laporan_akhir' AND judul = ?", pesertaID, judul).
		Count(&count)

	if count == 0 {
		notif := models.Notifikasi{
			TargetRole:   "peserta",
			TargetUserID: &pesertaID,
			Tipe:         "laporan_akhir",
			Prioritas:    prioritas,
			Judul:        judul,
			Pesan:        pesan,
			RefTabel:     "pendaftaran_magangs",
			RefID:        &pendaftaran.ID,
			UrlTujuan:    "/peserta/penilaian/laporan",
		}
		config.DB.Create(&notif)
	}
}

// sinkronkanNotifikasiPesertaPresensi memeriksa kehadiran peserta hari ini dan membuat
// notifikasi pengingat presensi masuk / peringatan belum presensi / pengingat pulang.
func sinkronkanNotifikasiPesertaPresensi(pesertaID uint) {
	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		return
	}
	tanggal := utils.TanggalHariIni()
	sekarang := utils.SekarangWIB()
	info := kal.CekHari(tanggal)
	if !info.HariKerja {
		return
	}

	// Cek apakah peserta aktif
	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ? AND status_pendaftaran = 'diterima'", pesertaID).
		Order("id DESC").First(&pendaftaran).Error; err != nil {
		return
	}

	// Cek periode magang
	if pendaftaran.TanggalMulai != "" && tanggal < normalisasiTanggal(pendaftaran.TanggalMulai) {
		return
	}
	if pendaftaran.TanggalSelesai != "" && tanggal > normalisasiTanggal(pendaftaran.TanggalSelesai) {
		return
	}

	// Cek apakah ada izin/sakit yang disetujui pada hari ini
	var countIzin int64
	config.DB.Model(&models.PengajuanIzin{}).
		Where("peserta_id = ? AND status = 'disetujui' AND ? BETWEEN tanggal_mulai AND tanggal_selesai", pesertaID, tanggal).
		Count(&countIzin)
	if countIzin > 0 {
		return
	}

	// Cek baris presensi hari ini
	var presensi models.Presensi
	errPresensi := config.DB.Where("peserta_id = ? AND tanggal = ?", pesertaID, tanggal).First(&presensi).Error

	jamStr := utils.JamSekarang()
	jamMasukJadwal := "07:30"
	if info.JamKerja.JamMasuk != "" {
		jamMasukJadwal = info.JamKerja.JamMasuk
	}
	jamPulangJadwal := "15:30"
	if info.JamKerja.JamPulang != "" {
		jamPulangJadwal = info.JamKerja.JamPulang
	}

	// KONDISI 1: Belum presensi masuk
	if errPresensi != nil || presensi.JamMasuk == nil || *presensi.JamMasuk == "" {
		if jamStr >= "07:15" && jamStr < jamPulangJadwal {
			var countNotif int64
			config.DB.Model(&models.Notifikasi{}).
				Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'presensi_masuk' AND DATE(created_at) = ?", pesertaID, tanggal).
				Count(&countNotif)
			if countNotif == 0 {
				config.DB.Create(&models.Notifikasi{
					TargetRole:   "peserta",
					TargetUserID: &pesertaID,
					Tipe:         "presensi_masuk",
					Prioritas:    "normal",
					Judul:        "Pengingat Presensi Masuk Hari Ini",
					Pesan:        fmt.Sprintf("Jam kerja operasional telah dimulai (jadwal masuk pukul %s WIB). Harap segera melakukan presensi masuk dan swafoto di SIM Magang.", jamMasukJadwal),
					RefTabel:     "presensis",
					UrlTujuan:    "/peserta/presensi",
				})
			}
		} else if jamStr >= jamPulangJadwal {
			// Jam sore hingga malam (misal pukul 15:30 - 23:59)
			var countNotif int64
			config.DB.Model(&models.Notifikasi{}).
				Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'peringatan_belum_presensi' AND DATE(created_at) = ?", pesertaID, tanggal).
				Count(&countNotif)
			if countNotif == 0 {
				config.DB.Create(&models.Notifikasi{
					TargetRole:   "peserta",
					TargetUserID: &pesertaID,
					Tipe:         "peringatan_belum_presensi",
					Prioritas:    "tinggi",
					Judul:        "Peringatan: Anda Belum Melakukan Presensi Hari Ini",
					Pesan:        "Sistem mendeteksi Anda belum melakukan presensi hingga saat ini. Segera lakukan presensi sebelum hari berganti agar tidak tercatat alpa.",
					RefTabel:     "presensis",
					UrlTujuan:    "/peserta/presensi",
				})
			}
		}
	} else {
		// Sudah presensi masuk!
		// Tandai pengingat masuk & peringatan belum presensi hari ini sebagai sudah dibaca jika belum dibaca
		config.DB.Model(&models.Notifikasi{}).
			Where("target_role = 'peserta' AND target_user_id = ? AND tipe IN ('presensi_masuk', 'peringatan_belum_presensi') AND DATE(created_at) = ? AND dibaca_pada IS NULL", pesertaID, tanggal).
			Update("dibaca_pada", sekarang)

		// KONDISI 2: Sudah masuk, tetapi belum pulang setelah jam kepulangan
		if (presensi.JamPulang == nil || *presensi.JamPulang == "") && jamStr >= jamPulangJadwal {
			var countNotif int64
			config.DB.Model(&models.Notifikasi{}).
				Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'presensi_pulang' AND DATE(created_at) = ?", pesertaID, tanggal).
				Count(&countNotif)
			if countNotif == 0 {
				presID := presensi.ID
				config.DB.Create(&models.Notifikasi{
					TargetRole:   "peserta",
					TargetUserID: &pesertaID,
					Tipe:         "presensi_pulang",
					Prioritas:    "normal",
					Judul:        "Pengingat Presensi Pulang & Logbook",
					Pesan:        fmt.Sprintf("Jam operasional kantor telah berakhir (mulai %s WIB). Silakan lakukan presensi pulang dan catat capaian logbook harian Anda.", jamPulangJadwal),
					RefTabel:     "presensis",
					RefID:        &presID,
					UrlTujuan:    "/peserta/presensi",
				})
			}
		} else if presensi.JamPulang != nil && *presensi.JamPulang != "" {
			// Sudah pulang! Tandai notif presensi_pulang hari ini sebagai sudah dibaca
			config.DB.Model(&models.Notifikasi{}).
				Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'presensi_pulang' AND DATE(created_at) = ? AND dibaca_pada IS NULL", pesertaID, tanggal).
				Update("dibaca_pada", sekarang)
		}
	}
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// GetNotifikasiSaya mengambil daftar notifikasi in-app milik pengguna yang sedang login (dapat difilter hanya yang belum dibaca).
// Endpoint: GET /api/manajemen/notifikasi
func GetNotifikasiSaya(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	if role == "mentor" && userID > 0 {
		sinkronkanNotifikasiMentorIzin(userID)
		sinkronkanNotifikasiMentorTugas(userID)
		sinkronkanNotifikasiMentorLaporan(userID)
	} else if role == "peserta" && userID > 0 {
		sinkronkanNotifikasiPesertaLaporan(userID)
		sinkronkanNotifikasiPesertaPresensi(userID)
	} else if role == "admin" || role == "super_admin" {
		services.JalankanPengingatAdmin()
	}

	limit := 20
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	q := config.DB.Where(
		"target_role = ? AND (target_user_id IS NULL OR target_user_id = ?)",
		role, userID,
	)
	if c.Query("only_unread") == "true" {
		q = q.Where("dibaca_pada IS NULL")
	}
	if tipe := c.Query("tipe"); tipe != "" {
		q = q.Where("tipe = ?", tipe)
	}

	var list []models.Notifikasi
	if err := q.Order("created_at DESC").Limit(limit).Find(&list).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil notifikasi")
		return
	}

	var unread int64
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = ? AND (target_user_id IS NULL OR target_user_id = ?) AND dibaca_pada IS NULL", role, userID).
		Count(&unread)

	utils.SuccessResponse(c, http.StatusOK, "Notifikasi berhasil diambil", gin.H{
		"items":        list,
		"unread_count": unread,
	})
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// GetUnreadNotifikasiCount menghitung total notifikasi yang belum dibaca untuk indikator badge merah lonceng navbar.
// Endpoint: GET /api/manajemen/notifikasi/unread-count
func GetUnreadNotifikasiCount(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	if role == "mentor" && userID > 0 {
		sinkronkanNotifikasiMentorIzin(userID)
		sinkronkanNotifikasiMentorTugas(userID)
		sinkronkanNotifikasiMentorLaporan(userID)
	} else if role == "peserta" && userID > 0 {
		sinkronkanNotifikasiPesertaLaporan(userID)
		sinkronkanNotifikasiPesertaPresensi(userID)
	} else if role == "admin" || role == "super_admin" {
		services.JalankanPengingatAdmin()
	}

	var unread int64
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = ? AND (target_user_id IS NULL OR target_user_id = ?) AND dibaca_pada IS NULL", role, userID).
		Count(&unread)

	utils.SuccessResponse(c, http.StatusOK, "Jumlah notifikasi belum dibaca", gin.H{"unread_count": unread})
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// BacaNotifikasi menandai satu notifikasi tertentu sebagai telah dibaca berdasarkan ID notifikasi.
// Endpoint: PUT /api/manajemen/notifikasi/:id/baca
func BacaNotifikasi(c *gin.Context) {
	role, userID := filterNotifikasi(c)
	id := c.Param("id")

	var notif models.Notifikasi
	if err := config.DB.Where(
		"id = ? AND target_role = ? AND (target_user_id IS NULL OR target_user_id = ?)",
		id, role, userID,
	).First(&notif).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Notifikasi tidak ditemukan")
		return
	}

	if notif.DibacaPada == nil {
		now := time.Now()
		notif.DibacaPada = &now
		config.DB.Save(&notif)
	}

	utils.SuccessResponse(c, http.StatusOK, "Notifikasi ditandai sudah dibaca", notif)
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// BacaSemuaNotifikasi menandai seluruh notifikasi yang belum dibaca milik pengguna menjadi sudah dibaca.
// Endpoint: PUT /api/manajemen/notifikasi/baca-semua
func BacaSemuaNotifikasi(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	if err := config.DB.Model(&models.Notifikasi{}).
		Where("target_role = ? AND (target_user_id IS NULL OR target_user_id = ?) AND dibaca_pada IS NULL", role, userID).
		Update("dibaca_pada", time.Now()).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menandai notifikasi")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Semua notifikasi ditandai sudah dibaca", nil)
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// HapusNotifikasi menghapus satu data notifikasi tertentu milik pengguna berdasarkan ID.
// Endpoint: DELETE /api/manajemen/notifikasi/:id
func HapusNotifikasi(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	if err := config.DB.Where(
		"id = ? AND target_role = ? AND (target_user_id IS NULL OR target_user_id = ?)",
		c.Param("id"), role, userID,
	).Delete(&models.Notifikasi{}).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus notifikasi")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Notifikasi berhasil dihapus", nil)
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// HapusSemuaNotifikasi menghapus seluruh riwayat notifikasi milik pengguna yang sedang login.
// Endpoint: DELETE /api/manajemen/notifikasi/semua/hapus
func HapusSemuaNotifikasi(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	if err := config.DB.Where(
		"target_role = ? AND (target_user_id IS NULL OR target_user_id = ?)",
		role, userID,
	).Delete(&models.Notifikasi{}).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus semua notifikasi")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Semua notifikasi berhasil dihapus", nil)
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// KirimNotifikasiTest mengirimkan notifikasi simulasi/uji coba ke akun sendiri untuk memverifikasi fitur lonceng notifikasi web.
// Endpoint: POST /api/manajemen/notifikasi/test
func KirimNotifikasiTest(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	var input struct {
		Tipe      string `json:"tipe"`
		Judul     string `json:"judul"`
		Pesan     string `json:"pesan"`
		UrlTujuan string `json:"url_tujuan"`
	}
	_ = c.ShouldBindJSON(&input)

	if input.Tipe == "" {
		input.Tipe = "sistem"
	}
	if input.Judul == "" {
		input.Judul = "Uji Coba Lonceng Notifikasi Web"
	}
	if input.Pesan == "" {
		input.Pesan = "Preferensi notifikasi Anda berhasil terhubung dan aktif di web manajemen SIM Magang Diskominfo."
	}
	if input.UrlTujuan == "" {
		input.UrlTujuan = "/peserta/akun"
	}

	uid := userID
	notif := models.Notifikasi{
		TargetRole:   role,
		TargetUserID: &uid,
		Tipe:         input.Tipe,
		Prioritas:    "normal",
		Judul:        input.Judul,
		Pesan:        input.Pesan,
		RefTabel:     "user_manajemens",
		RefID:        &uid,
		UrlTujuan:    input.UrlTujuan,
	}

	if err := config.DB.Create(&notif).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengirim notifikasi uji coba")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Notifikasi uji coba berhasil dikirim", notif)
}