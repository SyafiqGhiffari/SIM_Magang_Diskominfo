// ==============================================================================
// CONTROLLER: Landing Controller
// DESKRIPSI: Mengelola seluruh konten dan konfigurasi halaman depan (landing page),
//            termasuk identitas instansi, banner carousel hero slide, butir-butir konten
//            (alur, syarat, dokumen, manfaat), menu navbar, serta jadwal pendaftaran.
// ROLE TERKAIT: [ROLE: PUBLIK] & [ROLE: ADMIN]
// ==============================================================================

package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
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

// [ROLE: PUBLIK]
// GetLandingPublik mengembalikan seluruh data landing page dalam satu response terpadu (menu, hero slide, konten, bidang, identitas, kontak, dan jadwal pendaftaran).
// Endpoint: GET /api/landing
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

// [ROLE: ADMIN]
// GetPengaturanLanding mengambil konfigurasi umum landing page (identitas instansi, kontak, status buka/tutup pendaftaran, tanggal periode).
// Endpoint: GET /api/manajemen/admin/pengaturan-landing
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

// [ROLE: ADMIN]
// UpdatePengaturanLanding memperbarui teks identitas, hero banner, kontak, SEO, dan periode jadwal buka pendaftaran.
// Endpoint: PUT /api/manajemen/admin/pengaturan-landing
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

// [ROLE: ADMIN]
// UploadFilePengaturanLanding mengunggah berkas gambar aset landing page (logo, favicon, foto kantor, atau og-image) dan otomatis menghapus berkas lama.
// Endpoint: POST /api/manajemen/admin/pengaturan-landing/upload/:jenis
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

// [ROLE: ADMIN]
// DeleteFilePengaturanLanding menghapus berkas media aset landing page (logo, favicon, foto kantor, og-image) dan mengosongkan path di database.
// Endpoint: DELETE /api/manajemen/admin/pengaturan-landing/upload/:jenis
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

// ==============================================================================
// ── HERO SLIDES (BANNER UTAMA) ───────────────────────────────────────────────
// ==============================================================================

const maxSlideSize = 5 << 20 // 5 MB

// Diisi dengan gambar bawaan supaya tampilan landing page langsung aktif
func seedHeroSlideJikaKosong() {
	var jumlah int64
	config.DB.Model(&models.LandingHeroSlide{}).Count(&jumlah)
	if jumlah > 0 {
		return
	}

	bawaan := []models.LandingHeroSlide{
		{Judul: "Ruang Kerja Digital", Urutan: 1, IsActive: true,
			UrlGambar: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1920&q=80"},
		{Judul: "Kolaborasi Tim", Urutan: 2, IsActive: true,
			UrlGambar: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1920&q=80"},
		{Judul: "Suasana Kantor", Urutan: 3, IsActive: true,
			UrlGambar: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1920&q=80"},
	}
	for i := range bawaan {
		config.DB.Create(&bawaan[i])
	}
}

func simpanGambarSlide(c *gin.Context) (string, error, bool) {
	file, err := c.FormFile("file")
	if err != nil {
		return "", nil, false // tidak ada file diunggah — bukan error
	}

	if file.Size > maxSlideSize {
		return "", fmt.Errorf("Ukuran gambar maksimal 5 MB"), true
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !landingImageExt[ext] {
		return "", fmt.Errorf("Gambar harus berformat JPG, PNG, WEBP, atau SVG"), true
	}

	folder := "uploads/landing"
	if err := os.MkdirAll(folder, os.ModePerm); err != nil {
		return "", fmt.Errorf("Gagal menyiapkan folder penyimpanan"), true
	}

	namaFile := fmt.Sprintf("hero-%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.ToSlash(filepath.Join(folder, namaFile))

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		return "", fmt.Errorf("Gagal menyimpan gambar"), true
	}
	return savePath, nil, true
}

func slideResponse(s models.LandingHeroSlide) gin.H {
	url := s.UrlGambar
	if s.FileGambar != "" {
		url = urlPublikBerkas(s.FileGambar)
	}
	return gin.H{
		"id":          s.ID,
		"judul":       s.Judul,
		"file_gambar": s.FileGambar,
		"url_gambar":  s.UrlGambar,
		"pratinjau":   url,
		"urutan":      s.Urutan,
		"is_active":   s.IsActive,
	}
}

// [ROLE: ADMIN]
// GetHeroSlides mengambil daftar semua banner carousel gambar hero pada landing page.
// Endpoint: GET /api/manajemen/admin/hero-slide
func GetHeroSlides(c *gin.Context) {
	seedHeroSlideJikaKosong()

	var slides []models.LandingHeroSlide
	if err := config.DB.Order("urutan asc, id asc").Find(&slides).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data slide")
		return
	}

	result := make([]gin.H, 0, len(slides))
	for _, s := range slides {
		result = append(result, slideResponse(s))
	}
	utils.SuccessResponse(c, http.StatusOK, "Data slide berhasil diambil", result)
}

// [ROLE: ADMIN]
// CreateHeroSlide membuat slide banner carousel baru dengan judul, subjudul, dan berkas gambar atau URL gambar.
// Endpoint: POST /api/manajemen/admin/hero-slide
func CreateHeroSlide(c *gin.Context) {
	savePath, errFile, adaFile := simpanGambarSlide(c)
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}

	urlLuar := strings.TrimSpace(c.PostForm("url_gambar"))
	if !adaFile && urlLuar == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Unggah gambar atau isi tautan gambar terlebih dahulu")
		return
	}

	urutan, _ := strconv.Atoi(c.PostForm("urutan"))

	slide := models.LandingHeroSlide{
		Judul:      strings.TrimSpace(c.PostForm("judul")),
		FileGambar: savePath,
		UrlGambar:  urlLuar,
		Urutan:     urutan,
		IsActive:   c.PostForm("is_active") != "false",
	}

	if err := config.DB.Create(&slide).Error; err != nil {
		if savePath != "" {
			os.Remove(savePath) // rollback file agar tidak jadi sampah
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menambahkan slide")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Slide berhasil ditambahkan", slideResponse(slide))
}

// [ROLE: ADMIN]
// UpdateHeroSlide memperbarui konten teks, gambar, status aktif, atau urutan banner hero slide.
// Endpoint: PUT /api/manajemen/admin/hero-slide/:id
func UpdateHeroSlide(c *gin.Context) {
	var slide models.LandingHeroSlide
	if err := config.DB.First(&slide, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Slide tidak ditemukan")
		return
	}

	savePath, errFile, adaFile := simpanGambarSlide(c)
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}

	fileLama := slide.FileGambar

	if adaFile {
		slide.FileGambar = savePath
		slide.UrlGambar = "" // file unggahan menggantikan tautan luar
	} else if v, ok := c.GetPostForm("url_gambar"); ok {
		urlLuar := strings.TrimSpace(v)
		if urlLuar != "" {
			slide.UrlGambar = urlLuar
			slide.FileGambar = "" // tautan luar menggantikan file unggahan
		}
	}

	if v, ok := c.GetPostForm("judul"); ok {
		slide.Judul = strings.TrimSpace(v)
	}
	if v, ok := c.GetPostForm("urutan"); ok {
		n, _ := strconv.Atoi(v)
		slide.Urutan = n
	}
	if v, ok := c.GetPostForm("is_active"); ok {
		slide.IsActive = v != "false"
	}

	if slide.FileGambar == "" && slide.UrlGambar == "" {
		if savePath != "" {
			os.Remove(savePath)
		}
		utils.ErrorResponse(c, http.StatusBadRequest, "Slide harus memiliki gambar atau tautan gambar")
		return
	}

	if err := config.DB.Save(&slide).Error; err != nil {
		if savePath != "" {
			os.Remove(savePath)
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui slide")
		return
	}

	// Hapus file lama HANYA setelah DB berhasil tersimpan.
	if fileLama != "" && fileLama != slide.FileGambar {
		gantiFile(fileLama, slide.FileGambar)
	}

	utils.SuccessResponse(c, http.StatusOK, "Slide berhasil diperbarui", slideResponse(slide))
}

// [ROLE: ADMIN]
// DeleteHeroSlide menghapus banner slide carousel hero beserta file gambar fisiknya.
// Endpoint: DELETE /api/manajemen/admin/hero-slide/:id
func DeleteHeroSlide(c *gin.Context) {
	var slide models.LandingHeroSlide
	if err := config.DB.First(&slide, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Slide tidak ditemukan")
		return
	}

	fileLama := slide.FileGambar

	if err := config.DB.Delete(&slide).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus slide")
		return
	}

	hapusFileLama(fileLama)

	utils.SuccessResponse(c, http.StatusOK, "Slide berhasil dihapus", nil)
}

// ==============================================================================
// ── KONTEN DINAMIS LANDING PAGE ──────────────────────────────────────────────
// ==============================================================================

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

// Diisi dengan teks bawaan bila tabel masih kosong.
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

// [ROLE: ADMIN]
// GetKontenLanding mengambil daftar konten landing page berdasarkan jenis (misal: faq, testimoni, alur, benefit, dll).
// Endpoint: GET /api/manajemen/admin/landing-konten/:jenis
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

// [ROLE: ADMIN]
// CreateKontenLanding menambahkan item konten baru pada landing page berdasarkan jenis yang ditentukan.
// Endpoint: POST /api/manajemen/admin/landing-konten/:jenis
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

// [ROLE: ADMIN]
// UpdateKontenLanding memperbarui item konten landing page berdasarkan ID.
// Endpoint: PUT /api/manajemen/admin/landing-konten-item/:id
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

// [ROLE: ADMIN]
// DeleteKontenLanding menghapus item konten landing page berdasarkan ID.
// Endpoint: DELETE /api/manajemen/admin/landing-konten-item/:id
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

// [ROLE: ADMIN]
// UrutkanKontenLanding memperbarui urutan tampilan item konten landing page untuk jenis tertentu (menerima array ID urutan baru).
// Endpoint: PUT /api/manajemen/admin/landing-konten/:jenis/urutan
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

// ==============================================================================
// ── MENU NAVIGASI LANDING PAGE ───────────────────────────────────────────────
// ==============================================================================

// pathMenuLanding = WHITELIST route yang boleh muncul di menu.
var pathMenuLanding = map[string]string{
	"beranda":        "/",
	"tentang":        "/tentang",
	"program-magang": "/program-magang",
	"persyaratan":    "/persyaratan",
	"faq":            "/faq",
	"kontak":         "/kontak",
}

// seedMenuLandingJikaKosong mengisi menu bawaan
func seedMenuLandingJikaKosong() {
	var jumlah int64
	config.DB.Model(&models.LandingMenu{}).Count(&jumlah)
	if jumlah > 0 {
		return
	}

	bawaan := []models.LandingMenu{
		{Kode: "beranda", Label: "Beranda", LabelFooter: "Beranda Portal", Urutan: 1, TampilNavbar: true, TampilFooter: true},
		{Kode: "tentang", Label: "Tentang", LabelFooter: "Tentang Program", Urutan: 2, TampilNavbar: true, TampilFooter: true},
		{Kode: "program-magang", Label: "Program Magang", LabelFooter: "Pilihan Bidang Magang", Urutan: 3, TampilNavbar: true, TampilFooter: true},
		{Kode: "persyaratan", Label: "Persyaratan", LabelFooter: "Ketentuan & Syarat", Urutan: 4, TampilNavbar: true, TampilFooter: true},
		{Kode: "faq", Label: "FAQ", LabelFooter: "Pertanyaan Populer (FAQ)", Urutan: 5, TampilNavbar: true, TampilFooter: true},
		{Kode: "kontak", Label: "Kontak", LabelFooter: "Hubungi Kami", Urutan: 6, TampilNavbar: true, TampilFooter: false},
	}

	for i := range bawaan {
		config.DB.Create(&bawaan[i])
	}
}

// menuLandingPublik mengembalikan dua daftar siap pakai untuk Navbar & Footer.
func menuLandingPublik() gin.H {
	seedMenuLandingJikaKosong()

	var semua []models.LandingMenu
	config.DB.Order("urutan asc, id asc").Find(&semua)

	navbar := make([]gin.H, 0)
	footer := make([]gin.H, 0)

	for _, m := range semua {
		path, ok := pathMenuLanding[m.Kode]
		if !ok {
			// Kode tidak dikenali (misal sisa data lama) → abaikan, jangan render.
			continue
		}

		if m.TampilNavbar && strings.TrimSpace(m.Label) != "" {
			navbar = append(navbar, gin.H{
				"kode":  m.Kode,
				"label": m.Label,
				"path":  path,
			})
		}

		if m.TampilFooter {
			label := strings.TrimSpace(m.LabelFooter)
			if label == "" {
				label = m.Label
			}
			if label != "" {
				footer = append(footer, gin.H{
					"kode":  m.Kode,
					"label": label,
					"path":  path,
				})
			}
		}
	}

	return gin.H{"navbar": navbar, "footer": footer}
}

// [ROLE: ADMIN]
// GetMenuLanding mengambil seluruh konfigurasi menu navigasi (navbar dan footer) landing page.
// Endpoint: GET /api/manajemen/admin/landing-menu
func GetMenuLanding(c *gin.Context) {
	seedMenuLandingJikaKosong()

	var semua []models.LandingMenu
	if err := config.DB.Order("urutan asc, id asc").Find(&semua).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil menu navigasi")
		return
	}

	hasil := make([]gin.H, 0, len(semua))
	for _, m := range semua {
		hasil = append(hasil, gin.H{
			"id":            m.ID,
			"kode":          m.Kode,
			"path":          pathMenuLanding[m.Kode], // hanya untuk ditampilkan, read-only
			"label":         m.Label,
			"label_footer":  m.LabelFooter,
			"urutan":        m.Urutan,
			"tampil_navbar": m.TampilNavbar,
			"tampil_footer": m.TampilFooter,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Menu navigasi berhasil diambil", hasil)
}

type menuLandingInput struct {
	Label        *string `json:"label"`
	LabelFooter  *string `json:"label_footer"`
	TampilNavbar *bool   `json:"tampil_navbar"`
	TampilFooter *bool   `json:"tampil_footer"`
}

// [ROLE: ADMIN]
// UpdateMenuLanding memperbarui label dan visibilitas item menu navigasi landing page. Sengaja tidak menerima perubahan kode/path.
// Endpoint: PUT /api/manajemen/admin/landing-menu/:id
func UpdateMenuLanding(c *gin.Context) {
	var menu models.LandingMenu
	if err := config.DB.First(&menu, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Menu tidak ditemukan")
		return
	}

	var input menuLandingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}

	if input.Label != nil {
		label := strings.TrimSpace(*input.Label)
		if label == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Label menu tidak boleh kosong")
			return
		}
		menu.Label = label
	}
	if input.LabelFooter != nil {
		menu.LabelFooter = strings.TrimSpace(*input.LabelFooter)
	}
	if input.TampilNavbar != nil {
		menu.TampilNavbar = *input.TampilNavbar
	}
	if input.TampilFooter != nil {
		menu.TampilFooter = *input.TampilFooter
	}

	if err := config.DB.Save(&menu).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan menu")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Menu berhasil disimpan", menu)
}

// [ROLE: ADMIN]
// UrutkanMenuLanding memperbarui urutan posisi item menu navigasi landing page (menerima array ID urutan baru).
// Endpoint: PUT /api/manajemen/admin/landing-menu/urutan
func UrutkanMenuLanding(c *gin.Context) {
	var body struct {
		Urutan []uint `json:"urutan"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}

	for i, id := range body.Urutan {
		config.DB.Model(&models.LandingMenu{}).Where("id = ?", id).Update("urutan", i+1)
	}

	utils.SuccessResponse(c, http.StatusOK, "Urutan menu berhasil disimpan", nil)
}