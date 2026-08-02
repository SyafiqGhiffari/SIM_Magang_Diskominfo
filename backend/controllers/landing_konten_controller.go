package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// JenisKontenLanding = daftar jenis yang diizinkan, sekaligus urutan render di frontend.
var JenisKontenLanding = []string{
	"persyaratan", "dokumen", "alur", "benefit", "misi", "tujuan", "keunggulan",
}

func jenisKontenValid(j string) bool {
	for _, v := range JenisKontenLanding {
		if v == j {
			return true
		}
	}
	return false
}

// ==================== SEED ====================

// Diisi dengan teks yang SEKARANG masih hardcoded di frontend,
// supaya tampilan landing page tidak berubah setelah fitur ini dipasang.
func seedKontenLandingJikaKosong() {
	var jumlah int64
	config.DB.Model(&models.LandingKonten{}).Count(&jumlah)
	if jumlah > 0 {
		return
	}

	bawaan := []models.LandingKonten{
		// ---------- Persyaratan Umum ----------
		{Jenis: "persyaratan", Kategori: "umum", Urutan: 1, IsActive: true,
			Judul: "Terdaftar sebagai mahasiswa aktif (D3/D4/S1) atau siswa aktif SMA/SMK/MA sederajat."},
		{Jenis: "persyaratan", Kategori: "umum", Urutan: 2, IsActive: true,
			Judul: "Membawa Surat Pengantar/Permohonan Magang resmi dari institusi pendidikan asal."},
		{Jenis: "persyaratan", Kategori: "umum", Urutan: 3, IsActive: true,
			Judul: "Mengisi formulir pendaftaran secara online melalui portal SIM Magang."},
		{Jenis: "persyaratan", Kategori: "umum", Urutan: 4, IsActive: true,
			Judul: "Melampirkan Curriculum Vitae (CV) dan dokumen pendukung lainnya."},
		{Jenis: "persyaratan", Kategori: "umum", Urutan: 5, IsActive: true,
			Judul: "Bersedia mematuhi peraturan tata tertib serta jam kerja operasional dinas."},

		// ---------- Dokumen Wajib ----------
		{Jenis: "dokumen", Kategori: "umum", Urutan: 1, IsActive: true,
			Judul: "Surat Pengantar Permohonan Magang resmi dari kampus atau sekolah (PDF)"},
		{Jenis: "dokumen", Kategori: "umum", Urutan: 2, IsActive: true,
			Judul: "Kartu Tanda Mahasiswa (KTM) atau Kartu Pelajar aktif"},
		{Jenis: "dokumen", Kategori: "umum", Urutan: 3, IsActive: true,
			Judul: "Curriculum Vitae (CV) terbaru yang memuat riwayat studi & keahlian"},
		{Jenis: "dokumen", Kategori: "umum", Urutan: 4, IsActive: true,
			Judul: "Pas Foto berwarna terbaru (latar belakang merah)"},
		{Jenis: "dokumen", Kategori: "umum", Urutan: 5, IsActive: true,
			Judul: "Proposal Rencana Kegiatan Magang (jika dipersyaratkan oleh institusi asal)"},

		// ---------- Alur Pendaftaran ----------
		{Jenis: "alur", Urutan: 1, IsActive: true, Icon: "01", Judul: "Registrasi Online",
			Deskripsi: "Buat akun baru dan lengkapi data profil pendaftar di portal kami."},
		{Jenis: "alur", Urutan: 2, IsActive: true, Icon: "02", Judul: "Isi Formulir & Dokumen",
			Deskripsi: "Isi form pendaftaran magang dan unggah surat pengantar resmi (PDF)."},
		{Jenis: "alur", Urutan: 3, IsActive: true, Icon: "03", Judul: "Verifikasi Berkas",
			Deskripsi: "Tim administrasi memvalidasi dokumen dan kesesuaian kuota divisi."},
		{Jenis: "alur", Urutan: 4, IsActive: true, Icon: "04", Judul: "Pengumuman Hasil",
			Deskripsi: "Status kelulusan dikirim via portal dan email resmi peserta."},

		// ---------- Benefit (WhyChooseUs) ----------
		{Jenis: "benefit", Urutan: 1, IsActive: true, Icon: "🎓", Judul: "Sertifikat Resmi",
			Deskripsi: "Sebagai bukti kompetensi dan pengalaman berharga untuk portofolio karier Anda."},
		{Jenis: "benefit", Urutan: 2, IsActive: true, Icon: "🚀", Judul: "Pengalaman Proyek",
			Deskripsi: "Keterlibatan langsung dalam proyek strategis digitalisasi pemerintah daerah."},
		{Jenis: "benefit", Urutan: 3, IsActive: true, Icon: "🤝", Judul: "Bimbingan Mentor",
			Deskripsi: "Didampingi oleh mentor profesional ahli di setiap bidang spesialisasi."},
		{Jenis: "benefit", Urutan: 4, IsActive: true, Icon: "📈", Judul: "Penilaian Kinerja",
			Deskripsi: "Evaluasi obyektif untuk membantu merefleksikan kompetensi magang Anda."},

		// ---------- Misi Instansi ----------
		{Jenis: "misi", Urutan: 1, IsActive: true,
			Judul: "Membangun infrastruktur jaringan internet dan digitalisasi yang terintegrasi di seluruh pelosok daerah."},
		{Jenis: "misi", Urutan: 2, IsActive: true,
			Judul: "Mendorong akuntabilitas SPBE guna efisiensi pelayanan administrasi publik terpadu."},
		{Jenis: "misi", Urutan: 3, IsActive: true,
			Judul: "Mengoptimalkan penyebaran berita positif, edukasi publik, dan pengelolaan aduan warga."},

		// ---------- Tujuan Program ----------
		{Jenis: "tujuan", Urutan: 1, IsActive: true, Icon: "🌱", Judul: "Pengembangan Kompetensi",
			Deskripsi: "Membantu peserta menyelaraskan teori akademis dengan praktik kerja nyata di instansi pemerintah."},
		{Jenis: "tujuan", Urutan: 2, IsActive: true, Icon: "🤝", Judul: "Kolaborasi Profesional",
			Deskripsi: "Membangun budaya kolaborasi antarsiswa/mahasiswa dengan mentor ahli bimbingan Diskominfotik."},
		{Jenis: "tujuan", Urutan: 3, IsActive: true, Icon: "💡", Judul: "Transformasi SPBE",
			Deskripsi: "Melibatkan talenta muda secara aktif dalam memecahkan masalah IT, data, serta kehumasan pemda."},

		// ---------- Keunggulan Program ----------
		{Jenis: "keunggulan", Urutan: 1, IsActive: true, Icon: "🏆", Judul: "Sertifikat Resmi",
			Deskripsi: "Diterbitkan instansi pemerintah resmi sebagai bukti kredibilitas portofolio."},
		{Jenis: "keunggulan", Urutan: 2, IsActive: true, Icon: "🧑‍🏫", Judul: "Mentor Berpengalaman",
			Deskripsi: "Pendampingan penuh oleh pranata komputer, humas, dan statistisi ahli."},
		{Jenis: "keunggulan", Urutan: 3, IsActive: true, Icon: "💻", Judul: "Proyek Nyata SPBE",
			Deskripsi: "Keterlibatan langsung mengelola kode aplikasi, infografis, dan data riil."},
		{Jenis: "keunggulan", Urutan: 4, IsActive: true, Icon: "🏛️", Judul: "Link Kerja Pemerintah",
			Deskripsi: "Memahami alur kerja birokrasi pemerintahan berbasis digital sejak dini."},
	}

	for i := range bawaan {
		config.DB.Create(&bawaan[i])
	}
}

// kontenLandingPublik mengembalikan seluruh konten aktif, dikelompokkan per jenis.
func kontenLandingPublik() gin.H {
	seedKontenLandingJikaKosong()

	var semua []models.LandingKonten
	config.DB.Where("is_active = ?", true).
		Order("urutan asc, id asc").Find(&semua)

	hasil := gin.H{}
	for _, jenis := range JenisKontenLanding {
		daftar := make([]gin.H, 0)
		for _, k := range semua {
			if k.Jenis != jenis {
				continue
			}
			daftar = append(daftar, gin.H{
				"id":        k.ID,
				"kategori":  k.Kategori,
				"judul":     k.Judul,
				"deskripsi": k.Deskripsi,
				"icon":      k.Icon,
			})
		}
		hasil[jenis] = daftar
	}
	return hasil
}

// ==================== ENDPOINT ADMIN ====================

func GetKontenLanding(c *gin.Context) {
	jenis := c.Param("jenis")
	if !jenisKontenValid(jenis) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis konten tidak dikenali")
		return
	}

	seedKontenLandingJikaKosong()

	var daftar []models.LandingKonten
	if err := config.DB.Where("jenis = ?", jenis).
		Order("urutan asc, id asc").Find(&daftar).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil konten")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Konten berhasil diambil", daftar)
}

type kontenInput struct {
	Kategori  *string `json:"kategori"`
	Judul     *string `json:"judul"`
	Deskripsi *string `json:"deskripsi"`
	Icon      *string `json:"icon"`
	Urutan    *int    `json:"urutan"`
	IsActive  *bool   `json:"is_active"`
}

func CreateKontenLanding(c *gin.Context) {
	jenis := c.Param("jenis")
	if !jenisKontenValid(jenis) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis konten tidak dikenali")
		return
	}

	var input kontenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}
	if input.Judul == nil || strings.TrimSpace(*input.Judul) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Judul/teks tidak boleh kosong")
		return
	}

	// Urutan otomatis di posisi terakhir bila tidak diisi.
	urutan := 0
	if input.Urutan != nil {
		urutan = *input.Urutan
	} else {
		var terakhir models.LandingKonten
		if err := config.DB.Where("jenis = ?", jenis).Order("urutan desc").First(&terakhir).Error; err == nil {
			urutan = terakhir.Urutan + 1
		} else {
			urutan = 1
		}
	}

	konten := models.LandingKonten{
		Jenis:    jenis,
		Kategori: "umum",
		Judul:    strings.TrimSpace(*input.Judul),
		Urutan:   urutan,
		IsActive: true,
	}
	if input.Kategori != nil && strings.TrimSpace(*input.Kategori) != "" {
		konten.Kategori = strings.TrimSpace(*input.Kategori)
	}
	if input.Deskripsi != nil {
		konten.Deskripsi = strings.TrimSpace(*input.Deskripsi)
	}
	if input.Icon != nil {
		konten.Icon = strings.TrimSpace(*input.Icon)
	}
	if input.IsActive != nil {
		konten.IsActive = *input.IsActive
	}

	if err := config.DB.Create(&konten).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menambahkan konten")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Konten berhasil ditambahkan", konten)
}

func UpdateKontenLanding(c *gin.Context) {
	var konten models.LandingKonten
	if err := config.DB.First(&konten, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Konten tidak ditemukan")
		return
	}

	var input kontenInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}

	if input.Judul != nil {
		judul := strings.TrimSpace(*input.Judul)
		if judul == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Judul/teks tidak boleh kosong")
			return
		}
		konten.Judul = judul
	}
	if input.Kategori != nil {
		konten.Kategori = strings.TrimSpace(*input.Kategori)
	}
	if input.Deskripsi != nil {
		konten.Deskripsi = strings.TrimSpace(*input.Deskripsi)
	}
	if input.Icon != nil {
		konten.Icon = strings.TrimSpace(*input.Icon)
	}
	if input.Urutan != nil {
		konten.Urutan = *input.Urutan
	}
	if input.IsActive != nil {
		konten.IsActive = *input.IsActive
	}

	if err := config.DB.Save(&konten).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan konten")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Konten berhasil disimpan", konten)
}

func DeleteKontenLanding(c *gin.Context) {
	var konten models.LandingKonten
	if err := config.DB.First(&konten, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Konten tidak ditemukan")
		return
	}

	if err := config.DB.Delete(&konten).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus konten")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Konten berhasil dihapus", nil)
}

// UrutkanKontenLanding menerima { "urutan": [id1, id2, id3] } sesuai posisi baru.
func UrutkanKontenLanding(c *gin.Context) {
	jenis := c.Param("jenis")
	if !jenisKontenValid(jenis) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis konten tidak dikenali")
		return
	}

	var body struct {
		Urutan []uint `json:"urutan"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}

	for i, id := range body.Urutan {
		config.DB.Model(&models.LandingKonten{}).
			Where("id = ? AND jenis = ?", id, jenis).
			Update("urutan", i+1)
	}

	utils.SuccessResponse(c, http.StatusOK, "Urutan berhasil disimpan", nil)
}

// dipakai agar import strconv tidak menganggur bila suatu saat diperlukan
var _ = strconv.Itoa