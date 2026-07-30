package services

import (
	"encoding/json"
	"strings"
)

// TataLetakSurat adalah seluruh angka penataan surat yang bisa diubah admin
// dari halaman web. Semua satuan panjang dalam milimeter (mm), ukuran font
// dalam point (pt). Kertas A4 = 210 x 297 mm.
type TataLetakSurat struct {
	// ── Margin ──
	MarginKiri  float64 `json:"margin_kiri"`
	MarginKanan float64 `json:"margin_kanan"`
	MarginAtas  float64 `json:"margin_atas"`
	MarginBawah float64 `json:"margin_bawah"`

	// ── Tipografi ──
	FontIsi          string  `json:"font_isi"` // "Arial" | "Times" | "Helvetica"
	UkuranFontIsi    float64 `json:"ukuran_font_isi"`
	UkuranFontJudul  float64 `json:"ukuran_font_judul"`
	UkuranFontKop    float64 `json:"ukuran_font_kop"`
	UkuranFontAlamat float64 `json:"ukuran_font_alamat"`
	TinggiBaris      float64 `json:"tinggi_baris"`
	JarakParagraf    float64 `json:"jarak_paragraf"`

	// ── Kop Surat ──
	TampilkanKop      bool    `json:"tampilkan_kop"`
	KopX              float64 `json:"kop_x"`
	KopLebar          float64 `json:"kop_lebar"`
	TampilkanLogo     bool    `json:"tampilkan_logo"`
	LogoX             float64 `json:"logo_x"`
	LogoY             float64 `json:"logo_y"`
	LogoLebar         float64 `json:"logo_lebar"`
	JarakLogoKeKop    float64 `json:"jarak_logo_ke_kop"` // jarak mendatar logo → tepi kiri tulisan kop
	LogoIkutKop         bool `json:"logo_ikut_kop"`          // true: logo menempel otomatis ke tulisan kop
	PusatkanKopDenganLogo bool `json:"pusatkan_kop_dengan_logo"` // true: logo + tulisan dianggap satu blok lalu ditengahkan
	TampilkanGarisKop bool    `json:"tampilkan_garis_kop"`
	GarisKopTebal     float64 `json:"garis_kop_tebal"`
	JarakSetelahKop   float64 `json:"jarak_setelah_kop"`

	// ── Tempat & Tanggal (rata kanan, di bawah kop) ──
	TampilkanTanggal    bool    `json:"tampilkan_tanggal"`
	TanggalX            float64 `json:"tanggal_x"`
	TanggalLebar        float64 `json:"tanggal_lebar"`
	JarakSetelahTanggal float64 `json:"jarak_setelah_tanggal"`

	// ── Judul & Nomor ──
	JudulTebal          bool    `json:"judul_tebal"`
	TampilkanGarisJudul bool    `json:"tampilkan_garis_judul"`
	JarakSetelahJudul   float64 `json:"jarak_setelah_judul"`

	// ── Blok Tujuan ──
	IndentTujuan    float64 `json:"indent_tujuan"`
	JarakSetelahIsi float64 `json:"jarak_setelah_isi"`

	// ── Data Peserta ──
	IndentData     float64  `json:"indent_data"`
	LebarLabelData float64  `json:"lebar_label_data"`
	BarisData      []string `json:"baris_data"` // nama | induk | bidang | periode

	// ── Blok Tanda Tangan ──
	TtdX             float64 `json:"ttd_x"`
	TtdLebar         float64 `json:"ttd_lebar"`
	RuangTtd         float64 `json:"ruang_ttd"`
	TampilkanTtd     bool    `json:"tampilkan_ttd"`
	TtdGambarLebar   float64 `json:"ttd_gambar_lebar"`
	TtdGambarGeserX  float64 `json:"ttd_gambar_geser_x"`
	TtdGambarGeserY  float64 `json:"ttd_gambar_geser_y"`
	TampilkanStempel bool    `json:"tampilkan_stempel"`
	StempelLebar     float64 `json:"stempel_lebar"`
	StempelGeserX    float64 `json:"stempel_geser_x"`
	StempelGeserY    float64 `json:"stempel_geser_y"`
	GarisBawahNama   bool    `json:"garis_bawah_nama"`
}

// KotakBlok adalah posisi nyata sebuah blok pada halaman (mm), dipakai
// pratinjau interaktif untuk menaruh kotak yang bisa digeser.
type KotakBlok struct {
	Kunci string  `json:"kunci"`
	Label string  `json:"label"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	W     float64 `json:"w"`
	H     float64 `json:"h"`
}

// Rentang dikirim ke frontend supaya geseran berhenti di titik yang sama
// dengan validasi backend.
type Rentang struct {
	Min  float64 `json:"min"`
	Max  float64 `json:"max"`
	Step float64 `json:"step"`
}

// BatasTataLetakSurat harus selalu sama dengan angka di normalisasi().
func BatasTataLetakSurat() map[string]Rentang {
	return map[string]Rentang{
		"margin_kiri":         {5, 80, 0.5},
		"margin_kanan":        {5, 80, 0.5},
		"margin_atas":         {5, 80, 0.5},
		"margin_bawah":        {5, 60, 0.5},
		"ukuran_font_isi":     {6, 20, 0.5},
		"ukuran_font_judul":   {6, 24, 0.5},
		"ukuran_font_kop":     {6, 24, 0.5},
		"ukuran_font_alamat":  {5, 16, 0.5},
		"tinggi_baris":        {3, 12, 0.1},
		"jarak_paragraf":      {0, 20, 0.5},
		"kop_x":               {0, 150, 0.5},
		"kop_lebar":           {60, 210, 0.5},
		"logo_x":              {0, 190, 0.5},
		"logo_y":              {0, 100, 0.5},
		"logo_lebar":          {5, 60, 0.5},
		"jarak_logo_ke_kop":   {0, 60, 0.5},
		"garis_kop_tebal":     {0.1, 3, 0.1},
		"jarak_setelah_kop":     {0, 40, 0.5},
		"tanggal_x":             {0, 190, 0.5},
		"tanggal_lebar":         {30, 190, 0.5},
		"jarak_setelah_tanggal": {0, 40, 0.5},
		"jarak_setelah_judul":   {0, 40, 0.5},
		"indent_tujuan":       {0, 60, 0.5},
		"jarak_setelah_isi":   {0, 30, 0.5},
		"indent_data":         {0, 60, 0.5},
		"lebar_label_data":    {20, 90, 0.5},
		"ttd_x":               {0, 190, 0.5},
		"ttd_lebar":           {40, 190, 0.5},
		"ruang_ttd":           {5, 70, 0.5},
		"ttd_gambar_lebar":    {10, 90, 0.5},
		"ttd_gambar_geser_x":  {-60, 60, 0.5},
		"ttd_gambar_geser_y":  {-30, 30, 0.5},
		"stempel_lebar":       {10, 90, 0.5},
		"stempel_geser_x":     {-80, 80, 0.5},
		"stempel_geser_y":     {-40, 40, 0.5},
	}
}

// DefaultTataLetakSurat mengembalikan nilai yang sama dengan konstanta
// hardcode sebelumnya, sehingga template lama tetap tampil identik.
func DefaultTataLetakSurat() TataLetakSurat {
	return TataLetakSurat{
		MarginKiri:  25,
		MarginKanan: 20,
		MarginAtas:  13,
		MarginBawah: 15,

		FontIsi:          "Arial",
		UkuranFontIsi:    11,
		UkuranFontJudul:  11,
		UkuranFontKop:    14,
		UkuranFontAlamat: 9,
		TinggiBaris:      5.2,
		JarakParagraf:    3,

		TampilkanKop:    true,
		KopX:            20,
		KopLebar:        170,
		TampilkanLogo: true,
		LogoX:         22,
		LogoY:         14,
		LogoLebar:     20,
		// Logo menempel ke tepi kiri tulisan kop dengan jarak tetap 4 mm.
		// Teks kop sendiri tetap rata tengah halaman.
		// Celah kecil saja supaya logo terasa menyatu dengan tulisan kop
		JarakLogoKeKop: 1,
		LogoIkutKop:    true,
		// Logo + tulisan kop ditengahkan sebagai satu kesatuan, sehingga
		// keseluruhan kop tidak terlihat condong ke kiri.
		PusatkanKopDenganLogo: true,
		// Mengikuti contoh surat asli: kop TANPA garis pemisah
		TampilkanGarisKop: false,
		GarisKopTebal:     0.8,
		JarakSetelahKop:   6,

		// Tempat & tanggal: rata kanan, TEPAT DI BAWAH kop (bukan sejajar kop).
		// Blok berakhir di 130 + 60 = 190 mm = margin kanan kertas.
		TampilkanTanggal:    true,
		TanggalX:            130,
		TanggalLebar:        60,
		JarakSetelahTanggal: 6,

		// Judul surat polos (tidak tebal, tanpa garis bawah)
		JudulTebal:          false,
		TampilkanGarisJudul: false,
		JarakSetelahJudul:   4,

		IndentTujuan:    5,
		JarakSetelahIsi: 3,

		IndentData:     10,
		LebarLabelData: 45,
		BarisData:      []string{"nama", "induk", "bidang", "periode"},

		TtdX:             103,
		TtdLebar:         87,
		RuangTtd:         26,
		TampilkanTtd:     true,
		TtdGambarLebar:   35,
		TtdGambarGeserX:  0,
		TtdGambarGeserY:  0,
		TampilkanStempel: false,
		StempelLebar:     30,
		StempelGeserX:    -18,
		StempelGeserY:    2,
		// Nama penandatangan polos: tanpa tebal, tanpa garis bawah
		GarisBawahNama:   false,
	}
}

// ParseTataLetakSurat menimpa default dengan JSON tersimpan.
// Kunci yang tidak ada di JSON tetap memakai nilai default.
func ParseTataLetakSurat(raw string) TataLetakSurat {
	t := DefaultTataLetakSurat()
	if s := strings.TrimSpace(raw); s != "" && s != "null" {
		_ = json.Unmarshal([]byte(s), &t)
	}
	t.normalisasi()
	return t
}

// normalisasi menjepit angka ke rentang yang aman. Sengaja MENJEPIT
// (clamp), bukan mengembalikan ke nilai bawaan, supaya saat admin menyeret
// blok di pratinjau, blok berhenti di tepi dan tidak melompat.
func (t *TataLetakSurat) normalisasi() {
	d := DefaultTataLetakSurat()

	batas := func(nilai, min, max float64) float64 {
		if nilai < min {
			return min
		}
		if nilai > max {
			return max
		}
		return nilai
	}

	t.MarginKiri = batas(t.MarginKiri, 5, 80)
	t.MarginKanan = batas(t.MarginKanan, 5, 80)
	t.MarginAtas = batas(t.MarginAtas, 5, 80)
	t.MarginBawah = batas(t.MarginBawah, 5, 60)

	t.UkuranFontIsi = batas(t.UkuranFontIsi, 6, 20)
	t.UkuranFontJudul = batas(t.UkuranFontJudul, 6, 24)
	t.UkuranFontKop = batas(t.UkuranFontKop, 6, 24)
	t.UkuranFontAlamat = batas(t.UkuranFontAlamat, 5, 16)
	t.TinggiBaris = batas(t.TinggiBaris, 3, 12)
	t.JarakParagraf = batas(t.JarakParagraf, 0, 20)

	t.KopX = batas(t.KopX, 0, 150)
	t.KopLebar = batas(t.KopLebar, 60, 210)
	t.LogoX = batas(t.LogoX, 0, 190)
	t.LogoY = batas(t.LogoY, 0, 100)
	t.LogoLebar = batas(t.LogoLebar, 5, 60)
	t.JarakLogoKeKop = batas(t.JarakLogoKeKop, 0, 60)
	t.GarisKopTebal = batas(t.GarisKopTebal, 0.1, 3)
	t.JarakSetelahKop = batas(t.JarakSetelahKop, 0, 40)
	t.TanggalX = batas(t.TanggalX, 0, 190)
	t.TanggalLebar = batas(t.TanggalLebar, 30, 190)
	t.JarakSetelahTanggal = batas(t.JarakSetelahTanggal, 0, 40)
	t.JarakSetelahJudul = batas(t.JarakSetelahJudul, 0, 40)

	t.IndentTujuan = batas(t.IndentTujuan, 0, 60)
	t.JarakSetelahIsi = batas(t.JarakSetelahIsi, 0, 30)
	t.IndentData = batas(t.IndentData, 0, 60)
	t.LebarLabelData = batas(t.LebarLabelData, 20, 90)

	t.TtdX = batas(t.TtdX, 0, 190)
	t.TtdLebar = batas(t.TtdLebar, 40, 190)
	t.RuangTtd = batas(t.RuangTtd, 5, 70)
	t.TtdGambarLebar = batas(t.TtdGambarLebar, 10, 90)
	t.TtdGambarGeserX = batas(t.TtdGambarGeserX, -60, 60)
	t.TtdGambarGeserY = batas(t.TtdGambarGeserY, -30, 30)
	t.StempelLebar = batas(t.StempelLebar, 10, 90)
	t.StempelGeserX = batas(t.StempelGeserX, -80, 80)
	t.StempelGeserY = batas(t.StempelGeserY, -40, 40)

	if strings.TrimSpace(t.FontIsi) == "" {
		t.FontIsi = d.FontIsi
	}
	if len(t.BarisData) == 0 {
		t.BarisData = d.BarisData
	}
		// Blok TTD tidak boleh keluar dari kertas
	if t.TtdX+t.TtdLebar > 210-t.MarginKanan+5 {
		t.TtdLebar = 210 - t.MarginKanan - t.TtdX
	}
	// Blok tempat & tanggal juga tidak boleh keluar dari kertas
	if t.TanggalX+t.TanggalLebar > 210-t.MarginKanan+5 {
		t.TanggalLebar = 210 - t.MarginKanan - t.TanggalX
	}
}

// AktifBarisData mengecek apakah satu baris data peserta ditampilkan.
func (t TataLetakSurat) AktifBarisData(kunci string) bool {
	for _, k := range t.BarisData {
		if strings.EqualFold(strings.TrimSpace(k), kunci) {
			return true
		}
	}
	return false
}