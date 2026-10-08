// ==============================================================================
// CONTROLLER: SURAT PENERIMAAN CONTROLLER
// DESKRIPSI : Pengelolaan surat keterangan penerimaan magang resmi. Mencakup
//             penerbitan surat penerimaan bagi pendaftar yang diterima, generate PDF,
//             pengiriman otomatis via email, pengaturan kop & redaksi kedinasan,
//             serta visual layout builder & drag position template surat.
// ROLE TERKAIT: [ROLE: ADMIN]
// ==============================================================================

package controllers

import (
	"encoding/json"
	"fmt"
	"log"
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

// ==================== PENGATURAN SURAT PENERIMAAN ====================

// [ROLE: ADMIN]
// GetPengaturanSuratPenerimaan mengambil pengaturan umum surat penerimaan magang dari template surat aktif.
// Endpoint: GET /api/manajemen/admin/pengaturan-surat
func GetPengaturanSuratPenerimaan(c *gin.Context) {
	p, err := TemplateSuratAktif(nil)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan surat penerimaan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Pengaturan surat penerimaan berhasil diambil", p)
}

// Struct input terpisah: TIDAK memuat CreatedAt/UpdatedAt/ID/file, supaya
// GORM tidak pernah menulis timestamp kosong ('0000-00-00') yang ditolak MySQL.
type PengaturanSuratInput struct {
	NamaPemerintah *string `json:"nama_pemerintah"`
	NamaInstansi     *string `json:"nama_instansi"`
	NamaInstansiTeks *string `json:"nama_instansi_teks"`
	AlamatInstansi *string `json:"alamat_instansi"`
	Telepon        *string `json:"telepon"`
	Faksimile      *string `json:"faksimile"`
	Laman          *string `json:"laman"`
	PosEl          *string `json:"pos_el"`

	JudulMahasiswa *string `json:"judul_mahasiswa"`
	JudulSiswa     *string `json:"judul_siswa"`
	JenisMagangMhs *string `json:"jenis_magang_mhs"`
	JenisMagangSis *string `json:"jenis_magang_sis"`

	ParagrafPembuka *string `json:"paragraf_pembuka"`
	ParagrafPenutup *string `json:"paragraf_penutup"`
	ParagrafSalam   *string `json:"paragraf_salam"`

	TempatTerbit         *string `json:"tempat_terbit"`
	JabatanPenandatangan *string `json:"jabatan_penandatangan"`
	NamaPenandatangan    *string `json:"nama_penandatangan"`
	PangkatPenandatangan *string `json:"pangkat_penandatangan"`
	NipPenandatangan     *string `json:"nip_penandatangan"`
}

// [ROLE: ADMIN]
// UpdatePengaturanSuratPenerimaan memperbarui data kop dinas, redaksi pembuka/penutup, dan pejabat penandatangan surat penerimaan.
// Endpoint: PUT /api/manajemen/admin/pengaturan-surat
func UpdatePengaturanSuratPenerimaan(c *gin.Context) {
	p, err := TemplateSuratAktif(nil)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template surat penerimaan: "+err.Error())
		return
	}

	var input PengaturanSuratInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}

	// Hanya field yang benar-benar dikirim yang ditimpa (pointer nil = tidak dikirim).
	setStr := func(tujuan *string, nilai *string) {
		if nilai != nil {
			*tujuan = strings.TrimSpace(*nilai)
		}
	}

	setStr(&p.NamaPemerintah, input.NamaPemerintah)
	setStr(&p.NamaInstansi, input.NamaInstansi)
	setStr(&p.NamaInstansiTeks, input.NamaInstansiTeks)
	setStr(&p.AlamatInstansi, input.AlamatInstansi)
	setStr(&p.Telepon, input.Telepon)
	setStr(&p.Faksimile, input.Faksimile)
	setStr(&p.Laman, input.Laman)
	setStr(&p.PosEl, input.PosEl)

	setStr(&p.JudulMahasiswa, input.JudulMahasiswa)
	setStr(&p.JudulSiswa, input.JudulSiswa)
	setStr(&p.JenisMagangMhs, input.JenisMagangMhs)
	setStr(&p.JenisMagangSis, input.JenisMagangSis)

	setStr(&p.ParagrafPembuka, input.ParagrafPembuka)
	setStr(&p.ParagrafPenutup, input.ParagrafPenutup)
	setStr(&p.ParagrafSalam, input.ParagrafSalam)

	setStr(&p.TempatTerbit, input.TempatTerbit)
	setStr(&p.JabatanPenandatangan, input.JabatanPenandatangan)
	setStr(&p.NamaPenandatangan, input.NamaPenandatangan)
	setStr(&p.PangkatPenandatangan, input.PangkatPenandatangan)
	setStr(&p.NipPenandatangan, input.NipPenandatangan)

	if err := config.DB.Save(&p).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan surat penerimaan: "+err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Pengaturan surat penerimaan berhasil disimpan", p)
}

// [ROLE: ADMIN]
// UploadFilePengaturanSurat mengunggah berkas logo instansi, spesimen tanda tangan, atau stempel kedinasan pada pengaturan surat penerimaan.
// Endpoint: POST /api/manajemen/admin/pengaturan-surat/upload/:jenis
func UploadFilePengaturanSurat(c *gin.Context) {
	jenis := c.Param("jenis")
	if jenis != "logo" && jenis != "ttd" && jenis != "stempel" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	p, err := TemplateSuratAktif(nil)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template surat penerimaan")
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

	uploadDir := filepath.Join("uploads", "surat-penerimaan")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder upload")
		return
	}

	savePath := filepath.Join(uploadDir, fmt.Sprintf("%s-%d%s", jenis, time.Now().UnixNano(), ext))
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}
	cleanPath := strings.ReplaceAll(savePath, "\\", "/")

	switch jenis {
	case "logo":
		if p.FileLogo != "" {
			_ = os.Remove(p.FileLogo)
		}
		p.FileLogo = cleanPath
	case "ttd":
		if p.FileTtd != "" {
			_ = os.Remove(p.FileTtd)
		}
		p.FileTtd = cleanPath
	case "stempel":
		if p.FileStempel != "" {
			_ = os.Remove(p.FileStempel)
		}
		p.FileStempel = cleanPath
	}

	if err := config.DB.Save(&p).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "File berhasil diunggah", p)
}

// [ROLE: ADMIN]
// DeleteFilePengaturanSurat menghapus file logo instansi, tanda tangan, atau stempel dari pengaturan surat penerimaan.
// Endpoint: DELETE /api/manajemen/admin/pengaturan-surat/upload/:jenis
func DeleteFilePengaturanSurat(c *gin.Context) {
	jenis := c.Param("jenis")
	p, err := TemplateSuratAktif(nil)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template surat penerimaan")
		return
	}

	switch jenis {
	case "logo":
		if p.FileLogo != "" {
			_ = os.Remove(p.FileLogo)
		}
		p.FileLogo = ""
	case "ttd":
		if p.FileTtd != "" {
			_ = os.Remove(p.FileTtd)
		}
		p.FileTtd = ""
	case "stempel":
		if p.FileStempel != "" {
			_ = os.Remove(p.FileStempel)
		}
		p.FileStempel = ""
	default:
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file tidak valid")
		return
	}

	if err := config.DB.Save(&p).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "File berhasil dihapus", p)
}

// ==================== SURAT PENERIMAAN ====================

type SuratPenerimaanInput struct {
	PendaftaranMagangID uint  `json:"pendaftaran_magang_id"`
	TemplateSuratID     *uint `json:"template_surat_id"`
	NomorSurat          string `json:"nomor_surat"`
	TanggalTerbit       string `json:"tanggal_terbit"`

	JabatanTujuan   string `json:"jabatan_tujuan"`
	UnitTujuan      string `json:"unit_tujuan"`
	InstitusiTujuan string `json:"institusi_tujuan"`
	KotaTujuan      string `json:"kota_tujuan"`

	NomorSuratPengantar   string `json:"nomor_surat_pengantar"`
	TanggalSuratPengantar string `json:"tanggal_surat_pengantar"`

	// KirimEmail: nil dianggap true. Admin bisa mematikan pengiriman email
	// lewat saklar di modal bila surat hanya untuk arsip internal.
	KirimEmail *bool `json:"kirim_email"`
}

// [ROLE: ADMIN]
// GetAllSuratPenerimaan mengambil daftar seluruh calon peserta berstatus 'diterima' beserta surat penerimaan yang telah atau belum diterbitkan.
// Endpoint: GET /api/manajemen/admin/surat-penerimaan
func GetAllSuratPenerimaan(c *gin.Context) {
	var pendaftaranList []models.PendaftaranMagang
	if err := config.DB.Where("status_pendaftaran = ?", "diterima").
		Order("updated_at desc").Find(&pendaftaranList).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data pendaftaran")
		return
	}

	var suratList []models.SuratPenerimaan
	config.DB.Find(&suratList)
	suratByPendaftaran := map[uint]models.SuratPenerimaan{}
	for _, s := range suratList {
		suratByPendaftaran[s.PendaftaranMagangID] = s
	}

	type Resp struct {
		PendaftaranID uint                    `json:"pendaftaran_id"`
		Nama          string                  `json:"nama"`
		Kategori      string                  `json:"kategori"`
		NomorInduk    string                  `json:"nomor_induk"`
		Institusi     string                  `json:"institusi"`
		Bidang        string                  `json:"bidang"`
		FilePasFoto   string                  `json:"file_pas_foto"`
		TanggalMulai  string                  `json:"tanggal_mulai"`
		TanggalAkhir  string                  `json:"tanggal_selesai"`
		Surat         *models.SuratPenerimaan `json:"surat"`
	}

	result := make([]Resp, 0, len(pendaftaranList))
	for _, p := range pendaftaranList {
		nomorInduk, institusi := p.NpmNim, p.AsalKampus
		if p.KategoriPendaftar == "siswa" {
			nomorInduk, institusi = p.Nisn, p.AsalSekolah
		}

		item := Resp{
			PendaftaranID: p.ID,
			Nama:          p.NamaLengkap,
			Kategori:      p.KategoriPendaftar,
			NomorInduk:    nomorInduk,
			Institusi:     institusi,
			Bidang:        p.PosisiBidang,
			FilePasFoto:   p.FilePasFoto,
			TanggalMulai:  p.TanggalMulai,
			TanggalAkhir:  p.TanggalSelesai,
		}
		if s, ok := suratByPendaftaran[p.ID]; ok {
			salinan := s
			item.Surat = &salinan
		}
		result = append(result, item)
	}

	utils.SuccessResponse(c, http.StatusOK, "Data surat penerimaan berhasil diambil", result)
}

// [ROLE: ADMIN]
// GetSuratPenerimaan mengambil detail data satu surat penerimaan magang beserta relasi data pendaftarannya.
// Endpoint: GET /api/manajemen/admin/surat-penerimaan/:id
func GetSuratPenerimaan(c *gin.Context) {
	var surat models.SuratPenerimaan
	if err := config.DB.Preload("PendaftaranMagang").First(&surat, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Surat penerimaan tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Detail surat penerimaan berhasil diambil", surat)
}

// [ROLE: ADMIN]
// PratinjauSuratPenerimaan merender dokumen PDF surat penerimaan sementara secara real-time tanpa menyimpan ke database.
// Endpoint: POST /api/manajemen/admin/surat-penerimaan/pratinjau
func PratinjauSuratPenerimaan(c *gin.Context) {
	var input SuratPenerimaanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}
	if input.PendaftaranMagangID == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Pendaftar wajib dipilih")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.First(&pendaftaran, input.PendaftaranMagangID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran tidak ditemukan")
		return
	}

	tpl, err := TemplateSuratAktif(input.TemplateSuratID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template surat: "+err.Error())
		return
	}

	// Pratinjau sengaja tidak memvalidasi kelengkapan seketat Create/Update,
	// supaya admin tetap bisa mengecek tata letak walau isian belum final.
	tanggalTerbit := strings.TrimSpace(input.TanggalTerbit)
	if tanggalTerbit == "" {
		tanggalTerbit = time.Now().Format("2006-01-02")
	}

	nomorInduk, labelInduk := pendaftaran.NpmNim, "NPM"
	judul, jenis := tpl.JudulMahasiswa, tpl.JenisMagangMhs
	if pendaftaran.KategoriPendaftar == "siswa" {
		nomorInduk, labelInduk = pendaftaran.Nisn, "NISN"
		judul, jenis = tpl.JudulSiswa, tpl.JenisMagangSis
	}

	d := services.DataSurat{
		NomorSurat:            strings.TrimSpace(input.NomorSurat),
		TanggalTerbit:         tanggalTerbit,
		JabatanTujuan:         strings.TrimSpace(input.JabatanTujuan),
		UnitTujuan:            strings.TrimSpace(input.UnitTujuan),
		InstitusiTujuan:       strings.TrimSpace(input.InstitusiTujuan),
		KotaTujuan:            strings.TrimSpace(input.KotaTujuan),
		NomorSuratPengantar:   strings.TrimSpace(input.NomorSuratPengantar),
		TanggalSuratPengantar: strings.TrimSpace(input.TanggalSuratPengantar),

		Nama:       pendaftaran.NamaLengkap,
		NomorInduk: nomorInduk,
		LabelInduk: labelInduk,
		Kategori:   pendaftaran.KategoriPendaftar,
		Bidang:     pendaftaran.PosisiBidang,
		Mulai:      pendaftaran.TanggalMulai,
		Selesai:    pendaftaran.TanggalSelesai,

		JudulSurat:  judul,
		JenisMagang: jenis,

		JabatanTtd: tpl.JabatanPenandatangan,
		NamaTtd:    tpl.NamaPenandatangan,
		PangkatTtd: tpl.PangkatPenandatangan,
		NipTtd:     tpl.NipPenandatangan,
	}

	berkas, err := services.SuratPDFBytes(d, tpl)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat pratinjau PDF: "+err.Error())
		return
	}

	c.Header("Cache-Control", "no-store")
	c.Data(http.StatusOK, "application/pdf", berkas)
}

// urlPublikBerkas mengubah path lokal berkas (mis. "uploads/surat-penerimaan/surat-4-...pdf")
// menjadi URL absolut yang bisa dibuka dari email peserta.
func urlPublikBerkas(path string) string {
	path = strings.TrimSpace(path)
	if path == "" {
		return ""
	}

	basis := strings.TrimRight(strings.TrimSpace(os.Getenv("APP_URL")), "/")
	if basis == "" {
		basis = "http://localhost:" + strings.TrimSpace(os.Getenv("APP_PORT"))
	}

	rel := strings.ReplaceAll(filepath.ToSlash(path), "\\", "/")
	rel = strings.TrimPrefix(rel, "./")
	rel = strings.TrimPrefix(rel, "/")

	return basis + "/" + rel
}

// kirimEmailSuratPenerimaan mengirim PDF surat ke email yang diisi peserta
// saat mendaftar. Sengaja DIPISAH dari email "pendaftaran diterima" karena
// surat baru ada setelah admin menerbitkannya, dan bisa diterbitkan ulang.
// Fungsi ini aman dipanggil di dalam goroutine.
func kirimEmailSuratPenerimaan(surat models.SuratPenerimaan, pendaftaran models.PendaftaranMagang) error {
	tujuan := strings.TrimSpace(pendaftaran.Email)
	if tujuan == "" {
		return fmt.Errorf("peserta belum memiliki alamat email")
	}
	if strings.TrimSpace(surat.FileSurat) == "" {
		return fmt.Errorf("berkas PDF surat belum tersedia")
	}

	// Nama instansi diambil dari template yang dipakai surat ini.
	namaInstansi := ""
	if surat.TemplateSuratID != nil {
		var tpl models.TemplateSurat
		if err := config.DB.First(&tpl, *surat.TemplateSuratID).Error; err == nil {
			namaInstansi = tpl.NamaInstansi
		}
	}

	namaBerkas := filepath.Base(surat.FileSurat)
	urlBerkas := urlPublikBerkas(surat.FileSurat)

	subject := emailtemplates.SubjectSuratPenerimaan(surat.NomorSurat)
	body := emailtemplates.TemplateSuratPenerimaan(
		surat.SnapshotNama,
		surat.NomorSurat,
		services.FormatTanggalSurat(surat.TanggalTerbit),
		surat.SnapshotBidang,
		services.FormatTanggalSurat(surat.SnapshotMulai),
		services.FormatTanggalSurat(surat.SnapshotSelesai),
		namaInstansi,
		namaBerkas,
		urlBerkas,
	)

	// Inline supaya PDF menyatu dengan badan email, bukan blok lampiran di bawah.
	if err := services.SendEmailInline(tujuan, subject, body, surat.FileSurat); err != nil {
		return err
	}

	// Catat jejak pengiriman supaya admin tahu status di daftar surat.
	sekarang := time.Now()
	config.DB.Model(&models.SuratPenerimaan{}).
		Where("id = ?", surat.ID).
		Updates(map[string]interface{}{
			"email_tujuan":      tujuan,
			"email_terkirim_at": sekarang,
		})

	return nil
}

// [ROLE: ADMIN]
// CreateSuratPenerimaan menerbitkan surat keterangan penerimaan magang resmi, menggenerate dokumen PDF, dan otomatis mengirimkannya via email ke peserta.
// Endpoint: POST /api/manajemen/admin/surat-penerimaan
func CreateSuratPenerimaan(c *gin.Context) {
	var input SuratPenerimaanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}

	if input.PendaftaranMagangID == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Pendaftar wajib dipilih")
		return
	}
	if strings.TrimSpace(input.NomorSurat) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nomor surat wajib diisi")
		return
	}
	if strings.TrimSpace(input.JabatanTujuan) == "" ||
		strings.TrimSpace(input.InstitusiTujuan) == "" ||
		strings.TrimSpace(input.KotaTujuan) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jabatan tujuan, institusi, dan kota tujuan wajib diisi")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.First(&pendaftaran, input.PendaftaranMagangID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran tidak ditemukan")
		return
	}
	if pendaftaran.StatusPendaftaran != "diterima" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Surat penerimaan hanya bisa dibuat untuk pendaftar berstatus diterima")
		return
	}

	var jumlah int64
	config.DB.Model(&models.SuratPenerimaan{}).
		Where("pendaftaran_magang_id = ?", pendaftaran.ID).Count(&jumlah)
	if jumlah > 0 {
		utils.ErrorResponse(c, http.StatusConflict, "Pendaftar ini sudah memiliki surat penerimaan")
		return
	}

	config.DB.Model(&models.SuratPenerimaan{}).
		Where("nomor_surat = ?", strings.TrimSpace(input.NomorSurat)).Count(&jumlah)
	if jumlah > 0 {
		utils.ErrorResponse(c, http.StatusConflict, "Nomor surat sudah dipakai surat lain")
		return
	}

	tpl, err := TemplateSuratAktif(input.TemplateSuratID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template surat: "+err.Error())
		return
	}
	if strings.TrimSpace(tpl.NamaPenandatangan) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Lengkapi data penandatangan pada template surat terlebih dahulu")
		return
	}

	tanggalTerbit := strings.TrimSpace(input.TanggalTerbit)
	if tanggalTerbit == "" {
		tanggalTerbit = time.Now().Format("2006-01-02")
	}

	nomorInduk, labelInduk := pendaftaran.NpmNim, "NPM"
	judul, jenis := tpl.JudulMahasiswa, tpl.JenisMagangMhs
	if pendaftaran.KategoriPendaftar == "siswa" {
		nomorInduk, labelInduk = pendaftaran.Nisn, "NISN"
		judul, jenis = tpl.JudulSiswa, tpl.JenisMagangSis
	}

	adminID, _ := c.Get("user_id")
	dibuatOleh := uint(0)
	if v, ok := adminID.(uint); ok {
		dibuatOleh = v
	} else if v, ok := adminID.(float64); ok {
		dibuatOleh = uint(v)
	}

	surat := models.SuratPenerimaan{
		PendaftaranMagangID: pendaftaran.ID,
		NomorSurat:          strings.TrimSpace(input.NomorSurat),
		TanggalTerbit:       tanggalTerbit,

		JabatanTujuan:   strings.TrimSpace(input.JabatanTujuan),
		UnitTujuan:      strings.TrimSpace(input.UnitTujuan),
		InstitusiTujuan: strings.TrimSpace(input.InstitusiTujuan),
		KotaTujuan:      strings.TrimSpace(input.KotaTujuan),

		NomorSuratPengantar:   strings.TrimSpace(input.NomorSuratPengantar),
		TanggalSuratPengantar: strings.TrimSpace(input.TanggalSuratPengantar),

		SnapshotNama:       pendaftaran.NamaLengkap,
		SnapshotNomorInduk: nomorInduk,
		SnapshotLabelInduk: labelInduk,
		SnapshotKategori:   pendaftaran.KategoriPendaftar,
		SnapshotBidang:     pendaftaran.PosisiBidang,
		SnapshotMulai:      pendaftaran.TanggalMulai,
		SnapshotSelesai:    pendaftaran.TanggalSelesai,

		SnapshotJabatanTtd: tpl.JabatanPenandatangan,
		SnapshotNamaTtd:    tpl.NamaPenandatangan,
		SnapshotPangkatTtd: tpl.PangkatPenandatangan,
		SnapshotNipTtd:     tpl.NipPenandatangan,

		JudulSurat:  judul,
		JenisMagang: jenis,
		DibuatOleh:  dibuatOleh,
	}

	if err := config.DB.Create(&surat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan surat penerimaan")
		return
	}

	filePath, err := services.GenerateSuratPenerimaanPDF(&surat, tpl)
	if err != nil {
		config.DB.Delete(&surat) // batalkan agar tidak ada surat tanpa file
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat PDF surat: "+err.Error())
		return
	}

	surat.FileSurat = filePath
	surat.TemplateSuratID = &tpl.ID
	config.DB.Save(&surat)

	// Tautkan ke pendaftaran
	pendaftaran.SuratPenerimaanID = &surat.ID
	config.DB.Save(&pendaftaran)

	// Kirim email surat penerimaan ke peserta.
	// Dijalankan sinkron supaya kolom email_terkirim_at sudah terisi saat
	// respons dikirim — badge "Status Email" di daftar surat langsung berubah
	// tanpa perlu reload browser.
	if input.KirimEmail == nil || *input.KirimEmail {
		if err := kirimEmailSuratPenerimaan(surat, pendaftaran); err != nil {
			log.Println("Gagal mengirim email surat penerimaan:", err)
		}
		// Muat ulang agar email_tujuan & email_terkirim_at ikut terkirim ke frontend.
		config.DB.First(&surat, surat.ID)
	}

	// Surat sudah terbit -> tagihan di lonceng untuk peserta ini dianggap selesai.
	go func(idPendaftaran uint) {
		services.TandaiNotifikasiAdminSelesai("surat_belum_terbit", "pendaftaran_magangs", &idPendaftaran)

		var sisa int64
		config.DB.Model(&models.PendaftaranMagang{}).
			Where("status_pendaftaran = ? AND surat_penerimaan_id IS NULL", "diterima").
			Count(&sisa)
		if sisa == 0 {
			services.TandaiNotifikasiAdminSelesai("surat_belum_terbit", "pendaftaran_magangs", nil)
		}
	}(pendaftaran.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Surat penerimaan berhasil diterbitkan", surat)
}

// [ROLE: ADMIN]
// UpdateSuratPenerimaan memperbarui data isian surat penerimaan dan merender ulang dokumen fisik PDF surat di server.
// Endpoint: PUT /api/manajemen/admin/surat-penerimaan/:id
func UpdateSuratPenerimaan(c *gin.Context) {
	var surat models.SuratPenerimaan
	if err := config.DB.First(&surat, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Surat penerimaan tidak ditemukan")
		return
	}

	var input SuratPenerimaanInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}

	if strings.TrimSpace(input.NomorSurat) != "" && strings.TrimSpace(input.NomorSurat) != surat.NomorSurat {
		var jumlah int64
		config.DB.Model(&models.SuratPenerimaan{}).
			Where("nomor_surat = ? AND id <> ?", strings.TrimSpace(input.NomorSurat), surat.ID).
			Count(&jumlah)
		if jumlah > 0 {
			utils.ErrorResponse(c, http.StatusConflict, "Nomor surat sudah dipakai surat lain")
			return
		}
		surat.NomorSurat = strings.TrimSpace(input.NomorSurat)
	}

	if v := strings.TrimSpace(input.TanggalTerbit); v != "" {
		surat.TanggalTerbit = v
	}
	if v := strings.TrimSpace(input.JabatanTujuan); v != "" {
		surat.JabatanTujuan = v
	}
	if v := strings.TrimSpace(input.InstitusiTujuan); v != "" {
		surat.InstitusiTujuan = v
	}
	if v := strings.TrimSpace(input.KotaTujuan); v != "" {
		surat.KotaTujuan = v
	}
	surat.UnitTujuan = strings.TrimSpace(input.UnitTujuan)
	surat.NomorSuratPengantar = strings.TrimSpace(input.NomorSuratPengantar)
	surat.TanggalSuratPengantar = strings.TrimSpace(input.TanggalSuratPengantar)

	// Ikuti template baru bila admin memilihnya; kalau tidak, pakai template
	// yang dipakai saat surat ini diterbitkan.
	idTemplate := surat.TemplateSuratID
	if input.TemplateSuratID != nil {
		idTemplate = input.TemplateSuratID
	}
	tpl, err := TemplateSuratAktif(idTemplate)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil template surat: "+err.Error())
		return
	}
	surat.TemplateSuratID = &tpl.ID

	// Segarkan snapshot penandatangan dari template terkini, karena admin
	// memang sedang sengaja memperbarui surat ini.
	surat.SnapshotJabatanTtd = tpl.JabatanPenandatangan
	surat.SnapshotNamaTtd = tpl.NamaPenandatangan
	surat.SnapshotPangkatTtd = tpl.PangkatPenandatangan
	surat.SnapshotNipTtd = tpl.NipPenandatangan

	// Judul & jenis magang mengikuti kategori peserta pada template terpilih
	if strings.EqualFold(surat.SnapshotKategori, "siswa") {
		surat.JudulSurat, surat.JenisMagang = tpl.JudulSiswa, tpl.JenisMagangSis
	} else {
		surat.JudulSurat, surat.JenisMagang = tpl.JudulMahasiswa, tpl.JenisMagangMhs
	}

	fileLama := surat.FileSurat
	filePath, err := services.GenerateSuratPenerimaanPDF(&surat, tpl)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat PDF surat: "+err.Error())
		return
	}
	surat.FileSurat = filePath

	if err := config.DB.Save(&surat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan surat penerimaan")
		return
	}
	if fileLama != "" && fileLama != filePath {
		_ = os.Remove(fileLama)
	}

	utils.SuccessResponse(c, http.StatusOK, "Surat penerimaan berhasil diperbarui", surat)
}

// [ROLE: ADMIN]
// DeleteSuratPenerimaan menghapus surat penerimaan yang telah diterbitkan dan melepas tautan surat dari data pendaftaran peserta.
// Endpoint: DELETE /api/manajemen/admin/surat-penerimaan/:id
func DeleteSuratPenerimaan(c *gin.Context) {
	var surat models.SuratPenerimaan
	if err := config.DB.First(&surat, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Surat penerimaan tidak ditemukan")
		return
	}

	config.DB.Model(&models.PendaftaranMagang{}).
			Where("surat_penerimaan_id = ?", surat.ID).
			Update("surat_penerimaan_id", nil)

		// Surat dihapus -> pekerjaannya kembali menjadi tagihan admin.
		go services.KirimNotifikasiAdmin(
			"surat_belum_terbit",
			"Surat penerimaan perlu diterbitkan ulang",
			fmt.Sprintf("Surat nomor %s dihapus. Terbitkan ulang surat penerimaan untuk peserta terkait.", surat.NomorSurat),
			"pendaftaran_magangs", &surat.PendaftaranMagangID,
			"/admin/surat-penerimaan",
			"tinggi", true,
		)
	if surat.FileSurat != "" {
		_ = os.Remove(surat.FileSurat)
	}
	if err := config.DB.Delete(&surat).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus surat penerimaan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Surat penerimaan berhasil dihapus", nil)
}

// [ROLE: ADMIN]
// DownloadSuratPenerimaan mengunduh berkas PDF surat penerimaan magang resmi dengan format penamaan yang rapi.
// Endpoint: GET /api/manajemen/admin/surat-penerimaan/:id/unduh
func DownloadSuratPenerimaan(c *gin.Context) {
	var surat models.SuratPenerimaan
	if err := config.DB.First(&surat, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Surat penerimaan tidak ditemukan")
		return
	}
	if surat.FileSurat == "" {
		utils.ErrorResponse(c, http.StatusNotFound, "File surat belum tersedia")
		return
	}
	if _, err := os.Stat(surat.FileSurat); err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "File surat tidak ditemukan di server")
		return
	}

	aman := strings.NewReplacer("/", "-", "\\", "-", " ", "_").Replace(surat.SnapshotNama)
	c.FileAttachment(surat.FileSurat, fmt.Sprintf("Surat-Penerimaan-%s.pdf", aman))
}

// [ROLE: ADMIN]
// KirimUlangEmailSuratPenerimaan mengirim ulang berkas dokumen PDF surat penerimaan ke alamat email peserta.
// Endpoint: POST /api/manajemen/admin/surat-penerimaan/:id/kirim-email
func KirimUlangEmailSuratPenerimaan(c *gin.Context) {
	var surat models.SuratPenerimaan
	if err := config.DB.First(&surat, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Surat penerimaan tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.First(&pendaftaran, surat.PendaftaranMagangID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran tidak ditemukan")
		return
	}

	if err := kirimEmailSuratPenerimaan(surat, pendaftaran); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengirim email: "+err.Error())
		return
	}

	config.DB.First(&surat, surat.ID)
	utils.SuccessResponse(c, http.StatusOK, "Surat berhasil dikirim ke "+pendaftaran.Email, surat)
}

// ==============================================================================
// ── TEMPLATE SURAT PENERIMAAN / PENOLAKAN BUILDER ────────────────────────────
// ==============================================================================

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
func seedTemplateSuratJikaKosong() error {
	var jumlah int64
	if err := config.DB.Model(&models.TemplateSurat{}).Count(&jumlah).Error; err != nil {
		return err
	}
	if jumlah > 0 {
		return nil
	}

	tpl := defaultTemplateSurat()
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

// [ROLE: ADMIN]
// GetAllTemplateSurat mengambil seluruh daftar template surat penerimaan magang yang tersimpan di sistem.
// Endpoint: GET /api/manajemen/admin/template-surat
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

// [ROLE: ADMIN]
// GetTemplateSurat mengambil konfigurasi lengkap satu template surat penerimaan berdasarkan ID.
// Endpoint: GET /api/manajemen/admin/template-surat/:id
func GetTemplateSurat(c *gin.Context) {
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Detail template surat berhasil diambil", tpl)
}

// [ROLE: ADMIN]
// GetTataLetakBawaanSurat mengambil nilai default tata letak blok surat (untuk tombol reset tata letak pada editor).
// Endpoint: GET /api/manajemen/admin/template-surat/bawaan
func GetTataLetakBawaanSurat(c *gin.Context) {
	utils.SuccessResponse(c, http.StatusOK, "Tata letak bawaan", services.DefaultTataLetakSurat())
}

// [ROLE: ADMIN]
// CreateTemplateSurat membuat template format surat penerimaan magang baru.
// Endpoint: POST /api/manajemen/admin/template-surat
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

// [ROLE: ADMIN]
// UpdateTemplateSurat memperbarui konfigurasi teks redaksi, pejabat penandatangan, atau tata letak visual template surat.
// Endpoint: PUT /api/manajemen/admin/template-surat/:id
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

// [ROLE: ADMIN]
// DuplikatTemplateSurat menyalin konfigurasi template surat yang sudah ada untuk mempercepat pembuatan template baru.
// Endpoint: POST /api/manajemen/admin/template-surat/:id/duplikat
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

// [ROLE: ADMIN]
// DeleteTemplateSurat menghapus template surat penerimaan beserta berkas aset gambar terkait (hanya jika template tidak sedang dipakai oleh surat aktif).
// Endpoint: DELETE /api/manajemen/admin/template-surat/:id
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

// [ROLE: ADMIN]
// PratinjauTemplateSurat merender dokumen pratinjau PDF langsung dari template surat untuk ditampilkan di layar pratinjau editor admin.
// Endpoint: GET /api/manajemen/admin/template-surat/:id/pratinjau
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

// [ROLE: ADMIN]
// UploadFileTemplateSurat mengunggah berkas logo instansi, spesimen tanda tangan, atau stempel kedinasan untuk template surat tertentu.
// Endpoint: POST /api/manajemen/admin/template-surat/:id/upload/:jenis
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

// [ROLE: ADMIN]
// DeleteFileTemplateSurat menghapus berkas logo, tanda tangan, atau stempel dari template surat tertentu.
// Endpoint: DELETE /api/manajemen/admin/template-surat/:id/upload/:jenis
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

// [ROLE: ADMIN]
// PetaTemplateSurat mengembalikan posisi koordinat milimeter (mm) setiap blok teks pada pratinjau surat untuk interaksi drag-and-drop layer editor.
// Endpoint: GET /api/manajemen/admin/template-surat/:id/peta
func PetaTemplateSurat(c *gin.Context) {
	var tpl models.TemplateSurat
	if err := config.DB.First(&tpl, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Template surat tidak ditemukan")
		return
	}

	kategori := c.DefaultQuery("kategori", "mahasiswa")
	peta, err := services.PetaSuratPratinjau(tpl, kategori)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung posisi blok: "+err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Peta blok surat berhasil diambil", peta)
}