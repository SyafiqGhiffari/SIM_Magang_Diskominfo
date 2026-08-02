package controllers

import (
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ── Helper ────────────────────────────────────────────────────────────────────

func pesertaIDDariToken(c *gin.Context) (uint, bool) {
	pesertaID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return 0, false
	}
	return pesertaID, true
}

// pendaftaranAktifPeserta mengambil pendaftaran magang terakhir milik peserta.
func pendaftaranAktifPeserta(pesertaID uint) *models.PendaftaranMagang {
	var p models.PendaftaranMagang
	err := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		Order("id desc").
		First(&p).Error
	if err != nil {
		return nil
	}
	return &p
}

// simpanFotoPresensi menyimpan foto selfie presensi ke uploads/presensi/YYYY-MM.
func simpanFotoPresensi(c *gin.Context, file *multipart.FileHeader, jenis string) (string, error) {
	if file == nil {
		return "", nil
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	uploadDir := filepath.Join("uploads", "presensi", utils.SekarangWIB().Format("2006-01"))
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder upload presensi")
	}

	fileName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), jenis, ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan foto presensi")
	}
	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

// izinDisetujuiPada mencari pengajuan izin/sakit yang disetujui dan mencakup tanggal tertentu.
func izinDisetujuiPada(pesertaID uint, tanggal string) *models.PengajuanIzin {
	var izin models.PengajuanIzin
	err := config.DB.
		Where("peserta_id = ? AND status = 'disetujui'", pesertaID).
		Where("tanggal_mulai <= ? AND tanggal_selesai >= ?", tanggal, tanggal).
		Order("id desc").
		First(&izin).Error
	if err != nil {
		return nil
	}
	return &izin
}

// ── 1. Status presensi hari ini ───────────────────────────────────────────────

func GetStatusPresensiHariIni(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	// pastikan hari-hari sebelumnya sudah dikunci (alfa otomatis)
	_ = services.PastikanHariTerkunci(config.DB)

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}

	tanggal := utils.TanggalHariIni()
	info := kal.CekHari(tanggal)

	var presensi models.Presensi
	adaPresensi := config.DB.
		Where("peserta_id = ? AND tanggal = ?", pesertaID, tanggal).
		First(&presensi).Error == nil

	// rekap bulan berjalan
	dari := utils.SekarangWIB().Format("2006-01") + "-01"
	type hitungan struct {
		Status string
		Total  int
	}
	var rekap []hitungan
	config.DB.Model(&models.Presensi{}).
		Select("status, COUNT(*) as total").
		Where("peserta_id = ? AND tanggal >= ? AND tanggal <= ?", pesertaID, dari, tanggal).
		Group("status").
		Scan(&rekap)

	ringkas := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	for _, r := range rekap {
		ringkas[r.Status] = r.Total
	}

	respons := gin.H{
		"tanggal":      tanggal,
		"hari":         info.Hari,
		"hari_kerja":   info.HariKerja,
		"alasan":       info.Alasan,
		"jam_sekarang": utils.JamSekarang(),
		"jam_kerja": gin.H{
			"jam_masuk":           info.JamKerja.JamMasuk,
			"jam_pulang":          info.JamKerja.JamPulang,
			"toleransi_terlambat": info.JamKerja.ToleransiTerlambat,
		},
		"sudah_masuk":     adaPresensi && presensi.JamMasuk != nil && *presensi.JamMasuk != "",
		"sudah_pulang":    adaPresensi && presensi.JamPulang != nil && *presensi.JamPulang != "",
		"presensi":        nil,
		"izin_hari_ini":   izinDisetujuiPada(pesertaID, tanggal),
		"rekap_bulan_ini": ringkas,
	}
	if adaPresensi {
		respons["presensi"] = presensi
	}

	utils.SuccessResponse(c, http.StatusOK, "Status presensi hari ini berhasil diambil", respons)
}

// ── 2. Absen masuk ────────────────────────────────────────────────────────────

func PresensiMasuk(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}

	tanggal := utils.TanggalHariIni()
	jam := utils.JamSekarang()
	info := kal.CekHari(tanggal)
	if !info.HariKerja {
		utils.ErrorResponse(c, http.StatusBadRequest, "Hari ini bukan hari kerja ("+info.Alasan+"), presensi tidak diperlukan")
		return
	}

	// sudah presensi hari ini?
	var lama models.Presensi
	sudahAda := config.DB.Where("peserta_id = ? AND tanggal = ?", pesertaID, tanggal).First(&lama).Error == nil
	if sudahAda && lama.JamMasuk != nil && *lama.JamMasuk != "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda sudah melakukan presensi masuk hari ini pada jam "+*lama.JamMasuk)
		return
	}
	if sudahAda && (lama.Status == "izin" || lama.Status == "sakit") {
		utils.ErrorResponse(c, http.StatusBadRequest, "Hari ini Anda tercatat "+lama.Status+" berdasarkan pengajuan yang disetujui mentor")
		return
	}

	// foto selfie (opsional, jpg/jpeg/png maksimal 10MB)
	fileFoto, errFile := validateUploadedFile(c, "foto", false, imageExtensions, imageMimeTypes, imageLabel)
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}
	pathFoto, errSave := simpanFotoPresensi(c, fileFoto, "masuk")
	if errSave != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, errSave.Error())
		return
	}

	hasil := kal.HitungStatusMasuk(tanggal, jam)
	keterangan := strings.TrimSpace(c.PostForm("keterangan"))
	if keterangan == "" {
		keterangan = hasil.Keterangan
	}

	presensi := lama
	presensi.PesertaID = pesertaID
	presensi.Tanggal = tanggal
	presensi.JamMasuk = &jam
	presensi.Status = hasil.Status
	presensi.MenitTerlambat = hasil.MenitTerlambat
	presensi.LupaPresensi = hasil.LupaPresensi
	presensi.Keterangan = keterangan
	presensi.Sumber = "peserta"
	presensi.DicatatOlehID = &pesertaID

	fotoMasukLama := ""
	if pathFoto != "" {
		fotoMasukLama = presensi.FotoMasuk // foto lama (kasus record ditimpa)
		presensi.FotoMasuk = pathFoto
	}
	if presensi.PendaftaranID == nil {
		if pd := pendaftaranAktifPeserta(pesertaID); pd != nil {
			presensi.PendaftaranID = &pd.ID
		}
	}

	if sudahAda {
		err = config.DB.Save(&presensi).Error
	} else {
		err = config.DB.Create(&presensi).Error
	}
	if err != nil {
		cleanupUploadedFiles(pathFoto)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan presensi masuk")
		return
	}

	// Simpan sukses → hapus foto selfie lama yang sudah tidak dipakai
	gantiFile(fotoMasukLama, pathFoto)

	pesan := "Presensi masuk berhasil dicatat"
	if hasil.Status == "terlambat" {
		pesan = fmt.Sprintf("Presensi masuk tercatat TERLAMBAT %d menit", hasil.MenitTerlambat)
	}
	utils.SuccessResponse(c, http.StatusOK, pesan, presensi)
}

// ── 3. Absen pulang ───────────────────────────────────────────────────────────

func PresensiPulang(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	tanggal := utils.TanggalHariIni()
	jam := utils.JamSekarang()

	var presensi models.Presensi
	if err := config.DB.Where("peserta_id = ? AND tanggal = ?", pesertaID, tanggal).First(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda belum melakukan presensi masuk hari ini")
		return
	}
	if presensi.JamMasuk == nil || *presensi.JamMasuk == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda belum melakukan presensi masuk hari ini")
		return
	}
	if presensi.JamPulang != nil && *presensi.JamPulang != "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda sudah melakukan presensi pulang pada jam "+*presensi.JamPulang)
		return
	}

	fileFoto, errFile := validateUploadedFile(c, "foto", false, imageExtensions, imageMimeTypes, imageLabel)
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}
	pathFoto, errSave := simpanFotoPresensi(c, fileFoto, "pulang")
	if errSave != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, errSave.Error())
		return
	}

	presensi.JamPulang = &jam

	fotoPulangLama := ""
	if pathFoto != "" {
		fotoPulangLama = presensi.FotoPulang
		presensi.FotoPulang = pathFoto
	}
	if catatan := strings.TrimSpace(c.PostForm("keterangan")); catatan != "" {
		presensi.Keterangan = catatan
	}

	if err := config.DB.Save(&presensi).Error; err != nil {
		cleanupUploadedFiles(pathFoto)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan presensi pulang")
		return
	}

	gantiFile(fotoPulangLama, pathFoto)

	utils.SuccessResponse(c, http.StatusOK, "Presensi pulang berhasil dicatat", presensi)
}

// ── 4. Riwayat presensi peserta ───────────────────────────────────────────────

func GetRiwayatPresensiSaya(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}
	_ = services.PastikanHariTerkunci(config.DB)

	bulan := c.Query("bulan") // format "YYYY-MM"
	dari, sampai, bulanNormal := rentangBulan(bulan)

	var rows []models.Presensi
	if err := config.DB.
		Where("peserta_id = ? AND tanggal >= ? AND tanggal <= ?", pesertaID, dari, sampai).
		Order("tanggal desc").
		Find(&rows).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat riwayat presensi")
		return
	}

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}
	hariKerja := kal.DaftarHariKerja(dari, sampai)

	ringkas := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	totalMenit := 0
	for _, r := range rows {
		ringkas[r.Status]++
		totalMenit += r.MenitTerlambat
	}
	persen := 0.0
	if len(hariKerja) > 0 {
		persen = float64(ringkas["hadir"]+ringkas["terlambat"]) / float64(len(hariKerja)) * 100
	}

	utils.SuccessResponse(c, http.StatusOK, "Riwayat presensi berhasil diambil", gin.H{
		"periode": gin.H{
			"bulan":             bulanNormal,
			"dari":              dari,
			"sampai":            sampai,
			"hari_kerja_efektif": len(hariKerja),
		},
		"ringkasan": gin.H{
			"hadir":                 ringkas["hadir"],
			"terlambat":             ringkas["terlambat"],
			"izin":                  ringkas["izin"],
			"sakit":                 ringkas["sakit"],
			"alfa":                  ringkas["alfa"],
			"total_menit_terlambat": totalMenit,
			"persentase_kehadiran":  persen,
		},
		"data": rows,
	})
}

// ── 5. Pengajuan izin peserta ─────────────────────────────────────────────────

func GetPengajuanIzinSaya(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	q := config.DB.Model(&models.PengajuanIzin{}).Where("peserta_id = ?", pesertaID)
	if status := strings.TrimSpace(c.Query("status")); status != "" {
		q = q.Where("status = ?", status)
	}

	var rows []models.PengajuanIzin
	if err := q.Order("created_at desc").Find(&rows).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat pengajuan izin")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengajuan izin berhasil diambil", rows)
}

func BuatPengajuanIzin(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	jenis := strings.ToLower(strings.TrimSpace(c.PostForm("jenis")))
	mulai := normalTanggal(strings.TrimSpace(c.PostForm("tanggal_mulai")))
	selesai := normalTanggal(strings.TrimSpace(c.PostForm("tanggal_selesai")))
	alasan := strings.TrimSpace(c.PostForm("alasan"))

	if jenis != "izin" && jenis != "sakit" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis pengajuan harus 'izin' atau 'sakit'")
		return
	}
	if mulai == "" || selesai == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal mulai dan tanggal selesai wajib diisi")
		return
	}
	if selesai < mulai {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal selesai tidak boleh lebih awal dari tanggal mulai")
		return
	}
	if len(alasan) < 10 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Alasan pengajuan minimal 10 karakter")
		return
	}

	// tolak jika ada pengajuan menunggu yang tanggalnya bertumpuk
	var bentrok int64
	config.DB.Model(&models.PengajuanIzin{}).
		Where("peserta_id = ? AND status IN ('menunggu','disetujui')", pesertaID).
		Where("tanggal_mulai <= ? AND tanggal_selesai >= ?", selesai, mulai).
		Count(&bentrok)
	if bentrok > 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Sudah ada pengajuan pada rentang tanggal tersebut")
		return
	}

	// file bukti: wajib untuk sakit (surat dokter), opsional untuk izin
	wajibBukti := jenis == "sakit"
	extBukti := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".pdf": true}
	mimeBukti := map[string]bool{"image/jpeg": true, "image/png": true, "application/pdf": true}
	fileBukti, errFile := validateUploadedFile(c, "file_bukti", wajibBukti, extBukti, mimeBukti, "JPG, JPEG, PNG, atau PDF")
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}
	pathBukti, errSave := simpanFotoPresensi(c, fileBukti, "bukti-izin")
	if errSave != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, errSave.Error())
		return
	}

	izin := models.PengajuanIzin{
		PesertaID:      pesertaID,
		Jenis:          jenis,
		TanggalMulai:   mulai,
		TanggalSelesai: selesai,
		Alasan:         alasan,
		FileBukti:      pathBukti,
		Status:         "menunggu",
	}
	// Kumpulkan bukti dari pengajuan lama yang DITOLAK pada rentang tanggal sama,
	// karena file-nya sudah tidak berguna lagi setelah diajukan ulang.
	var buktiLama []string
	if pathBukti != "" {
		var izinDitolak []models.PengajuanIzin
		config.DB.
			Where("peserta_id = ? AND status = 'ditolak'", pesertaID).
			Where("tanggal_mulai <= ? AND tanggal_selesai >= ?", selesai, mulai).
			Where("file_bukti <> ''").
			Find(&izinDitolak)
		for _, lama := range izinDitolak {
			buktiLama = append(buktiLama, lama.FileBukti)
		}
	}

	if err := config.DB.Create(&izin).Error; err != nil {
		cleanupUploadedFiles(pathBukti)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengajuan izin")
		return
	}

	hapusFileLama(buktiLama...)

	go kirimEmailPengajuanIzinBaru(izin.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Pengajuan berhasil dikirim, menunggu verifikasi mentor", izin)
}

func BatalkanPengajuanIzin(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var izin models.PengajuanIzin
	if err := config.DB.Where("id = ? AND peserta_id = ?", c.Param("id"), pesertaID).First(&izin).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.ErrorResponse(c, http.StatusNotFound, "Pengajuan tidak ditemukan")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat pengajuan")
		return
	}
	if izin.Status != "menunggu" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Pengajuan yang sudah diproses mentor tidak dapat dibatalkan")
		return
	}

	if err := config.DB.Delete(&izin).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membatalkan pengajuan")
		return
	}
	cleanupUploadedFiles(izin.FileBukti)

		utils.SuccessResponse(c, http.StatusOK, "Pengajuan berhasil dibatalkan", gin.H{"id": izin.ID})
}

// ── 6. Notifikasi email pengajuan izin ────────────────────────────────────────
// Dipanggil dengan `go kirimEmail...(id)` agar tidak memblokir response.
// kirimEmailHasilIzin juga dipakai oleh mentor_presensi_controller.go
// (satu package, jadi tidak perlu import).

func kirimEmailPengajuanIzinBaru(izinID uint) {
	var izin models.PengajuanIzin
	if err := config.DB.First(&izin, izinID).Error; err != nil {
		return
	}

	var peserta models.UserManajemen
	if err := config.DB.First(&peserta, izin.PesertaID).Error; err != nil {
		return
	}

	// cari mentor dari pendaftaran terakhir peserta
	var pendaftaran models.PendaftaranMagang
	if err := config.DB.
		Where("akun_peserta_id = ?", izin.PesertaID).
		Order("id desc").
		First(&pendaftaran).Error; err != nil {
		return
	}
	if pendaftaran.MentorID == nil {
		return
	}

	var mentor models.UserManajemen
	if err := config.DB.First(&mentor, *pendaftaran.MentorID).Error; err != nil || mentor.Email == "" {
		return
	}

	subject := emailtemplates.SubjectPengajuanIzinBaru(izin.Jenis, peserta.Nama)
	body := emailtemplates.TemplatePengajuanIzinBaru(
		mentor.Nama,
		peserta.Nama,
		izin.Jenis,
		izin.TanggalMulai,
		izin.TanggalSelesai,
		izin.Alasan,
	)

	if err := services.SendEmail(mentor.Email, subject, body); err != nil {
		log.Println("gagal kirim email pengajuan izin baru:", err)
	}
}

func kirimEmailHasilIzin(izinID uint) {
	var izin models.PengajuanIzin
	if err := config.DB.First(&izin, izinID).Error; err != nil {
		return
	}

	tujuan := utils.EmailAktifPeserta(config.DB, izin.PesertaID)
	if tujuan == "" {
		return
	}

	var peserta models.UserManajemen
	if err := config.DB.First(&peserta, izin.PesertaID).Error; err != nil {
		return
	}

	subject := emailtemplates.SubjectHasilPengajuanIzin(izin.Jenis, izin.Status)
	body := emailtemplates.TemplateHasilPengajuanIzin(
		peserta.Nama,
		izin.Jenis,
		izin.TanggalMulai,
		izin.TanggalSelesai,
		izin.Status,
		izin.CatatanMentor,
	)

	if err := services.SendEmail(tujuan, subject, body); err != nil {
		log.Println("gagal kirim email hasil izin:", err)
	}
}