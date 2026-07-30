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
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// defaultTemplateSurat — nilai awal template pertama (mengikuti surat asli Diskominfo).
func defaultTemplateSurat() models.TemplateSurat {
	bawaan, _ := json.Marshal(services.DefaultTataLetakSurat())
	return models.TemplateSurat{
		Nama:         "Template Resmi Diskominfo",
		Keterangan:   "Template bawaan mengikuti format surat keterangan magang Diskominfo Ponorogo",
		JenisPeserta: "semua",
		Status:       "publish",
		IsDefault:    true,

		NamaPemerintah:   "PEMERINTAH KABUPATEN PONOROGO",
		NamaInstansi:     "DINAS KOMUNIKASI INFORMATIKA DAN STATISTIK",
		NamaInstansiTeks: "Dinas Komunikasi Informatika dan Statistik",
		AlamatInstansi:   "Jl. Ir. Juanda Nomor 198, Ponorogo, Jawa Timur 63418",
		Telepon:          "Telepon 0352-3592999",
		Faksimile:        "Faksimile 0352-3592999",
		Laman:            "Laman kominfo.ponorogo.go.id",
		PosEl:            "Pos-el kominfo@ponorogo.go.id",

		JudulMahasiswa: "SURAT KETERANGAN MAGANG MANDIRI",
		JudulSiswa:     "SURAT KETERANGAN PRAKTIK KERJA LAPANGAN",
		JenisMagangMhs: "magang mandiri",
		JenisMagangSis: "praktik kerja lapangan",

		ParagrafPembuka: "Menindaklanjuti surat Saudara tanggal {tanggal_surat_pengantar} Nomor {nomor_surat_pengantar} perihal permohonan izin {jenis_magang}, dengan ini Kepala {nama_instansi} Kabupaten Ponorogo menerangkan bahwa {sebutan_peserta} berikut diterima untuk melaksanakan {jenis_magang} di {nama_instansi} Kabupaten Ponorogo:",
		ParagrafPenutup: "Selama melaksanakan kegiatan, yang bersangkutan wajib menaati ketentuan dan tata tertib yang berlaku di {nama_instansi} Kabupaten Ponorogo.",
		ParagrafSalam:   "Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.",
		TempatTerbit:    "Ponorogo",

		JabatanPenandatangan: "Kepala Dinas Komunikasi Informatika dan Statistik Kabupaten Ponorogo",
		NamaPenandatangan:    "drh. H. Sapto Djatmiko Tjipto Rahardjo, M.M.",
		PangkatPenandatangan: "Pembina Utama Muda",
		NipPenandatangan:     "NIP. 19670130 199203 1 002",

		KonfigurasiTataLetak: string(bawaan),
	}
}

// seedTemplateSuratJikaKosong membuat satu template awal bila tabel masih kosong.
// Nilai kop/redaksi diambil dari pengaturan surat lama supaya hasil identik.
func seedTemplateSuratJikaKosong() error {
	var jumlah int64
	if err := config.DB.Model(&models.TemplateSurat{}).Count(&jumlah).Error; err != nil {
		return err
	}
	if jumlah > 0 {
		return nil
	}

	tpl := defaultTemplateSurat()

	var lama models.PengaturanSuratPenerimaan
	if err := config.DB.First(&lama).Error; err == nil {
		tpl.NamaPemerintah = lama.NamaPemerintah
		tpl.NamaInstansi = lama.NamaInstansi
		tpl.NamaInstansiTeks = lama.NamaInstansiTeks
		tpl.AlamatInstansi = lama.AlamatInstansi
		tpl.Telepon = lama.Telepon
		tpl.Faksimile = lama.Faksimile
		tpl.Laman = lama.Laman
		tpl.PosEl = lama.PosEl
		tpl.FileLogo = lama.FileLogo
		tpl.FileTtd = lama.FileTtd
		tpl.FileStempel = lama.FileStempel
		tpl.JudulMahasiswa = lama.JudulMahasiswa
		tpl.JudulSiswa = lama.JudulSiswa
		tpl.JenisMagangMhs = lama.JenisMagangMhs
		tpl.JenisMagangSis = lama.JenisMagangSis
		tpl.ParagrafPembuka = lama.ParagrafPembuka
		tpl.ParagrafPenutup = lama.ParagrafPenutup
		tpl.ParagrafSalam = lama.ParagrafSalam
		tpl.TempatTerbit = lama.TempatTerbit
		tpl.JabatanPenandatangan = lama.JabatanPenandatangan
		tpl.NamaPenandatangan = lama.NamaPenandatangan
		tpl.PangkatPenandatangan = lama.PangkatPenandatangan
		tpl.NipPenandatangan = lama.NipPenandatangan
	}

	return config.DB.Create(&tpl).Error
}

// TemplateSuratAktif mengambil template untuk menerbitkan surat.
// Urutan: id yang diminta -> template default -> template pertama.
func TemplateSuratAktif(id *uint) (models.TemplateSurat, error) {
	if err := seedTemplateSuratJikaKosong(); err != nil {
		return models.TemplateSurat{}, err
	}
	var tpl models.TemplateSurat
	if id != nil && *id > 0 {
		if err := config.DB.First(&tpl, *id).Error; err == nil {
			return tpl, nil
		}
	}
	if err := config.DB.Where("is_default = ?", true).First(&tpl).Error; err == nil {
		return tpl, nil
	}
	err := config.DB.Order("id asc").First(&tpl).Error
	return tpl, err
}

// ── INPUT ──
// Semua pointer agar field yang tidak dikirim tidak menimpa nilai lama.
type TemplateSuratInput struct {
	Nama         *string `json:"nama"`
	Keterangan   *string `json:"keterangan"`
	JenisPeserta *string `json:"jenis_peserta"`
	Status       *string `json:"status"`
	IsDefault    *bool   `json:"is_default"`

	NamaPemerintah   *string `json:"nama_pemerintah"`
	NamaInstansi     *string `json:"nama_instansi"`
	NamaInstansiTeks *string `json:"nama_instansi_teks"`
	AlamatInstansi   *string `json:"alamat_instansi"`
	Telepon          *string `json:"telepon"`
	Faksimile        *string `json:"faksimile"`
	Laman            *string `json:"laman"`
	PosEl            *string `json:"pos_el"`

	JudulMahasiswa  *string `json:"judul_mahasiswa"`
	JudulSiswa      *string `json:"judul_siswa"`
	JenisMagangMhs  *string `json:"jenis_magang_mhs"`
	JenisMagangSis  *string `json:"jenis_magang_sis"`
	ParagrafPembuka *string `json:"paragraf_pembuka"`
	ParagrafPenutup *string `json:"paragraf_penutup"`
	ParagrafSalam   *string `json:"paragraf_salam"`
	TempatTerbit    *string `json:"tempat_terbit"`

	JabatanPenandatangan *string `json:"jabatan_penandatangan"`
	NamaPenandatangan    *string `json:"nama_penandatangan"`
	PangkatPenandatangan *string `json:"pangkat_penandatangan"`
	NipPenandatangan     *string `json:"nip_penandatangan"`

	// Dikirim sebagai objek JSON dari frontend
	TataLetak *json.RawMessage `json:"tata_letak"`
}

func setStrTpl(tujuan *string, sumber *string) {
	if sumber != nil {
		*tujuan = strings.TrimSpace(*sumber)
	}
}

func terapkanInputTemplate(tpl *models.TemplateSurat, in TemplateSuratInput) {
	setStrTpl(&tpl.Nama, in.Nama)
	setStrTpl(&tpl.Keterangan, in.Keterangan)
	setStrTpl(&tpl.JenisPeserta, in.JenisPeserta)
	setStrTpl(&tpl.Status, in.Status)
	setStrTpl(&tpl.NamaPemerintah, in.NamaPemerintah)
	setStrTpl(&tpl.NamaInstansi, in.NamaInstansi)
	setStrTpl(&tpl.NamaInstansiTeks, in.NamaInstansiTeks)
	setStrTpl(&tpl.AlamatInstansi, in.AlamatInstansi)
	setStrTpl(&tpl.Telepon, in.Telepon)
	setStrTpl(&tpl.Faksimile, in.Faksimile)
	setStrTpl(&tpl.Laman, in.Laman)
	setStrTpl(&tpl.PosEl, in.PosEl)
	setStrTpl(&tpl.JudulMahasiswa, in.JudulMahasiswa)
	setStrTpl(&tpl.JudulSiswa, in.JudulSiswa)
	setStrTpl(&tpl.JenisMagangMhs, in.JenisMagangMhs)
	setStrTpl(&tpl.JenisMagangSis, in.JenisMagangSis)
	setStrTpl(&tpl.ParagrafPembuka, in.ParagrafPembuka)
	setStrTpl(&tpl.ParagrafPenutup, in.ParagrafPenutup)
	setStrTpl(&tpl.ParagrafSalam, in.ParagrafSalam)
	setStrTpl(&tpl.TempatTerbit, in.TempatTerbit)
	setStrTpl(&tpl.JabatanPenandatangan, in.JabatanPenandatangan)
	setStrTpl(&tpl.NamaPenandatangan, in.NamaPenandatangan)
	setStrTpl(&tpl.PangkatPenandatangan, in.PangkatPenandatangan)
	setStrTpl(&tpl.NipPenandatangan, in.NipPenandatangan)

	if in.TataLetak != nil {
		// Validasi & normalisasi lewat parser supaya angka liar tidak tersimpan
		bersih := services.ParseTataLetakSurat(string(*in.TataLetak))
		if b, err := json.Marshal(bersih); err == nil {
			tpl.KonfigurasiTataLetak = string(b)
		}
	}
	if in.IsDefault != nil {
		tpl.IsDefault = *in.IsDefault
	}
	if tpl.JenisPeserta == "" {
		tpl.JenisPeserta = "semua"
	}
	if tpl.Status == "" {
		tpl.Status = "publish"
	}
}

// GET /api/manajemen/admin/template-surat
func GetAllTemplateSurat(c *gin.Context) {
	if err := seedTemplateSuratJikaKosong(); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan template surat: "+err.Error())
		return
	}
	var data []models.TemplateSurat
	if err := config.DB.Order("is_default desc, id asc").Find(&data).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat template surat")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Daftar template surat berhasil diambil", data)
}

// GET /api/manajemen/admin/template-surat/:id
func GetTemplateSurat(c *gin.Context) {
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Detail template surat berhasil diambil", tpl)
}

// GET /api/manajemen/admin/template-surat/bawaan — nilai default tata letak (untuk tombol "Reset")
func GetTataLetakBawaanSurat(c *gin.Context) {
	utils.SuccessResponse(c, http.StatusOK, "Tata letak bawaan", services.DefaultTataLetakSurat())
}

// POST /api/manajemen/admin/template-surat
func CreateTemplateSurat(c *gin.Context) {
	var in TemplateSuratInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data tidak valid: "+err.Error())
		return
	}
	if in.Nama == nil || strings.TrimSpace(*in.Nama) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama template wajib diisi")
		return
	}

	// Mulai dari default agar template baru langsung bisa dipakai
	tpl := defaultTemplateSurat()
	tpl.IsDefault = false
	terapkanInputTemplate(&tpl, in)

	if err := config.DB.Create(&tpl).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat template surat: "+err.Error())
		return
	}
	if tpl.IsDefault {
		config.DB.Model(&models.TemplateSurat{}).Where("id <> ?", tpl.ID).Update("is_default", false)
	}
	utils.SuccessResponse(c, http.StatusCreated, "Template surat berhasil dibuat", tpl)
}

// PUT /api/manajemen/admin/template-surat/:id
func UpdateTemplateSurat(c *gin.Context) {
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}
	var in TemplateSuratInput
	if err := c.ShouldBindJSON(&in); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data tidak valid: "+err.Error())
		return
	}
	terapkanInputTemplate(&tpl, in)

	if err := config.DB.Save(&tpl).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan template surat: "+err.Error())
		return
	}
	if tpl.IsDefault {
		config.DB.Model(&models.TemplateSurat{}).Where("id <> ?", tpl.ID).Update("is_default", false)
	}
	utils.SuccessResponse(c, http.StatusOK, "Template surat berhasil diperbarui", tpl)
}

// POST /api/manajemen/admin/template-surat/:id/duplikat
func DuplikatTemplateSurat(c *gin.Context) {
	var asal models.TemplateSurat
	if err := config.DB.First(&asal, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}
	salinan := asal
	salinan.ID = 0
	salinan.Nama = asal.Nama + " (Salinan)"
	salinan.IsDefault = false
	salinan.CreatedAt = time.Time{}
	salinan.UpdatedAt = time.Time{}
	if err := config.DB.Create(&salinan).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menduplikat template: "+err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, "Template surat berhasil diduplikat", salinan)
}

// DELETE /api/manajemen/admin/template-surat/:id
func DeleteTemplateSurat(c *gin.Context) {
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}

	var jumlah int64
	config.DB.Model(&models.SuratPenerimaan{}).Where("template_surat_id = ?", tpl.ID).Count(&jumlah)
	if jumlah > 0 {
		utils.ErrorResponse(c, http.StatusBadRequest,
			fmt.Sprintf("Template masih dipakai oleh %d surat yang sudah diterbitkan", jumlah))
		return
	}

	var total int64
	config.DB.Model(&models.TemplateSurat{}).Count(&total)
	if total <= 1 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Minimal harus ada satu template surat")
		return
	}

	for _, f := range []string{tpl.FileLogo, tpl.FileTtd, tpl.FileStempel} {
		if strings.TrimSpace(f) != "" {
			os.Remove(f)
		}
	}
	if err := config.DB.Delete(&tpl).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus template surat")
		return
	}
	if tpl.IsDefault {
		var pengganti models.TemplateSurat
		if config.DB.Order("id asc").First(&pengganti).Error == nil {
			config.DB.Model(&pengganti).Update("is_default", true)
		}
	}
	utils.SuccessResponse(c, http.StatusOK, "Template surat berhasil dihapus", nil)
}

// GET /api/manajemen/admin/template-surat/:id/pratinjau?kategori=mahasiswa
// Mengembalikan PDF langsung (tanpa menyimpan file) untuk ditampilkan di iframe.
func PratinjauTemplateSurat(c *gin.Context) {
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}
	kategori := c.DefaultQuery("kategori", "mahasiswa")

	data, err := services.PratinjauSuratPDF(tpl, kategori)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat pratinjau: "+err.Error())
		return
	}
	c.Header("Content-Disposition", `inline; filename="pratinjau-surat.pdf"`)
	c.Header("Cache-Control", "no-store")
	c.Data(http.StatusOK, "application/pdf", data)
}

// POST /api/manajemen/admin/template-surat/:id/upload/:jenis  (logo|ttd|stempel)
func UploadFileTemplateSurat(c *gin.Context) {
	jenis := c.Param("jenis")
	if jenis != "logo" && jenis != "ttd" && jenis != "stempel" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File wajib diunggah")
		return
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format file harus PNG, JPG, atau JPEG")
		return
	}
	if file.Size > 5<<20 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Ukuran file maksimal 5MB")
		return
	}

	dir := filepath.Join("uploads", "surat-penerimaan", "template")
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}
	nama := fmt.Sprintf("%s-%d-%d%s", jenis, tpl.ID, time.Now().UnixNano(), ext)
	simpan := filepath.Join(dir, nama)
	if err := c.SaveUploadedFile(file, simpan); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}
	bersih := strings.ReplaceAll(simpan, "\\", "/")

	lama := ""
	switch jenis {
	case "logo":
		lama, tpl.FileLogo = tpl.FileLogo, bersih
	case "ttd":
		lama, tpl.FileTtd = tpl.FileTtd, bersih
	case "stempel":
		lama, tpl.FileStempel = tpl.FileStempel, bersih
	}
	if err := config.DB.Save(&tpl).Error; err != nil {
		os.Remove(simpan)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan data template")
		return
	}
	if lama != "" && lama != bersih {
		os.Remove(lama)
	}
	utils.SuccessResponse(c, http.StatusOK, "File berhasil diunggah", tpl)
}

// DELETE /api/manajemen/admin/template-surat/:id/upload/:jenis
func DeleteFileTemplateSurat(c *gin.Context) {
	jenis := c.Param("jenis")
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}
	lama := ""
	switch jenis {
	case "logo":
		lama, tpl.FileLogo = tpl.FileLogo, ""
	case "ttd":
		lama, tpl.FileTtd = tpl.FileTtd, ""
	case "stempel":
		lama, tpl.FileStempel = tpl.FileStempel, ""
	default:
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}
	if err := config.DB.Save(&tpl).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus file")
		return
	}
	if lama != "" {
		os.Remove(lama)
	}
	utils.SuccessResponse(c, http.StatusOK, "File berhasil dihapus", tpl)
}