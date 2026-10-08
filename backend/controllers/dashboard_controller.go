// ==============================================================================
// CONTROLLER: Dashboard Controller
// DESKRIPSI: Menyediakan data analitik agregat, statistik antrean operasional admin,
//            serta dashboard terpadu bagi peserta magang aktif (presensi, tugas, materi).
// ROLE TERKAIT: [ROLE: ADMIN] & [ROLE: PESERTA]
// ==============================================================================

package controllers

import (
	"math"
	"net/http"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// ==============================================================================
// ── STRUKTUR DATA DASHBOARD ADMIN ─────────────────────────────────────────────
// ==============================================================================

type barisAngka struct {
	Label  string `json:"label"`
	Jumlah int    `json:"jumlah"`
}

type barisKuotaBidang struct {
	Nama   string `json:"nama"`
	Kuota  int    `json:"kuota"`
	Terisi int    `json:"terisi"`
}

type barisBebanMentor struct {
	ID         uint   `json:"id"`
	Nama       string `json:"nama"`
	Bidang     string `json:"bidang"`
	FotoProfil string `json:"foto_profil"`
	Kapasitas  int    `json:"kapasitas"`
	Bimbingan  int    `json:"bimbingan"`
	IsOnline   bool   `json:"is_online"`
}

type barisPesertaBermasalah struct {
	PesertaID  uint   `json:"peserta_id"`
	Nama       string `json:"nama"`
	Bidang     string `json:"bidang"`
	FotoProfil string `json:"foto_profil"`
	Hadir      int    `json:"hadir"`
	Total      int    `json:"total"`
	Persen     int    `json:"persen"`
	IsOnline   bool   `json:"is_online"`
}

type barisAkanSelesai struct {
	PesertaID      uint   `json:"peserta_id"`
	Nama           string `json:"nama"`
	Bidang         string `json:"bidang"`
	TanggalSelesai string `json:"tanggal_selesai"`
	SisaHari       int    `json:"sisa_hari"`
}

type barisTrenBulan struct {
	Bulan  string `json:"bulan"`
	Status string `json:"status"`
	Jumlah int    `json:"jumlah"`
}

var namaBulanSingkat = []string{
	"Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
	"Jul", "Agu", "Sep", "Okt", "Nov", "Des",
}

// ==============================================================================
// ── BAGIAN ADMIN: RINGKASAN & ANTREAN DASHBOARD ───────────────────────────────
// ==============================================================================

// [ROLE: ADMIN]
// GetRingkasanDashboardAdmin mengembalikan ringkasan statistik komprehensif operasional (antrean, presensi hari ini, kuota bidang, beban mentor, tren pendaftaran).
// Endpoint: GET /api/manajemen/admin/dashboard/ringkasan
func GetRingkasanDashboardAdmin(c *gin.Context) {
	db := config.DB
	if db == nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Koneksi basis data belum siap")
		return
	}

	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()
	batasTertunda := sekarang.AddDate(0, 0, -3)

	// Rentang grafik tren pendaftaran — hanya nilai yang diizinkan yang diterima,
	// supaya query tidak bisa dipaksa memindai puluhan tahun ke belakang.
	jumlahBulan := 6
	switch c.Query("bulan") {
	case "3":
		jumlahBulan = 3
	case "12":
		jumlahBulan = 12
	}

	// ─────────────────────────────────────────────────────────────
	// LAPIS 1 — Antrean pekerjaan
	// ─────────────────────────────────────────────────────────────
	hitungPendaftaran := func(kondisi string, args ...interface{}) int {
		var n int64
		db.Model(&models.PendaftaranMagang{}).Where(kondisi, args...).Count(&n)
		return int(n)
	}

	menungguVerifikasi := hitungPendaftaran("status_pendaftaran = ?", "menunggu")
	menungguLebih3Hari := hitungPendaftaran("status_pendaftaran = ? AND created_at < ?", "menunggu", batasTertunda)
	perluRevisi := hitungPendaftaran("status_pendaftaran = ?", "revisi")
	suratBelumTerbit := hitungPendaftaran("status_pendaftaran = ? AND surat_penerimaan_id IS NULL", "diterima")
	akunBelumDibuat := hitungPendaftaran("status_pendaftaran = ? AND akun_peserta_id IS NULL", "diterima")
	belumPunyaMentor := hitungPendaftaran(
		"akun_peserta_id IS NOT NULL AND mentor_id IS NULL AND tanggal_selesai >= ?", hariIni)
	sertifikatTertunda := hitungPendaftaran(
		"akun_peserta_id IS NOT NULL AND akun_peserta_id NOT IN (SELECT akun_peserta_id FROM sertifikats) "+
			"AND (tanggal_selesai < ? OR akun_peserta_id IN (SELECT peserta_id FROM penilaian_magangs WHERE status_penilaian = 'final'))", hariIni)

	var chatBelumDibalas int64
	db.Table("chat_sessions").
		Where("status = ? AND unread_admin_count > 0", "open").
		Count(&chatBelumDibalas)

	var pertanyaanBaru int64
	db.Table("faq_pertanyaan").Where("status = ?", "baru").Count(&pertanyaanBaru)

	totalTindakan := menungguVerifikasi + suratBelumTerbit + akunBelumDibuat +
		belumPunyaMentor + sertifikatTertunda + int(chatBelumDibalas) + int(pertanyaanBaru)

	// ─────────────────────────────────────────────────────────────
	// LAPIS 2 — Presensi hari ini
	// ─────────────────────────────────────────────────────────────
	hariKerja := false
	alasanHari := ""
	if kal, err := utils.MuatKalenderKerja(db); err == nil {
		info := kal.CekHari(hariIni)
		hariKerja = info.HariKerja
		alasanHari = info.Alasan
	}

	pesertaWajib, _ := utils.AmbilPesertaPresensi(db)
	wajibHariIni := 0
	if hariKerja {
		for _, p := range pesertaWajib {
			if p.WajibPresensiPada(hariIni) {
				wajibHariIni++
			}
		}
	}

	var barisHariIni []barisAngka
	db.Table("presensis").
		Select("status AS label, COUNT(*) AS jumlah").
		Where("tanggal = ?", hariIni).
		Group("status").
		Scan(&barisHariIni)

	presensi := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	sudahPresensi := 0
	for _, b := range barisHariIni {
		presensi[b.Label] = b.Jumlah
		sudahPresensi += b.Jumlah
	}
	belumPresensi := wajibHariIni - sudahPresensi
	if belumPresensi < 0 {
		belumPresensi = 0
	}

	// ─────────────────────────────────────────────────────────────
	// LAPIS 3 — Kesehatan program
	// ─────────────────────────────────────────────────────────────
	var kuotaBidang []barisKuotaBidang
	db.Raw(`
		SELECT b.nama                 AS nama,
		       b.kuota                AS kuota,
		       COALESCE(t.terisi, 0)  AS terisi
		FROM bidang_magangs b
		LEFT JOIN (
			SELECT posisi_bidang, COUNT(*) AS terisi
			FROM pendaftaran_magangs
			WHERE status_pendaftaran = 'diterima' AND tanggal_selesai >= ?
			GROUP BY posisi_bidang
		) t ON t.posisi_bidang = b.nama
		WHERE b.is_active = 1
		ORDER BY b.nama ASC
	`, hariIni).Scan(&kuotaBidang)

	var bebanMentor []barisBebanMentor
	db.Raw(`
		SELECT u.id                        AS id,
		       u.nama                      AS nama,
		       COALESCE(b.nama, '')        AS bidang,
		       COALESCE(u.foto_profil, '') AS foto_profil,
		       u.kapasitas_bimbingan       AS kapasitas,
		       COALESCE(m.jumlah, 0)       AS bimbingan,
		       u.is_online                 AS is_online
		FROM user_manajemens u
		LEFT JOIN bidang_magangs b ON b.id = u.bidang_id
		LEFT JOIN (
			SELECT mentor_id, COUNT(*) AS jumlah
			FROM pendaftaran_magangs
			WHERE mentor_id IS NOT NULL AND tanggal_selesai >= ?
			GROUP BY mentor_id
		) m ON m.mentor_id = u.id
		WHERE u.role = 'mentor' AND u.status_akun = 'aktif'
		ORDER BY bimbingan DESC, u.nama ASC
	`, hariIni).Scan(&bebanMentor)

	batas30Hari := sekarang.AddDate(0, 0, 30).Format("2006-01-02")
	var akanSelesai []barisAkanSelesai
	db.Raw(`
		SELECT p.akun_peserta_id                          AS peserta_id,
		       p.nama_lengkap                             AS nama,
		       p.posisi_bidang                            AS bidang,
		       DATE_FORMAT(p.tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai,
		       DATEDIFF(p.tanggal_selesai, ?)             AS sisa_hari
		FROM pendaftaran_magangs p
		WHERE p.akun_peserta_id IS NOT NULL
		  AND p.tanggal_selesai >= ?
		  AND p.tanggal_selesai <= ?
		ORDER BY p.tanggal_selesai ASC
		LIMIT 8
	`, hariIni, hariIni, batas30Hari).Scan(&akanSelesai)

	// Peserta dengan kehadiran rendah dalam 30 hari terakhir.
	// Ambang 75% disamakan dengan halaman Rekap & Laporan agar tidak membingungkan.
	awal30Presensi := sekarang.AddDate(0, 0, -29).Format("2006-01-02")
	var pesertaBermasalah []barisPesertaBermasalah
	db.Raw(`
		SELECT u.id                        AS peserta_id,
		       u.nama                      AS nama,
		       COALESCE(p.posisi_bidang, '') AS bidang,
		       COALESCE(NULLIF(u.foto_profil, ''), p.file_pas_foto, '') AS foto_profil,
		       SUM(pr.status IN ('hadir','terlambat')) AS hadir,
		       COUNT(pr.id)                            AS total,
		       ROUND(SUM(pr.status IN ('hadir','terlambat')) * 100 / COUNT(pr.id)) AS persen,
		       u.is_online                 AS is_online
		FROM user_manajemens u
		JOIN presensis pr ON pr.peserta_id = u.id
		LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = u.id
		WHERE u.role = 'peserta'
		  AND u.status_akun = 'aktif'
		  AND u.status_magang = 'aktif'
		  AND pr.tanggal >= ? AND pr.tanggal <= ?
		GROUP BY u.id, u.nama, p.posisi_bidang, u.foto_profil, p.file_pas_foto, u.is_online
		HAVING COUNT(pr.id) > 0
		   AND SUM(pr.status IN ('hadir','terlambat')) * 100 / COUNT(pr.id) < 75
		ORDER BY persen ASC
		LIMIT 6
	`, awal30Presensi, hariIni).Scan(&pesertaBermasalah)

	var pesertaAktif, pesertaAlumni, jumlahMentor int64
	db.Model(&models.UserManajemen{}).
		Where("role = ? AND status_akun = ? AND status_magang = ?", "peserta", "aktif", "aktif").Count(&pesertaAktif)
	db.Model(&models.UserManajemen{}).
		Where("role = ? AND status_magang = ?", "peserta", "selesai").Count(&pesertaAlumni)
	db.Model(&models.UserManajemen{}).
		Where("role = ? AND status_akun = ?", "mentor", "aktif").Count(&jumlahMentor)

	// ─────────────────────────────────────────────────────────────
	// LAPIS 4 — Tren
	// ─────────────────────────────────────────────────────────────
	awalTren := time.Date(sekarang.Year(), sekarang.Month(), 1, 0, 0, 0, 0, utils.WIB()).
		AddDate(0, -(jumlahBulan - 1), 0)

	var trenMentah []barisTrenBulan
	db.Raw(`
		SELECT DATE_FORMAT(created_at, '%Y-%m') AS bulan,
		       status_pendaftaran               AS status,
		       COUNT(*)                         AS jumlah
		FROM pendaftaran_magangs
		WHERE created_at >= ?
		GROUP BY bulan, status
		ORDER BY bulan ASC
	`, awalTren).Scan(&trenMentah)

	petaTren := make(map[string]map[string]int)
	for _, b := range trenMentah {
		if petaTren[b.Bulan] == nil {
			petaTren[b.Bulan] = make(map[string]int, 4)
		}
		petaTren[b.Bulan][b.Status] = b.Jumlah
	}

	trenPendaftaran := make([]gin.H, 0, jumlahBulan)
	totalDiterima, totalDitolak, totalDiproses := 0, 0, 0

	for i := 0; i < jumlahBulan; i++ {
		t := awalTren.AddDate(0, i, 0)
		s := petaTren[t.Format("2006-01")]

		diterima := s["diterima"]
		ditolak := s["ditolak"]
		diproses := s["menunggu"] + s["revisi"]

		totalDiterima += diterima
		totalDitolak += ditolak
		totalDiproses += diproses

		trenPendaftaran = append(trenPendaftaran, gin.H{
			"bulan":    namaBulanSingkat[int(t.Month())-1] + " " + t.Format("06"),
			"jumlah":   diterima + ditolak + diproses,
			"diterima": diterima,
			"ditolak":  ditolak,
			"diproses": diproses,
		})
	}

	totalDiputuskan := totalDiterima + totalDitolak
	persenDiterima := 0
	if totalDiputuskan > 0 {
		persenDiterima = totalDiterima * 100 / totalDiputuskan
	}

	awal30Hari := sekarang.AddDate(0, 0, -29).Format("2006-01-02")
	var baris30Hari []barisAngka
	db.Table("presensis").
		Select("status AS label, COUNT(*) AS jumlah").
		Where("tanggal >= ? AND tanggal <= ?", awal30Hari, hariIni).
		Group("status").
		Scan(&baris30Hari)

	rekap30 := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	total30 := 0
	for _, b := range baris30Hari {
		rekap30[b.Label] = b.Jumlah
		total30 += b.Jumlah
	}
	persenKehadiran := 0
	if total30 > 0 {
		persenKehadiran = (rekap30["hadir"] + rekap30["terlambat"]) * 100 / total30
	}

	// ─────────────────────────────────────────────────────────────
	utils.SuccessResponse(c, http.StatusOK, "Ringkasan dashboard berhasil diambil", gin.H{
		"tanggal": hariIni,

		"antrean": gin.H{
			"total":                 totalTindakan,
			"menunggu_verifikasi":   menungguVerifikasi,
			"menunggu_lebih_3_hari": menungguLebih3Hari,
			"perlu_revisi":          perluRevisi,
			"surat_belum_terbit":    suratBelumTerbit,
			"akun_belum_dibuat":     akunBelumDibuat,
			"belum_punya_mentor":    belumPunyaMentor,
			"sertifikat_tertunda":   sertifikatTertunda,
			"chat_belum_dibalas":    int(chatBelumDibalas),
			"pertanyaan_baru":       int(pertanyaanBaru),
		},

		"presensi": gin.H{
			"hari_kerja":     hariKerja,
			"alasan":         alasanHari,
			"wajib_presensi": wajibHariIni,
			"sudah_presensi": sudahPresensi,
			"belum_presensi": belumPresensi,
			"hadir":          presensi["hadir"],
			"terlambat":      presensi["terlambat"],
			"izin":           presensi["izin"],
			"sakit":          presensi["sakit"],
			"alfa":           presensi["alfa"],
		},

		"program": gin.H{
			"peserta_aktif":      int(pesertaAktif),
			"peserta_alumni":     int(pesertaAlumni),
			"jumlah_mentor":      int(jumlahMentor),
			"kuota_bidang":       kuotaBidang,
			"beban_mentor":       bebanMentor,
			"peserta_bermasalah": pesertaBermasalah,
			"akan_selesai":       akanSelesai,
		},

		"tren": gin.H{
			"jumlah_bulan":     jumlahBulan,
			"pendaftaran":      trenPendaftaran,
			"total_diterima":   totalDiterima,
			"total_ditolak":    totalDitolak,
			"total_diproses":   totalDiproses,
			"persen_diterima":  persenDiterima,
			"persen_kehadiran": persenKehadiran,
			"total_presensi":   total30,
			"rekap_30_hari":    rekap30,
		},
	})
}

// [ROLE: ADMIN]
// AdminHitunganAntrean mengambil jumlah berkas/tindakan yang menunggu respon admin (pendaftaran, surat, akun, sertifikat, chat) untuk badge sidebar.
// Endpoint: GET /api/manajemen/admin/antrean/hitungan
func AdminHitunganAntrean(c *gin.Context) {
	db := config.DB
	if db == nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Koneksi basis data belum siap")
		return
	}

	hariIni := utils.TanggalHariIni()

	var menungguVerifikasi int64
	db.Model(&models.PendaftaranMagang{}).Where("status_pendaftaran = ?", "menunggu").Count(&menungguVerifikasi)

	var suratBelumTerbit int64
	db.Model(&models.PendaftaranMagang{}).Where("status_pendaftaran = ? AND surat_penerimaan_id IS NULL", "diterima").Count(&suratBelumTerbit)

	var akunBelumDibuat int64
	db.Model(&models.PendaftaranMagang{}).Where("status_pendaftaran = ? AND akun_peserta_id IS NULL", "diterima").Count(&akunBelumDibuat)

	var belumPunyaMentor int64
	db.Model(&models.PendaftaranMagang{}).Where("akun_peserta_id IS NOT NULL AND mentor_id IS NULL AND tanggal_selesai >= ?", hariIni).Count(&belumPunyaMentor)

	var sertifikatTertunda int64
	db.Model(&models.PendaftaranMagang{}).
		Where("akun_peserta_id IS NOT NULL AND akun_peserta_id NOT IN (SELECT akun_peserta_id FROM sertifikats WHERE status = 'terbit' AND nomor_sertifikat != '-' AND nomor_sertifikat != '') AND (tanggal_selesai < ? OR akun_peserta_id IN (SELECT peserta_id FROM penilaian_magangs WHERE status_penilaian = 'final'))", hariIni).
		Count(&sertifikatTertunda)

	var chatBelumDibalas int64
	db.Table("chat_sessions").Where("status = ? AND unread_admin_count > 0", "open").Count(&chatBelumDibalas)

	var pertanyaanBaru int64
	db.Table("faq_pertanyaan").Where("status = ?", "baru").Count(&pertanyaanBaru)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"pendaftaran":        menungguVerifikasi,
			"surat_penerimaan":   suratBelumTerbit,
			"peserta":            akunBelumDibuat + belumPunyaMentor,
			"sertifikat":         sertifikatTertunda,
			"chat_belum_dibalas": chatBelumDibalas,
			"pertanyaan_baru":    pertanyaanBaru,
			"bantuan":            chatBelumDibalas + pertanyaanBaru,
		},
	})
}

// ==============================================================================
// ── BAGIAN PESERTA: DASHBOARD KONSOLIDASI PESERTA ─────────────────────────────
// ==============================================================================

// [ROLE: PESERTA]
// GetDashboardPeserta mengembalikan seluruh data konsolidasi dashboard peserta (status magang, mentor, rekap presensi, tugas, materi, dan pengumuman).
// Endpoint: GET /api/manajemen/peserta/dashboard
func GetDashboardPeserta(c *gin.Context) {
	pesertaID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

	// Pastikan status presensi hari-hari sebelumnya sudah dikunci otomatis
	_ = services.PastikanHariTerkunci(config.DB)

	// 1. Ambil User Peserta
	var user models.UserManajemen
	if err := config.DB.First(&user, pesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data peserta tidak ditemukan")
		return
	}

	// 2. Ambil Pendaftaran Magang
	var pendaftaran models.PendaftaranMagang
	hasPendaftaran := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		Order("id desc").
		First(&pendaftaran).Error == nil

	// 3. Hitung Timeline & Durasi Magang
	hariIniStr := utils.TanggalHariIni()
	sekarang := utils.SekarangWIB()
	hariIniTime, _ := time.Parse("2006-01-02", hariIniStr)

	totalHari := 0
	hariKe := 0
	sisaHari := 0
	progresPersen := 0.0
	statusTimeline := "belum_mulai" // belum_mulai | berjalan | selesai

	mulaiStr := pendaftaran.TanggalMulai
	if len(mulaiStr) >= 10 {
		mulaiStr = mulaiStr[:10]
	}
	selesaiStr := pendaftaran.TanggalSelesai
	if len(selesaiStr) >= 10 {
		selesaiStr = selesaiStr[:10]
	}

	if hasPendaftaran && mulaiStr != "" && selesaiStr != "" {
		tMulai, errMulai := time.Parse("2006-01-02", mulaiStr)
		tSelesai, errSelesai := time.Parse("2006-01-02", selesaiStr)

		if errMulai == nil && errSelesai == nil {
			totalHari = int(tSelesai.Sub(tMulai).Hours()/24) + 1
			if totalHari < 1 {
				totalHari = 1
			}

			if hariIniTime.Before(tMulai) {
				statusTimeline = "belum_mulai"
				hariKe = 0
				sisaHari = totalHari
				progresPersen = 0.0
			} else if hariIniTime.After(tSelesai) || user.StatusMagang == "selesai" {
				statusTimeline = "selesai"
				hariKe = totalHari
				sisaHari = 0
				progresPersen = 100.0
			} else {
				statusTimeline = "berjalan"
				hariKe = int(hariIniTime.Sub(tMulai).Hours()/24) + 1
				if hariKe > totalHari {
					hariKe = totalHari
				}
				sisaHari = totalHari - hariKe
				if sisaHari < 0 {
					sisaHari = 0
				}
				progresPersen = math.Round((float64(hariKe)/float64(totalHari)*100)*10) / 10
			}
		}
	}

	// 4. Data Mentor Pembimbing & Surat Penerimaan
	var mentorData gin.H = nil
	if hasPendaftaran && pendaftaran.MentorID != nil {
		var mentor models.UserManajemen
		if config.DB.First(&mentor, *pendaftaran.MentorID).Error == nil {
			mentorData = gin.H{
				"id":           mentor.ID,
				"nama":         mentor.Nama,
				"nama_lengkap": mentor.Nama,
				"nip":          mentor.Nip,
				"foto_profil": mentor.FotoProfil,
				"jabatan":     mentor.Jabatan,
				"email":       mentor.Email,
				"no_hp":       mentor.NoHp,
				"is_online":   mentor.IsOnline,
			}
		}
	}

	var suratData gin.H = nil
	if hasPendaftaran && pendaftaran.SuratPenerimaanID != nil {
		var surat models.SuratPenerimaan
		if config.DB.First(&surat, *pendaftaran.SuratPenerimaanID).Error == nil {
			suratData = gin.H{
				"id":             surat.ID,
				"nomor_surat":    surat.NomorSurat,
				"tanggal_terbit": surat.TanggalTerbit,
				"file_surat":     surat.FileSurat,
			}
		}
	}

	// 5. Status Presensi Hari Ini
	kal, _ := utils.MuatKalenderKerja(config.DB)
	infoHari := kal.CekHari(hariIniStr)

	var presensiHariIni models.Presensi
	adaPresensiHariIni := config.DB.
		Where("peserta_id = ? AND tanggal = ?", pesertaID, hariIniStr).
		First(&presensiHariIni).Error == nil

	izinHariIni := izinDisetujuiPada(pesertaID, hariIniStr)

	sudahMasuk := adaPresensiHariIni && presensiHariIni.JamMasuk != nil && *presensiHariIni.JamMasuk != ""
	sudahPulang := adaPresensiHariIni && presensiHariIni.JamPulang != nil && *presensiHariIni.JamPulang != ""

	statusPresensiHariIni := "belum_masuk"
	if !infoHari.HariKerja {
		statusPresensiHariIni = "libur"
	} else if izinHariIni != nil {
		statusPresensiHariIni = izinHariIni.Jenis // "izin" | "sakit"
	} else if sudahPulang {
		statusPresensiHariIni = "selesai"
	} else if sudahMasuk {
		statusPresensiHariIni = "sudah_masuk"
	}

	// 6. Rekap Statistik Kehadiran (Sepanjang Masa Magang)
	type statRow struct {
		Status string
		Total  int
	}
	var statRows []statRow
	config.DB.Model(&models.Presensi{}).
		Select("status, COUNT(*) as total").
		Where("peserta_id = ?", pesertaID).
		Group("status").
		Scan(&statRows)

	statMap := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	totalPresensi := 0
	for _, r := range statRows {
		statMap[r.Status] = r.Total
		totalPresensi += r.Total
	}

	totalHadirEfektif := statMap["hadir"] + statMap["terlambat"]
	persentaseKehadiran := 100.0
	if totalPresensi > 0 {
		persentaseKehadiran = math.Round((float64(totalHadirEfektif)/float64(totalPresensi)*100)*10) / 10
	}

	var totalLogbookTerisi int64
	config.DB.Model(&models.Presensi{}).
		Where("peserta_id = ? AND status IN ('hadir', 'terlambat') AND TRIM(COALESCE(keterangan, '')) != '' AND keterangan != 'Tidak melakukan presensi'", pesertaID).
		Count(&totalLogbookTerisi)

	// 7. Pengajuan Izin Terkini (3 terakhir)
	var pengajuanIzinList []models.PengajuanIzin
	config.DB.
		Where("peserta_id = ?", pesertaID).
		Order("id desc").
		Limit(3).
		Find(&pengajuanIzinList)

	// 8. Evaluasi & Transkrip Nilai (jika ada)
	var nilai models.PenilaianMagang
	adaNilai := config.DB.
		Where("peserta_id = ?", pesertaID).
		First(&nilai).Error == nil

	var nilaiData gin.H = nil
	if adaNilai {
		nilaiData = gin.H{
			"status_penilaian":   nilai.StatusPenilaian,
			"nilai_akhir_angka":  nilai.NilaiAkhirAngka,
			"indeks_nilai_akhir": nilai.IndeksNilaiAkhir,
			"predikat_akhir":     nilai.PredikatAkhir,
			"tanggal_penilaian":  nilai.TanggalPenilaian,
		}
	}

	// 9. Status Sertifikat
	var sertifikat models.Sertifikat
	adaSertifikat := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		First(&sertifikat).Error == nil

	var sertifikatData gin.H = nil
	if adaSertifikat {
		sertifikatData = gin.H{
			"id":            sertifikat.ID,
			"no_sertifikat": sertifikat.NomorSertifikat,
			"status":        sertifikat.Status,
		}
	}

	// 10. Status Laporan Akhir Magang
	laporanDisetujui := (adaNilai && nilai.LaporanAkhirDisetujui) || pendaftaran.StatusLaporanAkhir == "disetujui"
	statusLaporan := "belum_unggah"
	catatanMentorLaporan := pendaftaran.CatatanMentorLaporan
	if catatanMentorLaporan == "" && adaNilai {
		catatanMentorLaporan = nilai.CatatanMentor
	}

	if hasPendaftaran && strings.TrimSpace(pendaftaran.FileLaporanAkhir) != "" {
		if laporanDisetujui {
			statusLaporan = "disetujui"
		} else if pendaftaran.StatusLaporanAkhir == "revisi" || pendaftaran.StatusLaporanAkhir == "perlu_revisi" {
			statusLaporan = "perlu_revisi"
		} else {
			statusLaporan = "menunggu_review"
		}
	}

	var laporanData gin.H = nil
	if hasPendaftaran {
		laporanData = gin.H{
			"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
			"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
			"link_proyek":            pendaftaran.LinkProyek,
			"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
			"catatan_mentor":         catatanMentorLaporan,
			"catatan_mentor_laporan": catatanMentorLaporan,
			"status":                 statusLaporan,
			"status_laporan":         statusLaporan,
			"disetujui":              laporanDisetujui,
			"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
			"sisa_hari":              sisaHari,
		}
	}

	coalesceStr := func(a, b string) string {
		if a != "" {
			return a
		}
		return b
	}

	// Bentuk respons utuh
	dashboardData := gin.H{
		"peserta": gin.H{
			"id":            user.ID,
			"nama":          user.Nama,
			"email":         user.Email,
			"no_hp":         user.NoHp,
			"foto_profil":   user.FotoProfil,
			"status_akun":   user.StatusAkun,
			"status_magang": user.StatusMagang,
		},
		"pendaftaran": gin.H{
			"id":                     pendaftaran.ID,
			"ada":                    hasPendaftaran,
			"posisi_bidang":          pendaftaran.PosisiBidang,
			"institusi":              coalesceStr(pendaftaran.AsalKampus, pendaftaran.AsalSekolah),
			"jurusan_prodi":          coalesceStr(pendaftaran.ProgramStudi, pendaftaran.JurusanSekolah),
			"nomor_identitas":        coalesceStr(pendaftaran.NpmNim, pendaftaran.Nisn),
			"kategori_pendaftar":     pendaftaran.KategoriPendaftar,
			"tanggal_mulai":          mulaiStr,
			"tanggal_selesai":        selesaiStr,
			"file_pas_foto":          pendaftaran.FilePasFoto,
			"surat_penerimaan":       suratData,
			"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
			"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
			"link_proyek":            pendaftaran.LinkProyek,
			"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
			"catatan_mentor":         catatanMentorLaporan,
			"catatan_mentor_laporan": catatanMentorLaporan,
			"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
		},
		"timeline": gin.H{
			"status":         statusTimeline,
			"total_hari":     totalHari,
			"hari_ke":        hariKe,
			"sisa_hari":      sisaHari,
			"progres_persen": progresPersen,
		},
		"mentor": mentorData,
		"presensi_hari_ini": gin.H{
			"tanggal":      hariIniStr,
			"hari":         infoHari.Hari,
			"hari_kerja":   infoHari.HariKerja,
			"alasan_libur": infoHari.Alasan,
			"jam_sekarang": utils.JamSekarang(),
			"jam_kerja": gin.H{
				"jam_masuk":           infoHari.JamKerja.JamMasuk,
				"jam_pulang":          infoHari.JamKerja.JamPulang,
				"toleransi_terlambat": infoHari.JamKerja.ToleransiTerlambat,
			},
			"status":      statusPresensiHariIni,
			"status_presensi": func() string {
				if adaPresensiHariIni {
					return presensiHariIni.Status
				}
				if izinHariIni != nil {
					return izinHariIni.Jenis
				}
				return ""
			}(),
			"menit_terlambat": func() int {
				if adaPresensiHariIni {
					return presensiHariIni.MenitTerlambat
				}
				return 0
			}(),
			"sudah_masuk": sudahMasuk,
			"sudah_pulang": sudahPulang,
			"jam_masuk_aktual": func() *string {
				if adaPresensiHariIni {
					return presensiHariIni.JamMasuk
				}
				return nil
			}(),
			"jam_pulang_aktual": func() *string {
				if adaPresensiHariIni {
					return presensiHariIni.JamPulang
				}
				return nil
			}(),
			"id": func() *uint {
				if adaPresensiHariIni {
					return &presensiHariIni.ID
				}
				return nil
			}(),
			"keterangan": func() string {
				if adaPresensiHariIni {
					return presensiHariIni.Keterangan
				}
				return ""
			}(),
			"foto_masuk": func() string {
				if adaPresensiHariIni {
					return presensiHariIni.FotoMasuk
				}
				return ""
			}(),
			"foto_pulang": func() string {
				if adaPresensiHariIni {
					return presensiHariIni.FotoPulang
				}
				return ""
			}(),
			"izin_hari_ini": izinHariIni,
		},
		"statistik_kehadiran": gin.H{
			"total_presensi":       totalPresensi,
			"hadir":                statMap["hadir"],
			"terlambat":            statMap["terlambat"],
			"izin":                 statMap["izin"],
			"sakit":                statMap["sakit"],
			"alfa":                 statMap["alfa"],
			"persentase_kehadiran": persentaseKehadiran,
			"total_logbook_terisi": totalLogbookTerisi,
		},
		"pengajuan_izin_terkini": pengajuanIzinList,
		"penilaian":              nilaiData,
		"sertifikat":             sertifikatData,
		"laporan_akhir":          laporanData,
		"server_time":            sekarang.Format(time.RFC3339),
	}

	utils.SuccessResponse(c, http.StatusOK, "Data dashboard peserta berhasil dimuat", dashboardData)
}
