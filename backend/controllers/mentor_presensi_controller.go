package controllers

import (
	"net/http"
	"strconv"
	"strings"

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
func GetStatistikPresensiMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	_ = services.PastikanHariTerkunci(config.DB)

	type barisStatus struct {
		Status string `gorm:"column:status"`
		Jumlah int64  `gorm:"column:jumlah"`
	}
	var baris []barisStatus
	if err := basePresensiQuery(c).
		Where("p.mentor_id = ?", mentorID).
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
	_ = basePresensiQuery(c).Where("p.mentor_id = ? AND pr.lupa_presensi = 1", mentorID).Count(&lupa).Error

	var totalPeserta int64
	_ = config.DB.Table("pendaftaran_magangs").
		Where("mentor_id = ? AND akun_peserta_id IS NOT NULL", mentorID).
		Distinct("akun_peserta_id").
		Count(&totalPeserta).Error

	var izinMenunggu int64
	_ = config.DB.Table("pengajuan_izins pi").
		Joins("JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
		Where("p.mentor_id = ? AND pi.status = 'menunggu'", mentorID).
		Count(&izinMenunggu).Error

	utils.SuccessResponse(c, http.StatusOK, "Statistik presensi bimbingan berhasil diambil", gin.H{
		"total":          total,
		"hadir":          hasil["hadir"],
		"terlambat":      hasil["terlambat"],
		"izin":           hasil["izin"],
		"sakit":          hasil["sakit"],
		"alfa":           hasil["alfa"],
		"lupa_presensi":  lupa,
		"total_peserta":  totalPeserta,
		"izin_menunggu":  izinMenunggu,
		"hari_ini":       utils.TanggalHariIni(),
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
	Institusi      string `json:"institusi"`
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
			COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
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

	go kirimEmailHasilIzin(izin.ID)

	utils.SuccessResponse(c, http.StatusOK, "Pengajuan izin berhasil diproses", gin.H{
		"pengajuan":            izin,
		"jumlah_hari_tercatat": jumlahHari,
	})
}