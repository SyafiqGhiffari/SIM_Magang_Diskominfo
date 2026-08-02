package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

const maxLogoSize = 2 << 20 // 2 MB

var landingImageExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".svg": true,
}

var landingIconExt = map[string]bool{
	".png": true, ".ico": true, ".svg": true,
}

// ==================== SEED / DEFAULT ====================

// Nilai bawaan diisi dengan teks yang SEKARANG masih hardcoded di frontend,
// supaya setelah fitur ini dipasang tampilan tidak berubah sama sekali
// sampai admin benar-benar mengeditnya.
func defaultPengaturanLanding() models.PengaturanLandingPage {
	return models.PengaturanLandingPage{
		NamaSitus:     "SIM MAGANG",
		SubJudulSitus: "DISKOMINFO PONOROGO",
		FileLogo:      "",
		FileFavicon:   "",
		TaglineFooter: "Sistem Informasi Manajemen Magang Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo.",
		TeksCopyright: fmt.Sprintf("© %d Diskominfo Kabupaten Ponorogo. Seluruh hak cipta dilindungi.", time.Now().Year()),

		HeroBadge:          "⚡ Pendaftaran Magang",
		HeroJudul:          "Bangun Karier Digitalmu di",
		HeroJudulHighlight: "Diskominfo Ponorogo",
		HeroSubjudul:       "Bergabunglah dalam transformasi digital menuju Sistem Pemerintahan Berbasis Elektronik (SPBE). Dapatkan pengalaman nyata melayani publik melalui teknologi informasi.",
		HeroCtaTeks:        "Daftar Magang Sekarang",
		HeroCtaLink:        "/pilih-pendaftaran",
		HeroCtaTutupTeks:   "Pendaftaran Sedang Ditutup",
		HeroCta2Teks:       "Lihat Program",
		HeroCta2Link:       "/program-magang",

		AboutBadge: "Mengenal Kami",
		AboutJudul: "Tentang Program Magang",
		AboutParagraf1: "Program magang Diskominfo Ponorogo merupakan sarana pembelajaran dan pengenalan dunia kerja di lingkungan pemerintahan bagi mahasiswa dan siswa SMA/SMK/MA.",
		AboutParagraf2: "Kami memberikan ruang seluas-luasnya bagi talenta muda untuk berkontribusi dalam digitalisasi daerah, memahami tata kelola informasi publik, dan mengasah keterampilan teknis di bawah bimbingan tenaga ahli profesional.",

		ProfilJudul: "Dinas Komunikasi, Informatika dan Statistik Ponorogo",
		ProfilDeskripsi: "Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo (Diskominfotik) adalah unsur pelaksana urusan pemerintahan bidang komunikasi, informatika, statistik sektoral, dan persandian tingkat daerah. Kami berkomitmen menyelenggarakan keterbukaan informasi publik, koordinasi data daerah, serta pengelolaan Sistem Pemerintahan Berbasis Elektronik (SPBE) yang andal menuju Ponorogo Smart City.",

		VisiJudul: "Visi Diskominfotik",
		VisiTeks:  "Terwujudnya tata kelola pemerintahan yang responsif dan transparan melalui pemanfaatan sistem komunikasi dan teknologi informasi yang merata di Kabupaten Ponorogo.",
		MisiJudul: "Misi Diskominfotik",

		SeoTitle:       "Portal Pendaftaran | SIM Magang Diskominfo Ponorogo",
		SeoDescription: "Portal resmi pendaftaran magang Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo bagi mahasiswa D3/D4/S1 dan siswa SMA/SMK/MA.",
		SeoKeywords:    "magang ponorogo, magang diskominfo, pkl ponorogo, magang pemerintahan, prakerin ponorogo",

		EmailResmi:    "diskominfo@ponorogo.go.id",
		Telepon:       "(0352) 481845",
		NamaGedung:    "Gedung Graha Krida Praja Lt. 4",
		AlamatLengkap: "Jl. Aloon-Aloon Utara No. 4, Ponorogo, Jawa Timur",
		JamLayanan:    "Senin – Jumat, 07.30 – 16.00 WIB",
		EmbedMaps:     "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.1643916962255!2d111.46237731477028!3d-7.868779994331252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e790f9a2e6f4a83%3A0x6b45465e905d41f7!2sGraha%20Krida%20Praja!5e0!3m2!1sen!2sid!4v1655900000000!5m2!1sen!2sid",

		LinkInstagram: "https://www.instagram.com/kabponorogo",
		LinkFacebook:  "https://facebook.com/diskominfoponorogo",
		LinkYoutube:   "https://www.youtube.com/@ponorogokab",
		LinkWebsite:   "https://kominfo.ponorogo.go.id",

		PendaftaranDibuka: true,
		PesanDitutup:      "Mohon maaf, pendaftaran magang saat ini sedang ditutup. Silakan pantau halaman ini untuk informasi periode pendaftaran berikutnya.",

		BannerAktif: false,
		BannerTipe:  "info",
	}
}

func getOrSeedPengaturanLanding() (models.PengaturanLandingPage, error) {
	var p models.PengaturanLandingPage
	if err := config.DB.First(&p).Error; err == nil {
		return p, nil
	}
	p = defaultPengaturanLanding()
	if err := config.DB.Create(&p).Error; err != nil {
		return p, err
	}
	return p, nil
}

// statusPendaftaranEfektif menggabungkan saklar manual dengan rentang tanggal.
// Mengembalikan (dibuka, alasan jika ditutup).
func statusPendaftaranEfektif(p models.PengaturanLandingPage) (bool, string) {
	if !p.PendaftaranDibuka {
		return false, p.PesanDitutup
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	if p.TanggalBuka != nil {
		buka := time.Date(p.TanggalBuka.Year(), p.TanggalBuka.Month(), p.TanggalBuka.Day(), 0, 0, 0, 0, now.Location())
		if today.Before(buka) {
			return false, fmt.Sprintf("Pendaftaran akan dibuka pada %s.", buka.Format("02 January 2006"))
		}
	}

	if p.TanggalTutup != nil {
		tutup := time.Date(p.TanggalTutup.Year(), p.TanggalTutup.Month(), p.TanggalTutup.Day(), 0, 0, 0, 0, now.Location())
		if today.After(tutup) {
			return false, fmt.Sprintf("Pendaftaran telah ditutup pada %s.", tutup.Format("02 January 2006"))
		}
	}

	return true, ""
}

// PendaftaranSedangDibuka dipakai controller lain sebagai penjaga (guard).
func PendaftaranSedangDibuka() (bool, string) {
	p, err := getOrSeedPengaturanLanding()
	if err != nil {
		// Gagal baca pengaturan: jangan sampai memblokir pendaftaran.
		return true, ""
	}
	return statusPendaftaranEfektif(p)
}

// ==================== ENDPOINT PUBLIK ====================

// GetLandingPublik: satu endpoint untuk seluruh kebutuhan landing page,
// supaya frontend cukup sekali fetch. Tanpa autentikasi.
func GetLandingPublik(c *gin.Context) {
	p, err := getOrSeedPengaturanLanding()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan landing page")
		return
	}

	dibuka, alasan := statusPendaftaranEfektif(p)

	// --- Slide gambar hero ---
	seedHeroSlideJikaKosong()
	var slides []models.LandingHeroSlide
	config.DB.Where("is_active = ?", true).Order("urutan asc, id asc").Find(&slides)

	gambarSlide := make([]string, 0, len(slides))
	for _, s := range slides {
		if s.FileGambar != "" {
			gambarSlide = append(gambarSlide, urlPublikBerkas(s.FileGambar))
		} else if strings.TrimSpace(s.UrlGambar) != "" {
			gambarSlide = append(gambarSlide, strings.TrimSpace(s.UrlGambar))
		}
	}

	// --- Bidang magang untuk landing & halaman program ---
	seedTampilanBidangJikaKosong()
	var bidangList []models.BidangMagang
	config.DB.Where("is_active = ? AND tampilkan_di_landing = ?", true, true).
		Order("urutan asc, nama asc").Find(&bidangList)

	bidangResp := make([]gin.H, 0, len(bidangList))
	for _, b := range bidangList {
		bidangResp = append(bidangResp, gin.H{
			"id":                b.ID,
			"nama":              b.Nama,
			"deskripsi":         b.Deskripsi,
			"deskripsi_panjang": b.DeskripsiPanjang,
			"icon":              b.Icon,
			"badge":             b.Badge,
			"durasi":            b.Durasi,
			"kompetensi":        pecahKompetensi(b.Kompetensi),
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengaturan landing page berhasil diambil", gin.H{
		"menu":   menuLandingPublik(),
		"konten": kontenLandingPublik(),
		"seo": gin.H{
			"title":       p.SeoTitle,
			"description": p.SeoDescription,
			"keywords":    p.SeoKeywords,
			"og_image":    urlPublikBerkas(p.FileOgImage),
		},
		"tentang": gin.H{
			"about_badge":      p.AboutBadge,
			"about_judul":      p.AboutJudul,
			"about_paragraf1":  p.AboutParagraf1,
			"about_paragraf2":  p.AboutParagraf2,
			"profil_judul":     p.ProfilJudul,
			"profil_deskripsi": p.ProfilDeskripsi,
			"foto_kantor":      urlPublikBerkas(p.FileFotoKantor),
			"visi_judul":       p.VisiJudul,
			"visi_teks":        p.VisiTeks,
			"misi_judul":       p.MisiJudul,
		},
		"hero": gin.H{
			"badge":           p.HeroBadge,
			"judul":           p.HeroJudul,
			"judul_highlight": p.HeroJudulHighlight,
			"subjudul":        p.HeroSubjudul,
			"cta_teks":        p.HeroCtaTeks,
			"cta_link":        p.HeroCtaLink,
			"cta_tutup_teks":  p.HeroCtaTutupTeks,
			"cta2_teks":       p.HeroCta2Teks,
			"cta2_link":       p.HeroCta2Link,
		},
		"hero_slides": gambarSlide,
		"bidang":      bidangResp,
		"identitas": gin.H{
			"nama_situs":      p.NamaSitus,
			"sub_judul_situs": p.SubJudulSitus,
			"logo":            urlPublikBerkas(p.FileLogo),
			"favicon":         urlPublikBerkas(p.FileFavicon),
			"tagline_footer":  p.TaglineFooter,
			"teks_copyright":  p.TeksCopyright,
		},
		"kontak": gin.H{
			"email":      p.EmailResmi,
			"telepon":    p.Telepon,
			"gedung":     p.NamaGedung,
			"alamat":     p.AlamatLengkap,
			"jam_layanan": p.JamLayanan,
			"embed_maps": p.EmbedMaps,
		},
		"sosial_media": gin.H{
			"instagram": p.LinkInstagram,
			"facebook":  p.LinkFacebook,
			"youtube":   p.LinkYoutube,
			"website":   p.LinkWebsite,
		},
		"pendaftaran": gin.H{
			"dibuka":        dibuka,
			"pesan_ditutup": alasan,
			"tanggal_buka":  p.TanggalBuka,
			"tanggal_tutup": p.TanggalTutup,
		},
		"banner": gin.H{
			"aktif": p.BannerAktif,
			"teks":  p.BannerTeks,
			"tipe":  p.BannerTipe,
		},
	})
}

// ==================== ENDPOINT ADMIN ====================

func GetPengaturanLanding(c *gin.Context) {
	p, err := getOrSeedPengaturanLanding()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan landing page")
		return
	}

	dibuka, alasan := statusPendaftaranEfektif(p)

	utils.SuccessResponse(c, http.StatusOK, "Pengaturan landing page berhasil diambil", gin.H{
		"pengaturan":       p,
		"url_logo":         urlPublikBerkas(p.FileLogo),
		"url_favicon":      urlPublikBerkas(p.FileFavicon),
		"url_foto_kantor":  urlPublikBerkas(p.FileFotoKantor),
		"url_og_image":     urlPublikBerkas(p.FileOgImage),
		"status_efektif":   dibuka,
		"alasan_ditutup":   alasan,
	})
}

type updateLandingRequest struct {
	NamaSitus     *string `json:"nama_situs"`
	SubJudulSitus *string `json:"sub_judul_situs"`
	TaglineFooter *string `json:"tagline_footer"`
	TeksCopyright *string `json:"teks_copyright"`

	HeroBadge          *string `json:"hero_badge"`
	HeroJudul          *string `json:"hero_judul"`
	HeroJudulHighlight *string `json:"hero_judul_highlight"`
	HeroSubjudul       *string `json:"hero_subjudul"`
	HeroCtaTeks        *string `json:"hero_cta_teks"`
	HeroCtaLink        *string `json:"hero_cta_link"`
	HeroCtaTutupTeks   *string `json:"hero_cta_tutup_teks"`
	HeroCta2Teks       *string `json:"hero_cta2_teks"`
	HeroCta2Link       *string `json:"hero_cta2_link"`

	AboutBadge      *string `json:"about_badge"`
	AboutJudul      *string `json:"about_judul"`
	AboutParagraf1  *string `json:"about_paragraf1"`
	AboutParagraf2  *string `json:"about_paragraf2"`
	ProfilJudul     *string `json:"profil_judul"`
	ProfilDeskripsi *string `json:"profil_deskripsi"`
	VisiJudul       *string `json:"visi_judul"`
	VisiTeks        *string `json:"visi_teks"`
	MisiJudul       *string `json:"misi_judul"`

	SeoTitle       *string `json:"seo_title"`
	SeoDescription *string `json:"seo_description"`
	SeoKeywords    *string `json:"seo_keywords"`

	EmailResmi    *string `json:"email_resmi"`
	Telepon       *string `json:"telepon"`
	NamaGedung    *string `json:"nama_gedung"`
	AlamatLengkap *string `json:"alamat_lengkap"`
	JamLayanan    *string `json:"jam_layanan"`
	EmbedMaps     *string `json:"embed_maps"`

	LinkInstagram *string `json:"link_instagram"`
	LinkFacebook  *string `json:"link_facebook"`
	LinkYoutube   *string `json:"link_youtube"`
	LinkWebsite   *string `json:"link_website"`

	PendaftaranDibuka *bool `json:"pendaftaran_dibuka"`
	// Format "YYYY-MM-DD". Kirim string kosong untuk mengosongkan tanggal.
	TanggalBuka  *string `json:"tanggal_buka"`
	TanggalTutup *string `json:"tanggal_tutup"`
	PesanDitutup *string `json:"pesan_ditutup"`

	BannerAktif *bool   `json:"banner_aktif"`
	BannerTeks  *string `json:"banner_teks"`
	BannerTipe  *string `json:"banner_tipe"`
}

func parseTanggalLanding(s string) (*time.Time, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func UpdatePengaturanLanding(c *gin.Context) {
	var req updateLandingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}

	p, err := getOrSeedPengaturanLanding()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan landing page")
		return
	}

	setStr := func(dst *string, src *string) {
		if src != nil {
			*dst = strings.TrimSpace(*src)
		}
	}

	setStr(&p.NamaSitus, req.NamaSitus)
	setStr(&p.SubJudulSitus, req.SubJudulSitus)
	setStr(&p.TaglineFooter, req.TaglineFooter)
	setStr(&p.TeksCopyright, req.TeksCopyright)

	setStr(&p.HeroBadge, req.HeroBadge)
	setStr(&p.HeroJudul, req.HeroJudul)
	setStr(&p.HeroJudulHighlight, req.HeroJudulHighlight)
	setStr(&p.HeroSubjudul, req.HeroSubjudul)
	setStr(&p.HeroCtaTeks, req.HeroCtaTeks)
	setStr(&p.HeroCtaLink, req.HeroCtaLink)
	setStr(&p.HeroCtaTutupTeks, req.HeroCtaTutupTeks)
	setStr(&p.HeroCta2Teks, req.HeroCta2Teks)
	setStr(&p.HeroCta2Link, req.HeroCta2Link)

	setStr(&p.AboutBadge, req.AboutBadge)
	setStr(&p.AboutJudul, req.AboutJudul)
	setStr(&p.AboutParagraf1, req.AboutParagraf1)
	setStr(&p.AboutParagraf2, req.AboutParagraf2)
	setStr(&p.ProfilJudul, req.ProfilJudul)
	setStr(&p.ProfilDeskripsi, req.ProfilDeskripsi)
	setStr(&p.VisiJudul, req.VisiJudul)
	setStr(&p.VisiTeks, req.VisiTeks)
	setStr(&p.MisiJudul, req.MisiJudul)

	setStr(&p.SeoTitle, req.SeoTitle)
	setStr(&p.SeoDescription, req.SeoDescription)
	setStr(&p.SeoKeywords, req.SeoKeywords)

	setStr(&p.EmailResmi, req.EmailResmi)
	setStr(&p.Telepon, req.Telepon)
	setStr(&p.NamaGedung, req.NamaGedung)
	setStr(&p.AlamatLengkap, req.AlamatLengkap)
	setStr(&p.JamLayanan, req.JamLayanan)
	setStr(&p.EmbedMaps, req.EmbedMaps)

	setStr(&p.LinkInstagram, req.LinkInstagram)
	setStr(&p.LinkFacebook, req.LinkFacebook)
	setStr(&p.LinkYoutube, req.LinkYoutube)
	setStr(&p.LinkWebsite, req.LinkWebsite)

	setStr(&p.PesanDitutup, req.PesanDitutup)
	setStr(&p.BannerTeks, req.BannerTeks)

	if req.PendaftaranDibuka != nil {
		p.PendaftaranDibuka = *req.PendaftaranDibuka
	}
	if req.BannerAktif != nil {
		p.BannerAktif = *req.BannerAktif
	}
	if req.BannerTipe != nil {
		tipe := strings.TrimSpace(*req.BannerTipe)
		if tipe != "info" && tipe != "sukses" && tipe != "peringatan" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Tipe banner harus info, sukses, atau peringatan")
			return
		}
		p.BannerTipe = tipe
	}

	if req.TanggalBuka != nil {
		t, err := parseTanggalLanding(*req.TanggalBuka)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Format tanggal buka tidak valid (gunakan YYYY-MM-DD)")
			return
		}
		p.TanggalBuka = t
	}
	if req.TanggalTutup != nil {
		t, err := parseTanggalLanding(*req.TanggalTutup)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Format tanggal tutup tidak valid (gunakan YYYY-MM-DD)")
			return
		}
		p.TanggalTutup = t
	}

	if p.TanggalBuka != nil && p.TanggalTutup != nil && p.TanggalTutup.Before(*p.TanggalBuka) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal tutup tidak boleh lebih awal dari tanggal buka")
		return
	}

	if p.NamaSitus == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Nama situs tidak boleh kosong")
		return
	}

	if err := config.DB.Save(&p).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan landing page")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengaturan landing page berhasil disimpan", p)
}

// ==================== UPLOAD LOGO / FAVICON ====================

// UploadFilePengaturanLanding menerima :jenis = "logo" atau "favicon".
// File lama otomatis dihapus memakai helper gantiFile().
func UploadFilePengaturanLanding(c *gin.Context) {
	jenis := c.Param("jenis")
	if jenis != "logo" && jenis != "favicon" && jenis != "foto-kantor" && jenis != "og-image" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file harus logo, favicon, foto-kantor, atau og-image")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File tidak ditemukan")
		return
	}

	batasUkuran := int64(maxLogoSize)
	if jenis == "foto-kantor" || jenis == "og-image" {
		batasUkuran = 5 << 20 // foto kantor & OG image boleh sampai 5 MB
	}
	if file.Size > batasUkuran {
		utils.ErrorResponse(c, http.StatusBadRequest,
			fmt.Sprintf("Ukuran file maksimal %d MB", batasUkuran/(1<<20)))
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if (jenis == "logo" || jenis == "foto-kantor" || jenis == "og-image") && !landingImageExt[ext] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Gambar harus berformat JPG, PNG, WEBP, atau SVG")
		return
	}
	if jenis == "favicon" && !landingIconExt[ext] {
		utils.ErrorResponse(c, http.StatusBadRequest, "Favicon harus berformat PNG, ICO, atau SVG")
		return
	}

	p, err := getOrSeedPengaturanLanding()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan landing page")
		return
	}

	folder := "uploads/landing"
	if err := os.MkdirAll(folder, os.ModePerm); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyiapkan folder penyimpanan")
		return
	}

	namaFile := fmt.Sprintf("%s-%d%s", jenis, time.Now().UnixNano(), ext)
	savePath := filepath.ToSlash(filepath.Join(folder, namaFile))

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan file")
		return
	}

	fileLama := p.FileLogo
	switch jenis {
	case "favicon":
		fileLama = p.FileFavicon
	case "foto-kantor":
		fileLama = p.FileFotoKantor
	case "og-image":
		fileLama = p.FileOgImage
	}

	switch jenis {
	case "logo":
		p.FileLogo = savePath
	case "favicon":
		p.FileFavicon = savePath
	case "foto-kantor":
		p.FileFotoKantor = savePath
	case "og-image":
		p.FileOgImage = savePath
	}

	if err := config.DB.Save(&p).Error; err != nil {
		// Rollback file yang baru saja tersimpan agar tidak jadi sampah.
		os.Remove(savePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan landing page")
		return
	}

	// Hapus file lama HANYA setelah DB berhasil tersimpan.
	gantiFile(fileLama, savePath)

	utils.SuccessResponse(c, http.StatusOK, "File berhasil diunggah", gin.H{
		"jenis": jenis,
		"path":  savePath,
		"url":   urlPublikBerkas(savePath),
	})
}

func DeleteFilePengaturanLanding(c *gin.Context) {
	jenis := c.Param("jenis")
	if jenis != "logo" && jenis != "favicon" && jenis != "foto-kantor" && jenis != "og-image" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis file harus logo, favicon, foto-kantor, atau og-image")
		return
	}

	p, err := getOrSeedPengaturanLanding()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengaturan landing page")
		return
	}

	fileLama := p.FileLogo
	switch jenis {
	case "favicon":
		fileLama = p.FileFavicon
	case "foto-kantor":
		fileLama = p.FileFotoKantor
	case "og-image":
		fileLama = p.FileOgImage
	}

	if fileLama == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tidak ada file yang bisa dihapus")
		return
	}

	switch jenis {
	case "logo":
		p.FileLogo = ""
	case "favicon":
		p.FileFavicon = ""
	case "foto-kantor":
		p.FileFotoKantor = ""
	case "og-image":
		p.FileOgImage = ""
	}

	if err := config.DB.Save(&p).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengaturan landing page")
		return
	}

	hapusFileLama(fileLama)

	utils.SuccessResponse(c, http.StatusOK, "File berhasil dihapus", nil)
}