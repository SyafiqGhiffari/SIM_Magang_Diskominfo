package models

import "time"

// PengaturanLandingPage menyimpan konten landing page web pendaftaran yang
// dapat diatur admin dari web manajemen. Selalu hanya ada 1 baris (singleton),
// di-seed otomatis saat pertama kali diakses.
type PengaturanLandingPage struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// ── Identitas & Branding ──
	NamaSitus     string `gorm:"type:varchar(100)" json:"nama_situs"`
	SubJudulSitus string `gorm:"type:varchar(150)" json:"sub_judul_situs"`
	FileLogo      string `gorm:"type:varchar(255)" json:"file_logo"`
	FileFavicon   string `gorm:"type:varchar(255)" json:"file_favicon"`
	TaglineFooter string `gorm:"type:text" json:"tagline_footer"`
	TeksCopyright string `gorm:"type:varchar(255)" json:"teks_copyright"`

	// ===== Hero Section =====
	HeroBadge          string `gorm:"type:varchar(120)" json:"hero_badge"`
	HeroJudul          string `gorm:"type:varchar(255)" json:"hero_judul"`
	HeroJudulHighlight string `gorm:"type:varchar(255)" json:"hero_judul_highlight"`
	HeroSubjudul       string `gorm:"type:text" json:"hero_subjudul"`
	HeroCtaTeks        string `gorm:"type:varchar(100)" json:"hero_cta_teks"`
	HeroCtaLink        string `gorm:"type:varchar(255)" json:"hero_cta_link"`
	HeroCtaTutupTeks   string `gorm:"type:varchar(120)" json:"hero_cta_tutup_teks"`
	HeroCta2Teks       string `gorm:"type:varchar(100)" json:"hero_cta2_teks"`
	HeroCta2Link       string `gorm:"type:varchar(255)" json:"hero_cta2_link"`

	// ===== Section "Tentang" di landing & halaman Tentang =====
	AboutBadge     string `gorm:"type:varchar(120)" json:"about_badge"`
	AboutJudul     string `gorm:"type:varchar(200)" json:"about_judul"`
	AboutParagraf1 string `gorm:"type:text" json:"about_paragraf1"`
	AboutParagraf2 string `gorm:"type:text" json:"about_paragraf2"`

	ProfilJudul     string `gorm:"type:varchar(200)" json:"profil_judul"`
	ProfilDeskripsi string `gorm:"type:text" json:"profil_deskripsi"`
	FileFotoKantor  string `gorm:"type:varchar(255)" json:"file_foto_kantor"`

	VisiJudul string `gorm:"type:varchar(200)" json:"visi_judul"`
	VisiTeks  string `gorm:"type:text" json:"visi_teks"`
	MisiJudul string `gorm:"type:varchar(200)" json:"misi_judul"`

	// ===== SEO & Social Preview =====
	SeoTitle       string `gorm:"type:varchar(200)" json:"seo_title"`
	SeoDescription string `gorm:"type:varchar(300)" json:"seo_description"`
	SeoKeywords    string `gorm:"type:varchar(300)" json:"seo_keywords"`
	FileOgImage    string `gorm:"type:varchar(255)" json:"file_og_image"`

	// ── Kontak ──
	EmailResmi    string `gorm:"type:varchar(150)" json:"email_resmi"`
	Telepon       string `gorm:"type:varchar(50)" json:"telepon"`
	NamaGedung    string `gorm:"type:varchar(150)" json:"nama_gedung"`
	AlamatLengkap string `gorm:"type:text" json:"alamat_lengkap"`
	JamLayanan    string `gorm:"type:varchar(150)" json:"jam_layanan"`
	EmbedMaps     string `gorm:"type:longtext" json:"embed_maps"`

	// ── Media Sosial ──
	LinkInstagram string `gorm:"type:varchar(255)" json:"link_instagram"`
	LinkFacebook  string `gorm:"type:varchar(255)" json:"link_facebook"`
	LinkYoutube   string `gorm:"type:varchar(255)" json:"link_youtube"`
	LinkWebsite   string `gorm:"type:varchar(255)" json:"link_website"`

	// ── Status Pendaftaran ──
	// Saklar utama. Jika false, pendaftaran ditutup apa pun tanggalnya.
	PendaftaranDibuka bool       `gorm:"default:true" json:"pendaftaran_dibuka"`
	TanggalBuka       *time.Time `gorm:"type:date" json:"tanggal_buka"`
	TanggalTutup      *time.Time `gorm:"type:date" json:"tanggal_tutup"`
	PesanDitutup      string     `gorm:"type:text" json:"pesan_ditutup"`

	// ── Banner pengumuman di landing page ──
	BannerAktif bool   `gorm:"default:false" json:"banner_aktif"`
	BannerTeks  string `gorm:"type:text" json:"banner_teks"`
	BannerTipe  string `gorm:"type:varchar(20)" json:"banner_tipe"` // info | sukses | peringatan

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (PengaturanLandingPage) TableName() string {
	return "pengaturan_landing_pages"
}