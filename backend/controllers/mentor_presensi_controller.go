package controllers

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==================== PRESENSI & IZIN (MENTOR) ====================
//
// Mentor adalah pemilik wewenang:
//   - mengoreksi presensi peserta bimbingannya
//   - menyetujui / menolak pengajuan izin & sakit
//
// Semua query WAJIB difilter dengan mentor_id dari token, sehingga mentor
// tidak bisa menyentuh data peserta bimbingan mentor lain.

// mentorIDDariToken mengambil id mentor yang sedang login.
func mentorIDDariToken(c *gin.Context) (uint, bool) {
	id, ok := getUserIDFromContext(c)
	if !ok || id == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return 0, false
	}
	return id, true
}

// pendaftaranPesertaMentor memastikan peserta benar-benar bimbingan mentor ini.
// Mengembalikan id pendaftaran terakhir peserta tersebut.
func pendaftaranPesertaMentor(mentorID, pesertaID uint) (*uint, bool) {
	var row struct {
		ID uint `gorm:"column:id"`
	}
	err := config.DB.Table("pendaftaran_magangs").
		Select("id").
		Where("akun_peserta_id = ? AND mentor_id = ?", pesertaID, mentorID).
		Order("id desc").
		Limit(1).
		Scan(&row).Error
	if err != nil || row.ID == 0 {
		return nil, false
	}
	pid := row.ID
	return &pid, true
}

// GetPresensiMentor — daftar presensi peserta bimbingan (dengan filter & paginasi
// yang sama seperti halaman admin).
func GetPresensiMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	_ = services.PastikanHariTerkunci(config.DB)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 10
	}

	var total int64
	if err := basePresensiQuery(c).Where("p.mentor_id = ?", mentorID).Count(&total).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung data presensi")
		return
	}

	rows := make([]PresensiRow, 0)
	if err := basePresensiQuery(c).
		Where("p.mentor_id = ?", mentorID).
		Select(selectPresensiRow).
		Order(urutanPresensi(c.Query("sort"))).
		Limit(limit).Offset((page - 1) * limit).
		Scan(&rows).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data presensi")
		return
	}

	if c.Query("mode") == "terbaru" && len(rows) > 0 {
		ids := make([]uint, 0, len(rows))
		for _, r := range rows {
			ids = append(ids, r.PesertaID)
		}
		type hitungRiwayat struct {
			PesertaID uint `json:"peserta_id"`
			Jumlah    int  `json:"jumlah"`
		}
		var hasil []hitungRiwayat
		basePresensiQueryTanpaMode(c).
			Where("p.mentor_id = ? AND pr.peserta_id IN ?", mentorID, ids).
			Select("pr.peserta_id AS peserta_id, COUNT(*) AS jumlah").
			Group("pr.peserta_id").
			Scan(&hasil)

		jumlahPer := make(map[uint]int, len(hasil))
		for _, h := range hasil {
			jumlahPer[h.PesertaID] = h.Jumlah
		}
		for i := range rows {
			rows[i].TotalRiwayat = jumlahPer[rows[i].PesertaID]
		}
	}

	totalPage := int((total + int64(limit) - 1) / int64(limit))
	utils.SuccessResponse(c, http.StatusOK, "Data presensi bimbingan berhasil diambil", gin.H{
		"data": rows,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": totalPage,
		},
	})
}

// GetStatistikPresensiMentor — angka ringkas untuk kartu statistik mentor.
// Bersifat harian (default: hari ini) jika rentang tanggal tidak dikirim,
// persis seperti endpoint statistik data presensi admin.
func GetStatistikPresensiMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	_ = services.PastikanHariTerkunci(config.DB)

	dari := strings.TrimSpace(c.Query("tanggal_dari"))
	sampai := strings.TrimSpace(c.Query("tanggal_sampai"))
	if dari == "" && sampai == "" {
		dari = utils.TanggalHariIni()
		sampai = dari
	}

	buatQuery := func() *gorm.DB {
		q := config.DB.Table("presensis pr").
			Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
			Joins(`LEFT JOIN pendaftaran_magangs p ON p.id = COALESCE(pr.pendaftaran_id, (
				SELECT p2.id FROM pendaftaran_magangs p2
				WHERE p2.akun_peserta_id = pr.peserta_id
				ORDER BY p2.id DESC LIMIT 1
			))`).
			Where("p.mentor_id = ?", mentorID)

		if dari != "" {
			q = q.Where("pr.tanggal >= ?", dari)
		}
		if sampai != "" {
			q = q.Where("pr.tanggal <= ?", sampai)
		}
		if raw := strings.TrimSpace(c.Query("kategori")); raw != "" {
			q = q.Where("p.kategori_pendaftar IN ?", strings.Split(raw, ","))
		}
		if s := strings.TrimSpace(c.Query("search")); s != "" {
			key := "%" + s + "%"
			q = q.Where(
				"u.nama LIKE ? OR p.asal_kampus LIKE ? OR p.asal_sekolah LIKE ? OR p.npm_nim LIKE ? OR p.nisn LIKE ?",
				key, key, key, key, key,
			)
		}
		return q
	}

	type barisStatus struct {
		Status string `gorm:"column:status"`
		Jumlah int64  `gorm:"column:jumlah"`
	}
	var baris []barisStatus
	if err := buatQuery().
		Select("pr.status AS status, COUNT(*) AS jumlah").
		Group("pr.status").
		Scan(&baris).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung statistik presensi")
		return
	}

	hasil := map[string]int64{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	var total int64
	for _, b := range baris {
		hasil[b.Status] = b.Jumlah
		total += b.Jumlah
	}

	var lupa int64
	buatQuery().Where("pr.lupa_presensi = 1").Count(&lupa)

	// Hitung peserta bimbingan yang aktif dan kewajiban presensi hari ini
	pesertaSemua, _ := utils.AmbilPesertaPresensi(config.DB)
	var pesertaBimbingan []utils.PesertaPresensi
	for _, p := range pesertaSemua {
		if p.MentorID != nil && *p.MentorID == mentorID {
			pesertaBimbingan = append(pesertaBimbingan, p)
		}
	}

	hariIni := utils.TanggalHariIni()
	kal, errKal := utils.MuatKalenderKerja(config.DB)
	hariKerja := false
	alasanHari := ""
	wajibHariIni := 0
	if errKal == nil {
		info := kal.CekHari(hariIni)
		hariKerja = info.HariKerja
		alasanHari = info.Alasan
		if hariKerja {
			for _, p := range pesertaBimbingan {
				if p.WajibPresensiPada(hariIni) {
					wajibHariIni++
				}
			}
		}
	}

	var sudahHariIni int64
	config.DB.Table("presensis pr").
		Joins("JOIN pendaftaran_magangs p ON p.id = pr.pendaftaran_id").
		Where("p.mentor_id = ? AND pr.tanggal = ?", mentorID, hariIni).
		Count(&sudahHariIni)
	belumHariIni := wajibHariIni - int(sudahHariIni)
	if belumHariIni < 0 {
		belumHariIni = 0
	}

	var izinMenunggu int64
	_ = config.DB.Table("pengajuan_izins pi").
		Joins("JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
		Where("p.mentor_id = ? AND pi.status = 'menunggu'", mentorID).
		Count(&izinMenunggu).Error

	utils.SuccessResponse(c, http.StatusOK, "Statistik presensi bimbingan berhasil diambil", gin.H{
		"periode": gin.H{"dari": dari, "sampai": sampai},
		"hari_ini": gin.H{
			"tanggal":        hariIni,
			"hari_kerja":     hariKerja,
			"alasan":         alasanHari,
			"wajib_presensi": wajibHariIni,
			"sudah_presensi": int(sudahHariIni),
			"belum_presensi": belumHariIni,
		},
		"total":         total,
		"hadir":         hasil["hadir"],
		"terlambat":     hasil["terlambat"],
		"izin":          hasil["izin"],
		"sakit":         hasil["sakit"],
		"alfa":          hasil["alfa"],
		"lupa_presensi": lupa,
		"total_peserta": len(pesertaBimbingan),
		"izin_menunggu": izinMenunggu,
	})
}

type updatePresensiInput struct {
	Status     *string `json:"status"`
	JamMasuk   *string `json:"jam_masuk"`
	JamPulang  *string `json:"jam_pulang"`
	Keterangan *string `json:"keterangan"`
}

// UpdatePresensiMentor — koreksi presensi peserta bimbingan.
// Mentor boleh mengubah status, jam masuk/pulang, dan keterangan.
// Menit keterlambatan dihitung ulang otomatis dari jam masuk terbaru.
func UpdatePresensiMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var presensi models.Presensi
	if err := config.DB.First(&presensi, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data presensi tidak ditemukan")
		return
	}

	if _, milik := pendaftaranPesertaMentor(mentorID, presensi.PesertaID); !milik {
		utils.ErrorResponse(c, http.StatusForbidden, "Anda hanya dapat mengoreksi presensi peserta bimbingan Anda")
		return
	}

	var input updatePresensiInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data yang dikirim tidak valid")
		return
	}

	if input.Status != nil {
		switch *input.Status {
		case "hadir", "terlambat", "izin", "sakit", "alfa":
			presensi.Status = *input.Status
		default:
			utils.ErrorResponse(c, http.StatusBadRequest, "Status presensi tidak dikenali")
			return
		}
	}

	if input.JamMasuk != nil {
		jam := strings.TrimSpace(*input.JamMasuk)
		if jam == "" {
			presensi.JamMasuk = nil
		} else {
			presensi.JamMasuk = &jam
		}
	}
	if input.JamPulang != nil {
		jam := strings.TrimSpace(*input.JamPulang)
		if jam == "" {
			presensi.JamPulang = nil
		} else {
			presensi.JamPulang = &jam
		}
	}
	if input.Keterangan != nil {
		presensi.Keterangan = strings.TrimSpace(*input.Keterangan)
	}

	// Hitung ulang keterlambatan bila status kehadiran & jam masuk tersedia
	if presensi.Status == "hadir" || presensi.Status == "terlambat" {
		if presensi.JamMasuk != nil && *presensi.JamMasuk != "" {
			if kal, err := utils.MuatKalenderKerja(config.DB); err == nil {
				hasil := kal.HitungStatusMasuk(normalTanggal(presensi.Tanggal), *presensi.JamMasuk)
				presensi.MenitTerlambat = hasil.MenitTerlambat
				presensi.LupaPresensi = hasil.LupaPresensi
				// status tetap mengikuti keputusan mentor bila mentor mengirim status
				if input.Status == nil {
					presensi.Status = hasil.Status
				}
			}
		} else {
			presensi.MenitTerlambat = 0
			presensi.LupaPresensi = false
		}
	} else {
		// izin / sakit / alfa tidak punya keterlambatan
		presensi.MenitTerlambat = 0
		presensi.LupaPresensi = false
	}

	presensi.Sumber = "mentor"
	presensi.DicatatOlehID = &mentorID

	if err := config.DB.Save(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan koreksi presensi")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Presensi berhasil dikoreksi", presensi)
}

// ==================== PENGAJUAN IZIN (MENTOR) ====================

// PengajuanIzinRow adalah bentuk data pengajuan izin untuk frontend mentor.
type PengajuanIzinRow struct {
	ID             uint   `json:"id"`
	PesertaID      uint   `json:"peserta_id"`
	Nama           string `json:"nama"`
	FotoProfil     string `json:"foto_profil"`
	NomorInduk     string `json:"nomor_induk"`
	Institusi      string `json:"institusi"`
	Jurusan        string `json:"jurusan"`
	Bidang         string `json:"bidang"`
	Jenis          string `json:"jenis"`
	TanggalMulai   string `json:"tanggal_mulai"`
	TanggalSelesai string `json:"tanggal_selesai"`
	Alasan         string `json:"alasan"`
	FileBukti      string `json:"file_bukti"`
	Status         string `json:"status"`
	CatatanMentor  string `json:"catatan_mentor"`
	CreatedAt      string `json:"created_at"`
}

// GetPengajuanIzinMentor — daftar pengajuan izin/sakit peserta bimbingan.
// Query: status (menunggu|disetujui|ditolak), jenis (izin|sakit), search, page, limit.
func GetPengajuanIzinMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	buildQuery := func() *gorm.DB {
		q := config.DB.Table("pengajuan_izins pi").
			Joins("JOIN user_manajemens u ON u.id = pi.peserta_id").
			Joins("LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
			Where("p.mentor_id = ?", mentorID)

		if v := strings.TrimSpace(c.Query("status")); v != "" {
			q = q.Where("pi.status IN ?", strings.Split(v, ","))
		}
		if v := strings.TrimSpace(c.Query("jenis")); v != "" {
			q = q.Where("pi.jenis IN ?", strings.Split(v, ","))
		}
		if s := strings.TrimSpace(c.Query("search")); s != "" {
			key := "%" + s + "%"
			q = q.Where("u.nama LIKE ? OR pi.alasan LIKE ?", key, key)
		}
		return q
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 10
	}

	var total int64
	if err := buildQuery().Count(&total).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung pengajuan izin")
		return
	}

	rows := make([]PengajuanIzinRow, 0)
	err := buildQuery().
		Select(`
			pi.id, pi.peserta_id, pi.jenis, pi.tanggal_mulai, pi.tanggal_selesai,
			pi.alasan, pi.file_bukti, pi.status, pi.catatan_mentor, pi.created_at,
			u.nama AS nama,
			COALESCE(u.foto_profil, '') AS foto_profil,
			COALESCE(NULLIF(p.npm_nim, ''), p.nisn, '') AS nomor_induk,
			COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
			COALESCE(NULLIF(p.program_studi, ''), p.jurusan_sekolah, '') AS jurusan,
			COALESCE(p.posisi_bidang, '') AS bidang
		`).
		Order("FIELD(pi.status,'menunggu','disetujui','ditolak'), pi.created_at desc").
		Limit(limit).Offset((page - 1) * limit).
		Scan(&rows).Error
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengajuan izin")
		return
	}

	totalPage := int((total + int64(limit) - 1) / int64(limit))
	utils.SuccessResponse(c, http.StatusOK, "Pengajuan izin berhasil diambil", gin.H{
		"data": rows,
		"meta": gin.H{"page": page, "limit": limit, "total": total, "total_page": totalPage},
	})
}

type prosesIzinInput struct {
	Status  string `json:"status" binding:"required"` // "disetujui" | "ditolak"
	Catatan string `json:"catatan"`
}

// ProsesPengajuanIzinMentor — menyetujui / menolak pengajuan izin.
// Saat disetujui, sistem meng-upsert baris presensi berstatus izin/sakit untuk
// SETIAP hari kerja dalam rentang tanggal pengajuan.
func ProsesPengajuanIzinMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var izin models.PengajuanIzin
	if err := config.DB.First(&izin, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Pengajuan izin tidak ditemukan")
		return
	}

	pendaftaranID, milik := pendaftaranPesertaMentor(mentorID, izin.PesertaID)
	if !milik {
		utils.ErrorResponse(c, http.StatusForbidden, "Anda hanya dapat memproses pengajuan peserta bimbingan Anda")
		return
	}

	var input prosesIzinInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data yang dikirim tidak valid")
		return
	}
	if input.Status != "disetujui" && input.Status != "ditolak" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status hanya boleh 'disetujui' atau 'ditolak'")
		return
	}
	if izin.Status != "menunggu" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Pengajuan ini sudah diproses sebelumnya")
		return
	}

	sekarang := utils.SekarangWIB()
	izin.Status = input.Status
	izin.CatatanMentor = strings.TrimSpace(input.Catatan)
	izin.DiprosesOlehID = &mentorID
	izin.DiprosesPada = &sekarang

	jumlahHari := 0

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&izin).Error; err != nil {
			return err
		}

		if input.Status != "disetujui" {
			return nil
		}

		kal, err := utils.MuatKalenderKerja(tx)
		if err != nil {
			return err
		}

		dari := normalTanggal(izin.TanggalMulai)
		sampai := normalTanggal(izin.TanggalSelesai)

		for _, tgl := range kal.DaftarHariKerja(dari, sampai) {
			var presensi models.Presensi
			cari := tx.Where("peserta_id = ? AND tanggal = ?", izin.PesertaID, tgl).First(&presensi)

			ket := "Disetujui mentor: " + izin.Alasan

			if cari.Error != nil {
				baru := models.Presensi{
					PesertaID:       izin.PesertaID,
					PendaftaranID:   pendaftaranID,
					Tanggal:         tgl,
					Status:          izin.Jenis,
					Keterangan:      ket,
					Sumber:          "sistem",
					DicatatOlehID:   &mentorID,
					PengajuanIzinID: &izin.ID,
				}
				if err := tx.Create(&baru).Error; err != nil {
					return err
				}
			} else {
				presensi.Status = izin.Jenis
				presensi.Keterangan = ket
				presensi.MenitTerlambat = 0
				presensi.LupaPresensi = false
				presensi.Sumber = "sistem"
				presensi.DicatatOlehID = &mentorID
				presensi.PengajuanIzinID = &izin.ID
				if presensi.PendaftaranID == nil {
					presensi.PendaftaranID = pendaftaranID
				}
				if err := tx.Save(&presensi).Error; err != nil {
					return err
				}
			}
			jumlahHari++
		}
		return nil
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses pengajuan izin")
		return
	}

	// Tandai notifikasi mentor untuk izin ini sebagai sudah dibaca
	now := time.Now()
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'mentor' AND ref_tabel = 'pengajuan_izins' AND ref_id = ?", izin.ID).
		Update("dibaca_pada", now)

	go kirimEmailHasilIzin(izin.ID)

	utils.SuccessResponse(c, http.StatusOK, "Pengajuan izin berhasil diproses", gin.H{
		"pengajuan":            izin,
		"jumlah_hari_tercatat": jumlahHari,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR: Hitungan izin menunggu untuk lencana sidebar
// GET /api/manajemen/mentor/antrean/hitungan
// ─────────────────────────────────────────────────────────────────────────────

func GetHitunganAntreanMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var izinMenunggu int64
	config.DB.Table("pengajuan_izins pi").
		Joins("JOIN user_manajemens u ON u.id = pi.peserta_id").
		Joins("LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
		Where("p.mentor_id = ? AND pi.status = ?", mentorID, "menunggu").
		Count(&izinMenunggu)

	// Hitung pengumpulan tugas yang menunggu review/penilaian mentor
	var tugasMenunggu int64
	config.DB.Table("pengumpulan_tugas pt").
		Joins("JOIN tugas_magangs tm ON tm.id = pt.tugas_id").
		Where("(tm.mentor_id = ? OR pt.peserta_id IN (SELECT akun_peserta_id FROM pendaftaran_magangs WHERE mentor_id = ? AND status_pendaftaran = 'diterima')) AND pt.status = ?", mentorID, mentorID, "menunggu").
		Count(&tugasMenunggu)

	// Laporan akhir yang sudah diunggah oleh peserta bimbingan tetapi belum disetujui
	var laporanMenunggu int64
	config.DB.Table("pendaftaran_magangs p").
		Joins("LEFT JOIN penilaian_magangs pn ON pn.peserta_id = p.akun_peserta_id").
		Where("p.mentor_id = ? AND p.status_pendaftaran = 'diterima' AND p.file_laporan_akhir != '' AND (pn.laporan_akhir_disetujui IS NULL OR pn.laporan_akhir_disetujui = false)", mentorID).
		Count(&laporanMenunggu)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"izin":          izinMenunggu,
			"tugas":         tugasMenunggu,
			"laporan_akhir": laporanMenunggu,
		},
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR: Statistik ringkas pengajuan izin/sakit peserta bimbingan
// GET /api/manajemen/mentor/pengajuan-izin/statistik
// ─────────────────────────────────────────────────────────────────────────────

func GetStatistikPengajuanIzinMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	baseQ := func() *gorm.DB {
		return config.DB.Table("pengajuan_izins pi").
			Joins("JOIN user_manajemens u ON u.id = pi.peserta_id").
			Joins("LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
			Where("p.mentor_id = ?", mentorID)
	}

	type barisStat struct {
		Status string `gorm:"column:status"`
		Jumlah int64  `gorm:"column:jumlah"`
	}
	var baris []barisStat
	_ = baseQ().
		Select("pi.status, COUNT(*) as jumlah").
		Group("pi.status").
		Scan(&baris).Error

	var menunggu, disetujui, ditolak, total int64
	for _, b := range baris {
		total += b.Jumlah
		switch b.Status {
		case "menunggu":
			menunggu = b.Jumlah
		case "disetujui":
			disetujui = b.Jumlah
		case "ditolak":
			ditolak = b.Jumlah
		}
	}

	var izinCount, sakitCount int64
	_ = baseQ().Where("pi.jenis = ?", "izin").Count(&izinCount).Error
	_ = baseQ().Where("pi.jenis = ?", "sakit").Count(&sakitCount).Error

	utils.SuccessResponse(c, http.StatusOK, "Statistik pengajuan izin berhasil diambil", gin.H{
		"menunggu":  menunggu,
		"disetujui": disetujui,
		"ditolak":   ditolak,
		"total":     total,
		"izin":      izinCount,
		"sakit":     sakitCount,
	})
}