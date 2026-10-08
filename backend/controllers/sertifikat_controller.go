// ==============================================================================
// CONTROLLER: SERTIFIKAT CONTROLLER
// DESKRIPSI : Pengelolaan sertifikat kelulusan magang resmi. Mencakup penomoran,
//             penerbitan, pembaruan status alumni, desain builder multi-template
//             sertifikat (background, QR, posisi penandatangan, stempel, logo),
//             serta akses pratinjau dan unduh sertifikat oleh peserta magang.
// ROLE TERKAIT: [ROLE: ADMIN], [ROLE: PESERTA]
// ==============================================================================

package controllers

import (
	"encoding/json"
	"fmt"
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
)

// ==============================================================================
// ── BAGIAN ADMIN: KELOLA & PENERBITAN SERTIFIKAT ──────────────────────────────
// ==============================================================================

// [ROLE: ADMIN]
// GetAllSertifikat mengambil daftar seluruh peserta magang aktif beserta status penerbitan sertifikat, pendaftaran, dan status penilaian final dari mentor.
// Endpoint: GET /api/manajemen/admin/sertifikat
func GetAllSertifikat(c *gin.Context) {
	var users []models.UserManajemen
	// Hanya peserta aktif yang ditampilkan pada kelola sertifikat
	if err := config.DB.Where("role = ? AND status_akun = ?", "peserta", "aktif").Order("created_at desc").Find(&users).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data peserta")
		return
	}

	// Peta pendaftaran per akun peserta
	var pendaftaranList []models.PendaftaranMagang
	config.DB.Where("akun_peserta_id IS NOT NULL").Find(&pendaftaranList)
	pendaftaranByAkun := map[uint]models.PendaftaranMagang{}
	for _, p := range pendaftaranList {
		if p.AkunPesertaID != nil {
			pendaftaranByAkun[*p.AkunPesertaID] = p
		}
	}

	// Peta sertifikat per akun peserta
	var sertifikatList []models.Sertifikat
	config.DB.Find(&sertifikatList)
	sertifikatByAkun := map[uint]models.Sertifikat{}
	for _, s := range sertifikatList {
		sertifikatByAkun[s.AkunPesertaID] = s
	}

	// Peta penilaian per akun peserta
	var penilaianList []models.PenilaianMagang
	config.DB.Find(&penilaianList)
	penilaianByAkun := map[uint]models.PenilaianMagang{}
	for _, pen := range penilaianList {
		penilaianByAkun[pen.PesertaID] = pen
	}

	type Resp struct {
		AkunPesertaID  uint                      `json:"akun_peserta_id"`
		Nama           string                    `json:"nama"`
		FotoProfil     string                    `json:"foto_profil"`
		Bidang         string                    `json:"bidang"`
		Institusi      string                    `json:"institusi"`
		TanggalMulai   string                    `json:"tanggal_mulai"`
		TanggalSelesai string                    `json:"tanggal_selesai"`
		Pendaftaran    *models.PendaftaranMagang `json:"pendaftaran"`
		Sertifikat     *models.Sertifikat        `json:"sertifikat"`
		Penilaian      *models.PenilaianMagang   `json:"penilaian"`
		SiapTerbit     bool                      `json:"siap_terbit"`
	}

	result := make([]Resp, 0, len(users))
	for _, u := range users {
		r := Resp{AkunPesertaID: u.ID, Nama: u.Nama, FotoProfil: u.FotoProfil}
		if p, ok := pendaftaranByAkun[u.ID]; ok {
			pCopy := p
			r.Pendaftaran = &pCopy
			r.Bidang = p.PosisiBidang
			r.TanggalMulai = p.TanggalMulai
			r.TanggalSelesai = p.TanggalSelesai
			if p.KategoriPendaftar == "mahasiswa" {
				r.Institusi = p.AsalKampus
			} else {
				r.Institusi = p.AsalSekolah
			}
		}
		if s, ok := sertifikatByAkun[u.ID]; ok {
			sCopy := s
			if s.Status == "terbit" && s.NomorSertifikat != "" && s.NomorSertifikat != "-" {
				r.Sertifikat = &sCopy
			}
		}
		if pen, ok := penilaianByAkun[u.ID]; ok {
			penCopy := pen
			r.Penilaian = &penCopy
			if pen.StatusPenilaian == "final" {
				r.SiapTerbit = true
			}
		}
		result = append(result, r)
	}

	utils.SuccessResponse(c, http.StatusOK, "Data sertifikat peserta berhasil diambil", result)
}

type CreateSertifikatInput struct {
	AkunPesertaID   uint   `json:"akun_peserta_id"`
	NomorSertifikat string `json:"nomor_sertifikat"`
}

// [ROLE: ADMIN]
// CreateSertifikat menerbitkan sertifikat kelulusan magang untuk peserta dengan menginputkan nomor registrasi sertifikat resmi dan memperbarui status magang peserta menjadi 'selesai'.
// Endpoint: POST /api/manajemen/admin/sertifikat
func CreateSertifikat(c *gin.Context) {
	var input CreateSertifikatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}
	if input.AkunPesertaID == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Peserta wajib dipilih")
		return
	}
	if strings.TrimSpace(input.NomorSertifikat) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nomor sertifikat wajib diisi")
		return
	}

	var user models.UserManajemen
	if err := config.DB.First(&user, input.AkunPesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun peserta tidak ditemukan")
		return
	}
	if user.Role != "peserta" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Akun yang dipilih bukan peserta")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", user.ID).First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran peserta tidak ditemukan")
		return
	}

	var existing models.Sertifikat
	hasExisting := config.DB.Where("akun_peserta_id = ?", user.ID).First(&existing).Error == nil
	if hasExisting && existing.Status == "terbit" && existing.NomorSertifikat != "" && existing.NomorSertifikat != "-" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Peserta ini sudah memiliki sertifikat resmi")
		return
	}

	// Cek apakah peserta sudah memiliki penilaian berstatus final dari mentor
	var pen models.PenilaianMagang
	isNilaiFinal := false
	if err := config.DB.Where("peserta_id = ? AND status_penilaian = 'final'", user.ID).First(&pen).Error; err == nil {
		isNilaiFinal = true
	}

	// Tolak HANYA jika peserta belum selesai dinilai secara resmi DAN tanggal magang belum berakhir
	if !isNilaiFinal && pendaftaran.TanggalSelesai != "" {
		if selesai, err := time.Parse("2006-01-02", pendaftaran.TanggalSelesai); err == nil {
			today, _ := time.Parse("2006-01-02", time.Now().Format("2006-01-02"))
			if !selesai.Before(today) {
				utils.ErrorResponse(c, http.StatusBadRequest, "Peserta masih aktif magang dan nilai akhir belum difinalisasi oleh mentor")
				return
			}
		}
	}

	var sertifikat models.Sertifikat
	if hasExisting {
		sertifikat = existing
		sertifikat.NomorSertifikat = strings.TrimSpace(input.NomorSertifikat)
		sertifikat.TanggalTerbit = time.Now().Format("2006-01-02")
		sertifikat.Status = "terbit"
		if err := config.DB.Save(&sertifikat).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui sertifikat")
			return
		}
	} else {
		sertifikat = models.Sertifikat{
			AkunPesertaID:   user.ID,
			NomorSertifikat: strings.TrimSpace(input.NomorSertifikat),
			TanggalTerbit:   time.Now().Format("2006-01-02"),
			Status:          "terbit",
		}
		if err := config.DB.Create(&sertifikat).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat sertifikat")
			return
		}
	}

	// Tandai status magang peserta menjadi 'selesai' (alumni) HANYA jika periode magang sudah berakhir
	if pendaftaran.TanggalSelesai != "" {
		tSelesaiStr := pendaftaran.TanggalSelesai
		if len(tSelesaiStr) >= 10 {
			tSelesaiStr = tSelesaiStr[:10]
		}
		if tSelesai, err := time.Parse("2006-01-02", tSelesaiStr); err == nil {
			hariIniTime, _ := time.Parse("2006-01-02", utils.TanggalHariIni())
			if hariIniTime.After(tSelesai) {
				config.DB.Model(&user).Update("status_magang", "selesai")
			}
		}
	}

	// Kirim notifikasi in-app & email ke peserta
	go func(pid uint, nama, email, noSertif, tglTerbit string, sID uint) {
		services.KirimNotifikasi(services.NotifikasiInput{
			TargetRole:   "peserta",
			TargetUserID: &pid,
			Tipe:         "sertifikat_terbit",
			Prioritas:    "tinggi",
			Judul:        "Sertifikat Magang Diterbitkan",
			Pesan:        fmt.Sprintf("Sertifikat kelulusan magang Diskominfo Anda telah resmi diterbitkan dengan nomor: %s.", noSertif),
			RefTabel:     "sertifikats",
			RefID:        &sID,
			UrlTujuan:    "/peserta/penilaian/sertifikat",
		})

		if email != "" {
			bodyEmail := emailtemplates.TemplateSertifikatTerbit(nama, noSertif, tglTerbit)
			_ = services.SendEmail(email, "Sertifikat Magang Diskominfo Ponorogo Telah Diterbitkan", bodyEmail)
		}
	}(user.ID, user.Nama, user.Email, sertifikat.NomorSertifikat, sertifikat.TanggalTerbit, sertifikat.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Sertifikat berhasil dibuat", sertifikat)
}

type UpdateSertifikatInput struct {
	NomorSertifikat string `json:"nomor_sertifikat"`
}

// [ROLE: ADMIN]
// UpdateSertifikat memperbarui nomor registrasi sertifikat peserta.
// Endpoint: PUT /api/manajemen/admin/sertifikat/:id
func UpdateSertifikat(c *gin.Context) {
	id := c.Param("id")

	var sertifikat models.Sertifikat
	if err := config.DB.First(&sertifikat, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sertifikat tidak ditemukan")
		return
	}

	var input UpdateSertifikatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}
	if strings.TrimSpace(input.NomorSertifikat) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nomor sertifikat wajib diisi")
		return
	}

	sertifikat.NomorSertifikat = strings.TrimSpace(input.NomorSertifikat)
	if err := config.DB.Save(&sertifikat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Sertifikat berhasil diperbarui", sertifikat)
}

// [ROLE: ADMIN]
// DeleteSertifikat membatalkan dan menghapus sertifikat peserta beserta berkas fisik sertifikat jika ada.
// Endpoint: DELETE /api/manajemen/admin/sertifikat/:id
func DeleteSertifikat(c *gin.Context) {
	id := c.Param("id")

	var sertifikat models.Sertifikat
	if err := config.DB.First(&sertifikat, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sertifikat tidak ditemukan")
		return
	}

	if sertifikat.FileSertifikat != "" {
		_ = os.Remove(sertifikat.FileSertifikat)
	}

	if err := config.DB.Delete(&sertifikat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Sertifikat berhasil dihapus", nil)
}

// ==============================================================================
// ── PENGATURAN SERTIFIKAT BAWAAN (DEFAULT SINGLE SETTING) ─────────────────────
// ==============================================================================

func defaultTemplateSertifikat() models.TemplateSertifikat {
	return models.TemplateSertifikat{
		Nama:         "Template Resmi Diskominfo",
		Kategori:     "Magang",
		JenisPeserta: "mahasiswa",
		Bahasa:       "Indonesia",
		Orientasi:    "landscape",
		TempatTerbit: "Ponorogo",
		Status:       "publish",
	}
}

// TemplateSertifikatAktif mengambil template sertifikat yang sedang aktif (publish).
func TemplateSertifikatAktif() (models.TemplateSertifikat, error) {
	var t models.TemplateSertifikat
	if err := config.DB.Where("status = ?", "publish").Order("updated_at desc").First(&t).Error; err == nil {
		return t, nil
	}
	if err := config.DB.Order("id asc").First(&t).Error; err == nil {
		return t, nil
	}
	t = defaultTemplateSertifikat()
	if err := config.DB.Create(&t).Error; err != nil {
		return t, err
	}
	return t, nil
}

// [ROLE: ADMIN]
// GetPengaturanSertifikat mengambil template sertifikat yang sedang aktif.
// Endpoint: GET /api/manajemen/admin/pengaturan-sertifikat
func GetPengaturanSertifikat(c *gin.Context) {
	t, err := TemplateSertifikatAktif()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template sertifikat")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template sertifikat berhasil diambil", t)
}

type UpdatePengaturanSertifikatInput struct {
	TempatTerbit     *string `json:"tempat_terbit"`
	KonfigurasiField *string `json:"konfigurasi_field"`
}

// [ROLE: ADMIN]
// UpdatePengaturanSertifikat memperbarui kota tempat penerbitan dan konfigurasi posisi field pada template sertifikat aktif.
// Endpoint: PUT /api/manajemen/admin/pengaturan-sertifikat
func UpdatePengaturanSertifikat(c *gin.Context) {
	t, err := TemplateSertifikatAktif()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template sertifikat")
		return
	}

	var input UpdatePengaturanSertifikatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}

	if input.TempatTerbit != nil {
		t.TempatTerbit = strings.TrimSpace(*input.TempatTerbit)
	}
	if input.KonfigurasiField != nil {
		t.KonfigurasiField = *input.KonfigurasiField
	}

	if err := config.DB.Save(&t).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Template sertifikat berhasil disimpan", t)
}

// [ROLE: ADMIN]
// UploadFilePengaturanSertifikat mengunggah berkas template background, tanda tangan, atau stempel langsung pada template aktif.
// Endpoint: POST /api/manajemen/admin/pengaturan-sertifikat/upload/:jenis
func UploadFilePengaturanSertifikat(c *gin.Context) {
	jenis := c.Param("jenis")
	if jenis != "template" && jenis != "ttd" && jenis != "stempel" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	t, err := TemplateSertifikatAktif()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template sertifikat")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File wajib diunggah")
		return
	}

	// Template boleh PDF; TTD/stempel hanya gambar
	allowedExt := map[string]bool{".png": true, ".jpg": true, ".jpeg": true}
	if jenis == "template" {
		allowedExt[".pdf"] = true
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		if jenis == "template" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Template harus PNG, JPG, JPEG, atau PDF")
		} else {
			utils.ErrorResponse(c, http.StatusBadRequest, "Format file harus PNG, JPG, atau JPEG")
		}
		return
	}

	const maxSize = 10 << 20 // 10MB
	if file.Size > maxSize {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran file maksimal 10MB")
		return
	}

	uploadDir := filepath.Join("uploads", "sertifikat")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}

	fileName := fmt.Sprintf("%s-%d%s", jenis, time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	switch jenis {
	case "template":
		if t.FileTemplate != "" {
			_ = os.Remove(t.FileTemplate)
		}
		t.FileTemplate = cleanPath
		if ext == ".pdf" {
			t.TipeTemplate = "pdf"
		} else {
			t.TipeTemplate = "image"
		}
	case "ttd":
		if t.FileTtd != "" {
			_ = os.Remove(t.FileTtd)
		}
		t.FileTtd = cleanPath
	case "stempel":
		if t.FileStempel != "" {
			_ = os.Remove(t.FileStempel)
		}
		t.FileStempel = cleanPath
	}

	if err := config.DB.Save(&t).Error; err != nil {
		_ = os.Remove(savePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "File berhasil diunggah", gin.H{
		"jenis": jenis,
		"path":  cleanPath,
		"url":   "/" + cleanPath,
		"tipe":  t.TipeTemplate,
	})
}

// [ROLE: ADMIN]
// DeleteFilePengaturanSertifikat menghapus berkas latar belakang template, spesimen tanda tangan, atau stempel.
// Endpoint: DELETE /api/manajemen/admin/pengaturan-sertifikat/upload/:jenis
func DeleteFilePengaturanSertifikat(c *gin.Context) {
	jenis := c.Param("jenis")
	if jenis != "template" && jenis != "ttd" && jenis != "stempel" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	t, err := TemplateSertifikatAktif()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template sertifikat")
		return
	}

	switch jenis {
	case "template":
		if t.FileTemplate != "" {
			_ = os.Remove(t.FileTemplate)
		}
		t.FileTemplate = ""
		t.TipeTemplate = ""
	case "ttd":
		if t.FileTtd != "" {
			_ = os.Remove(t.FileTtd)
		}
		t.FileTtd = ""
	case "stempel":
		if t.FileStempel != "" {
			_ = os.Remove(t.FileStempel)
		}
		t.FileStempel = ""
	}

	if err := config.DB.Save(&t).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template sertifikat")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "File berhasil dihapus", t)
}

// ==============================================================================
// ── BAGIAN PESERTA: LIHAT & UNDUH SERTIFIKAT ──────────────────────────────────
// ==============================================================================

// [ROLE: PESERTA]
// GetSertifikatPesertaSaya mengambil data sertifikat kelulusan yang telah diterbitkan beserta template aktif untuk pratinjau dan unduh PDF oleh peserta.
// Endpoint: GET /api/manajemen/peserta/sertifikat
func GetSertifikatPesertaSaya(c *gin.Context) {
	pesertaID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

	var user models.UserManajemen
	if err := config.DB.First(&user, pesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data peserta tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	hasPendaftaran := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		Order("id desc").
		First(&pendaftaran).Error == nil

	var sertifikat models.Sertifikat
	hasSertifikat := config.DB.
		Where("akun_peserta_id = ? AND status = 'terbit' AND nomor_sertifikat != '' AND nomor_sertifikat != '-'", pesertaID).
		First(&sertifikat).Error == nil

	activeTpl, _ := TemplateSertifikatAktif()

	pengaturanRes := gin.H{
		"id":                     activeTpl.ID,
		"file_template":          activeTpl.FileTemplate,
		"tipe_template":          activeTpl.TipeTemplate,
		"tempat_terbit":          activeTpl.TempatTerbit,
		"file_ttd":               activeTpl.FileTtd,
		"file_stempel":           activeTpl.FileStempel,
		"file_logo":              activeTpl.FileLogo,
		"nama_penandatangan":     activeTpl.NamaPenandatangan,
		"jabatan_penandatangan":  activeTpl.JabatanPenandatangan,
		"penandatangan":          activeTpl.Penandatangan,
		"konfigurasi_field":      activeTpl.KonfigurasiField,
	}

	institusi := ""
	if hasPendaftaran {
		if pendaftaran.KategoriPendaftar == "mahasiswa" {
			institusi = pendaftaran.AsalKampus
		} else {
			institusi = pendaftaran.AsalSekolah
		}
	}

	row := gin.H{
		"akun_peserta_id": user.ID,
		"nama":            user.Nama,
		"foto_profil":     user.FotoProfil,
		"institusi":       institusi,
	}
	if hasPendaftaran {
		row["bidang"] = pendaftaran.PosisiBidang
		row["tanggal_mulai"] = pendaftaran.TanggalMulai
		row["tanggal_selesai"] = pendaftaran.TanggalSelesai
		row["pendaftaran"] = pendaftaran
	}
	if hasSertifikat {
		row["sertifikat"] = sertifikat
	}

	utils.SuccessResponse(c, http.StatusOK, "Data sertifikat peserta berhasil diambil", gin.H{
		"ada_sertifikat": hasSertifikat,
		"data":           row,
		"pengaturan":     pengaturanRes,
	})
}

// ==============================================================================
// ── TEMPLATE SERTIFIKAT (MULTI-TEMPLATE BUILDER & DESAIN) ─────────────────────
// ==============================================================================

// [ROLE: ADMIN]
// GetAllTemplateSertifikat mengambil daftar seluruh desain template sertifikat yang tersimpan di sistem.
// Endpoint: GET /api/manajemen/admin/template-sertifikat
func GetAllTemplateSertifikat(c *gin.Context) {
	var list []models.TemplateSertifikat
	if err := config.DB.Order("created_at desc").Find(&list).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil daftar template")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Daftar template berhasil diambil", list)
}

// [ROLE: ADMIN]
// GetTemplateSertifikat mengambil detail satu template desain sertifikat berdasarkan ID.
// Endpoint: GET /api/manajemen/admin/template-sertifikat/:id
func GetTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template berhasil diambil", t)
}

const maxTemplateFileSize = 10 << 20 // 10MB

// [ROLE: ADMIN]
// CreateTemplateSertifikat membuat desain template sertifikat baru lengkap dengan unggahan file background (PNG/JPG/PDF) dan konfigurasi tata letak.
// Endpoint: POST /api/manajemen/admin/template-sertifikat
func CreateTemplateSertifikat(c *gin.Context) {
	nama := strings.TrimSpace(c.PostForm("nama"))
	if nama == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Background template wajib diunggah")
		return
	}
	allowedExt := map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".pdf": true}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Background harus PNG, JPG, JPEG, atau PDF")
		return
	}
	if file.Size > maxTemplateFileSize {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran file maksimal 10MB")
		return
	}

	uploadDir := filepath.Join("uploads", "sertifikat")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}
	fileName := fmt.Sprintf("template-%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	tipe := "image"
	if ext == ".pdf" {
		tipe = "pdf"
	}
	orientasi := strings.TrimSpace(c.PostForm("orientasi"))
	if orientasi != "portrait" {
		orientasi = "landscape"
	}
	tempatTerbit := strings.TrimSpace(c.PostForm("tempat_terbit"))
	if tempatTerbit == "" {
		tempatTerbit = "Ponorogo"
	}

	jenisPeserta := strings.TrimSpace(c.PostForm("jenis_peserta"))
	if jenisPeserta != "mahasiswa" && jenisPeserta != "siswa" {
		jenisPeserta = "mahasiswa"
	}

	t := models.TemplateSertifikat{
		Nama:                 nama,
		Kategori:             strings.TrimSpace(c.PostForm("kategori")),
		JenisPeserta:         jenisPeserta,
		Bahasa:               "Indonesia",
		FileTemplate:         cleanPath,
		TipeTemplate:         tipe,
		Orientasi:            orientasi,
		NamaPenandatangan:    strings.TrimSpace(c.PostForm("nama_penandatangan")),
		JabatanPenandatangan: strings.TrimSpace(c.PostForm("jabatan_penandatangan")),
		TempatTerbit:         tempatTerbit,
		KonfigurasiField:     c.PostForm("konfigurasi_field"),
		Penandatangan:        c.PostForm("penandatangan"),
		Status:               "publish",
	}
	if err := config.DB.Create(&t).Error; err != nil {
		_ = os.Remove(savePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat template")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Template berhasil dibuat", t)
}

type UpdateTemplateSertifikatInput struct {
	Nama                 *string `json:"nama"`
	Kategori             *string `json:"kategori"`
	JenisPeserta         *string `json:"jenis_peserta"`
	Bahasa               *string `json:"bahasa"`
	Orientasi            *string `json:"orientasi"`
	NamaPenandatangan    *string `json:"nama_penandatangan"`
	JabatanPenandatangan *string `json:"jabatan_penandatangan"`
	TempatTerbit         *string `json:"tempat_terbit"`
	KonfigurasiField     *string `json:"konfigurasi_field"`
	Penandatangan        *string `json:"penandatangan"`
	Status               *string `json:"status"`
}

// [ROLE: ADMIN]
// UpdateTemplateSertifikat memperbarui informasi metadata template sertifikat (nama, kategori, jenis peserta, posisi field, pejabat penandatangan).
// Endpoint: PUT /api/manajemen/admin/template-sertifikat/:id
func UpdateTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}

	var input UpdateTemplateSertifikatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}

	if input.Nama != nil {
		n := strings.TrimSpace(*input.Nama)
		if n == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
			return
		}
		t.Nama = n
	}
	if input.Kategori != nil {
		t.Kategori = strings.TrimSpace(*input.Kategori)
	}
	if input.JenisPeserta != nil {
		jp := strings.TrimSpace(*input.JenisPeserta)
		if jp == "mahasiswa" || jp == "siswa" {
			t.JenisPeserta = jp
		}
	}
	if input.Bahasa != nil {
		t.Bahasa = strings.TrimSpace(*input.Bahasa)
	}
	if input.Orientasi != nil {
		o := strings.TrimSpace(*input.Orientasi)
		if o == "portrait" || o == "landscape" {
			t.Orientasi = o
		}
	}
	if input.NamaPenandatangan != nil {
		t.NamaPenandatangan = strings.TrimSpace(*input.NamaPenandatangan)
	}
	if input.JabatanPenandatangan != nil {
		t.JabatanPenandatangan = strings.TrimSpace(*input.JabatanPenandatangan)
	}
	if input.TempatTerbit != nil {
		t.TempatTerbit = strings.TrimSpace(*input.TempatTerbit)
	}
	if input.KonfigurasiField != nil {
		t.KonfigurasiField = *input.KonfigurasiField
	}
	if input.Penandatangan != nil {
		t.Penandatangan = *input.Penandatangan
	}
	if input.Status != nil {
		s := strings.TrimSpace(*input.Status)
		if s == "draft" || s == "publish" {
			t.Status = s
		}
	}

	if err := config.DB.Save(&t).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template berhasil disimpan", t)
}

// [ROLE: ADMIN]
// UploadFileTemplateSertifikat mengunggah atau mengganti berkas latar belakang template, tanda tangan penandatangan, stempel, atau logo untuk template spesifik.
// Endpoint: POST /api/manajemen/admin/template-sertifikat/:id/upload/:jenis
func UploadFileTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	jenis := c.Param("jenis")
	if jenis != "template" && jenis != "ttd" && jenis != "stempel" && jenis != "logo" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File wajib diunggah")
		return
	}
	allowedExt := map[string]bool{".png": true, ".jpg": true, ".jpeg": true}
	if jenis == "template" {
		allowedExt[".pdf"] = true
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExt[ext] {
		if jenis == "template" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Template harus PNG, JPG, JPEG, atau PDF")
		} else {
			utils.ErrorResponse(c, http.StatusBadRequest, "Format file harus PNG, JPG, atau JPEG")
		}
		return
	}
	if file.Size > maxTemplateFileSize {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran file maksimal 10MB")
		return
	}

	uploadDir := filepath.Join("uploads", "sertifikat")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}
	fileName := fmt.Sprintf("%s-%d%s", jenis, time.Now().UnixNano(), ext)
	savePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	switch jenis {
	case "template":
		if t.FileTemplate != "" {
			_ = os.Remove(t.FileTemplate)
		}
		t.FileTemplate = cleanPath
		if ext == ".pdf" {
			t.TipeTemplate = "pdf"
		} else {
			t.TipeTemplate = "image"
		}
	case "ttd":
		if pid := strings.TrimSpace(c.PostForm("penandatangan_id")); pid != "" {
			var list []map[string]interface{}
			_ = json.Unmarshal([]byte(t.Penandatangan), &list)
			found := false
			for i := range list {
				if fmt.Sprint(list[i]["id"]) == pid {
					if old, ok := list[i]["file_ttd"].(string); ok && old != "" {
						_ = os.Remove(old)
					}
					list[i]["file_ttd"] = cleanPath
					found = true
					break
				}
			}
			if !found {
				list = append(list, map[string]interface{}{"id": pid, "file_ttd": cleanPath})
			}
			b, _ := json.Marshal(list)
			t.Penandatangan = string(b)
		} else {
			if t.FileTtd != "" {
				_ = os.Remove(t.FileTtd)
			}
			t.FileTtd = cleanPath
		}
	case "stempel":
		if t.FileStempel != "" {
			_ = os.Remove(t.FileStempel)
		}
		t.FileStempel = cleanPath
	case "logo":
		if t.FileLogo != "" {
			_ = os.Remove(t.FileLogo)
		}
		t.FileLogo = cleanPath
	}

	if err := config.DB.Save(&t).Error; err != nil {
		_ = os.Remove(savePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "File berhasil diunggah", gin.H{
		"jenis": jenis,
		"path":  cleanPath,
		"url":   "/" + cleanPath,
		"tipe":  t.TipeTemplate,
	})
}

// [ROLE: ADMIN]
// DeleteFileTemplateSertifikat menghapus berkas aset gambar (tanda tangan, stempel, atau logo) dari template sertifikat tertentu.
// Endpoint: DELETE /api/manajemen/admin/template-sertifikat/:id/upload/:jenis
func DeleteFileTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	jenis := c.Param("jenis")
	if jenis != "template" && jenis != "ttd" && jenis != "stempel" && jenis != "logo" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}

	switch jenis {
	case "template":
		if t.FileTemplate != "" {
			_ = os.Remove(t.FileTemplate)
		}
		t.FileTemplate = ""
		t.TipeTemplate = ""
	case "ttd":
		if t.FileTtd != "" {
			_ = os.Remove(t.FileTtd)
		}
		t.FileTtd = ""
	case "stempel":
		if t.FileStempel != "" {
			_ = os.Remove(t.FileStempel)
		}
		t.FileStempel = ""
	case "logo":
		if t.FileLogo != "" {
			_ = os.Remove(t.FileLogo)
		}
		t.FileLogo = ""
	}

	if err := config.DB.Save(&t).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "File berhasil dihapus", t)
}

// [ROLE: ADMIN]
// DeleteTemplateSertifikat menghapus desain template sertifikat beserta seluruh file berkas fisiknya dari server.
// Endpoint: DELETE /api/manajemen/admin/template-sertifikat/:id
func DeleteTemplateSertifikat(c *gin.Context) {
	id := c.Param("id")
	var t models.TemplateSertifikat
	if err := config.DB.First(&t, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template tidak ditemukan")
		return
	}

	if t.FileTemplate != "" {
		_ = os.Remove(t.FileTemplate)
	}
	if t.FileTtd != "" {
		_ = os.Remove(t.FileTtd)
	}
	if t.Penandatangan != "" {
		var list []map[string]interface{}
		if err := json.Unmarshal([]byte(t.Penandatangan), &list); err == nil {
			for _, item := range list {
				if f, ok := item["file_ttd"].(string); ok && f != "" {
					_ = os.Remove(f)
				}
			}
		}
	}
	if t.FileStempel != "" {
		_ = os.Remove(t.FileStempel)
	}
	if t.FileLogo != "" {
		_ = os.Remove(t.FileLogo)
	}

	if err := config.DB.Delete(&t).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus template")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Template berhasil dihapus", nil)
}