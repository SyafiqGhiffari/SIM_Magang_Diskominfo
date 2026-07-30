package services

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sim-magang-backend/models"

	"github.com/go-pdf/fpdf"
)

// ── DATA SURAT ─────────────────────────────────────────────────────────────
// DataSurat adalah nilai-nilai yang dicetak ke dalam surat.
type DataSurat struct {
	NomorSurat string
	// Semua tanggal berupa string "YYYY-MM-DD" mengikuti kolom date di database
	TanggalTerbit         string
	JabatanTujuan         string
	UnitTujuan            string
	InstitusiTujuan       string
	KotaTujuan            string
	NomorSuratPengantar   string
	TanggalSuratPengantar string

	Nama       string
	NomorInduk string
	LabelInduk string
	Kategori   string
	Bidang     string
	Mulai      string
	Selesai    string

	JudulSurat  string
	JenisMagang string

	JabatanTtd string
	NamaTtd    string
	PangkatTtd string
	NipTtd     string
}

// DataSuratDariModel menyusun DataSurat dari snapshot yang tersimpan di baris surat.
func DataSuratDariModel(s *models.SuratPenerimaan) DataSurat {
	return DataSurat{
		NomorSurat:            s.NomorSurat,
		TanggalTerbit:         s.TanggalTerbit,
		JabatanTujuan:         s.JabatanTujuan,
		UnitTujuan:            s.UnitTujuan,
		InstitusiTujuan:       s.InstitusiTujuan,
		KotaTujuan:            s.KotaTujuan,
		NomorSuratPengantar:   s.NomorSuratPengantar,
		TanggalSuratPengantar: s.TanggalSuratPengantar,
		Nama:                  s.SnapshotNama,
		NomorInduk:            s.SnapshotNomorInduk,
		LabelInduk:            s.SnapshotLabelInduk,
		Kategori:              s.SnapshotKategori,
		Bidang:                s.SnapshotBidang,
		Mulai:                 s.SnapshotMulai,
		Selesai:               s.SnapshotSelesai,
		JudulSurat:            s.JudulSurat,
		JenisMagang:           s.JenisMagang,
		JabatanTtd:            s.SnapshotJabatanTtd,
		NamaTtd:               s.SnapshotNamaTtd,
		PangkatTtd:            s.SnapshotPangkatTtd,
		NipTtd:                s.SnapshotNipTtd,
	}
}

// ── HELPER TEKS & TANGGAL ──────────────────────────────────────────────────

var bulanIndoSurat = []string{
	"Januari", "Februari", "Maret", "April", "Mei", "Juni",
	"Juli", "Agustus", "September", "Oktober", "November", "Desember",
}

var kataKecilSurat = map[string]bool{
	"dan": true, "atau": true, "di": true, "ke": true, "dari": true,
	"pada": true, "untuk": true, "dengan": true, "yang": true, "the": true,
}

// FormatTanggalSurat mengubah "2026-07-07" menjadi "7 Juli 2026".
// Menerima beberapa bentuk karena MySQL/GORM bisa mengembalikan
// "2026-07-07", "2026-07-07T00:00:00Z", atau "2026-07-07 00:00:00".
func FormatTanggalSurat(tgl string) string {
	tgl = strings.TrimSpace(tgl)
	if tgl == "" || strings.HasPrefix(tgl, "0000") {
		return "-"
	}
	for _, pola := range []string{
		"2006-01-02",
		time.RFC3339,
		"2006-01-02 15:04:05",
		"2006-01-02T15:04:05",
	} {
		if t, err := time.Parse(pola, tgl); err == nil {
			return fmt.Sprintf("%d %s %d", t.Day(), bulanIndoSurat[int(t.Month())-1], t.Year())
		}
	}
	// Kalau formatnya tak dikenal, tampilkan apa adanya daripada kosong
	return tgl
}

// keKapitalJudulSurat mengubah "DINAS KOMUNIKASI DAN STATISTIK" menjadi
// "Dinas Komunikasi dan Statistik" untuk dipakai di dalam kalimat.
func keKapitalJudulSurat(s string) string {
	kata := strings.Fields(strings.ToLower(strings.TrimSpace(s)))
	for i, k := range kata {
		if i > 0 && kataKecilSurat[k] {
			continue
		}
		r := []rune(k)
		kata[i] = strings.ToUpper(string(r[0])) + string(r[1:])
	}
	return strings.Join(kata, " ")
}

// namaInstansiTeksSurat memilih teks instansi untuk di dalam kalimat.
func namaInstansiTeksSurat(tpl models.TemplateSurat) string {
	if s := strings.TrimSpace(tpl.NamaInstansiTeks); s != "" {
		return s
	}
	return keKapitalJudulSurat(tpl.NamaInstansi)
}

func bersihkanTeksSurat(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	return strings.TrimSpace(s)
}

// satuBaris memadatkan teks bertingkat menjadi satu baris. Dipakai untuk nilai
// placeholder yang muncul di TENGAH paragraf, supaya enter dari admin tidak
// memotong kalimat paragraf.
func satuBaris(s string) string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	bagian := strings.Fields(strings.ReplaceAll(s, "\n", " "))
	return strings.Join(bagian, " ")
}

// barisTeks memecah isian admin menjadi baris-baris terpisah, mengikuti Enter
// yang ditekan di modal (Shift+Enter). Baris kosong dibuang.
func barisTeks(s string) []string {
	s = strings.ReplaceAll(s, "\r\n", "\n")
	s = strings.ReplaceAll(s, "\r", "\n")
	var hasil []string
	for _, b := range strings.Split(s, "\n") {
		if b = strings.TrimSpace(b); b != "" {
			hasil = append(hasil, b)
		}
	}
	return hasil
}

func fileAdaSurat(p string) bool {
	if strings.TrimSpace(p) == "" {
		return false
	}
	info, err := os.Stat(p)
	return err == nil && !info.IsDir()
}

// logoSuratAtauBawaan memilih berkas logo untuk kop surat.
// Prioritas: logo yang diunggah admin pada template; kalau belum ada, dipakai
// logo bawaan instansi supaya kop tetap lengkap sejak template baru dibuat.
// Begitu admin mengunggah logo lain, logo unggahan itu yang menang.
func logoSuratAtauBawaan(pilihan string) string {
	if fileAdaSurat(pilihan) {
		return pilihan
	}
	for _, kandidat := range []string{
		filepath.Join("assets", "logo-instansi.png"),
		filepath.Join("assets", "logo-ponorogo.png"),
		filepath.Join("uploads", "template-surat", "logo-bawaan.png"),
	} {
		if fileAdaSurat(kandidat) {
			return kandidat
		}
	}
	return ""
}

func nilaiAtau(nilai, bawaan string) string {
	if strings.TrimSpace(nilai) == "" {
		return bawaan
	}
	return nilai
}

// isiPlaceholderSurat mengganti {placeholder} dengan nilai sebenarnya.
func isiPlaceholderSurat(teks string, nilai map[string]string) string {
	for k, v := range nilai {
		teks = strings.ReplaceAll(teks, "{"+k+"}", v)
	}
	return teks
}

// siapkanFontSurat mencoba memuat font asli dari folder fonts/.
// Mengembalikan nama family yang bisa dipakai pdf.SetFont.
func siapkanFontSurat(pdf *fpdf.Fpdf, pilihan string) string {
	jenis := strings.ToLower(strings.TrimSpace(pilihan))

	var reguler, tebal, miring, tebalMiring, family string
	switch jenis {
	case "times", "times new roman":
		reguler, tebal = "times.ttf", "timesbd.ttf"
		miring, tebalMiring, family = "timesi.ttf", "timesbi.ttf", "TimesAsli"
	case "helvetica":
		return "Helvetica"
	default:
		reguler, tebal = "arial.ttf", "arialbd.ttf"
		miring, tebalMiring, family = "ariali.ttf", "arialbi.ttf", "ArialAsli"
	}

	pathReguler := filepath.Join("fonts", reguler)
	pathTebal := filepath.Join("fonts", tebal)
	if fileAdaSurat(pathReguler) && fileAdaSurat(pathTebal) {
		pdf.AddUTF8Font(family, "", pathReguler)
		pdf.AddUTF8Font(family, "B", pathTebal)

		// Gaya miring dipakai redaksi bergaya (*miring*). Kalau berkas font
		// miring tidak ada, gaya "I" tetap didaftarkan memakai berkas biasa
		// supaya PDF tidak gagal dibuat.
		pathMiring := filepath.Join("fonts", miring)
		if !fileAdaSurat(pathMiring) {
			pathMiring = pathReguler
		}
		pathTebalMiring := filepath.Join("fonts", tebalMiring)
		if !fileAdaSurat(pathTebalMiring) {
			pathTebalMiring = pathTebal
		}
		pdf.AddUTF8Font(family, "I", pathMiring)
		pdf.AddUTF8Font(family, "BI", pathTebalMiring)

		if pdf.Err() {
			pdf.ClearError()
		} else {
			return family
		}
	}

	// Fallback ke font inti (metrik Helvetica)
	if jenis == "times" || jenis == "times new roman" {
		return "Times"
	}
	return "Arial"
}

// tinggiGambarSurat menghitung tinggi gambar (mm) bila lebarnya dipaksa
// menjadi `lebar`, memakai rasio asli gambar yang sudah didaftarkan fpdf.
func tinggiGambarSurat(pdf *fpdf.Fpdf, path string, lebar float64) float64 {
	if info := pdf.GetImageInfo(path); info != nil {
		w, h := info.Extent()
		if w > 0 && h > 0 {
			return lebar * h / w
		}
	}
	return lebar // perkiraan aman bila info gambar tidak tersedia
}

// ── PEMBANGUN PDF ──────────────────────────────────────────────────────────

// BangunSuratPDF menyusun dokumen surat di memori.
func BangunSuratPDF(d DataSurat, tpl models.TemplateSurat) *fpdf.Fpdf {
	pdf, _ := bangunSuratPDF(d, tpl, nil)
	return pdf
}

// bangunSuratPDF adalah versi internal yang bisa sekalian mencatat kotak
// tiap bagian surat lewat `rec`. Kalau rec == nil, hasilnya persis sama
// dengan sebelumnya sehingga surat lama tidak berubah tampilannya.
func bangunSuratPDF(d DataSurat, tpl models.TemplateSurat, rec *perekamBlok) (*fpdf.Fpdf, PetaSurat) {
	t := ParseTataLetakSurat(tpl.KonfigurasiTataLetak)

	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(t.MarginKiri, t.MarginAtas, t.MarginKanan)
	pdf.SetAutoPageBreak(true, t.MarginBawah)
	font := siapkanFontSurat(pdf, t.FontIsi)
	pdf.AddPage()

	lebar := 210 - t.MarginKiri - t.MarginKanan
	lh := t.TinggiBaris

	instansiTeks := namaInstansiTeksSurat(tpl)
	sebutan := "Mahasiswa"
	if strings.EqualFold(d.Kategori, "siswa") {
		sebutan = "Siswa"
	}

	nilai := map[string]string{
		// Dipadatkan satu baris: nilai ini dipakai di tengah paragraf pembuka,
		// jadi enter dari admin tidak boleh memotong kalimatnya.
		"jabatan_tujuan":          satuBaris(d.JabatanTujuan),
		"unit_tujuan":             satuBaris(d.UnitTujuan),
		"institusi_tujuan":        satuBaris(d.InstitusiTujuan),
		"kota_tujuan":             satuBaris(d.KotaTujuan),
		"nomor_surat_pengantar":   d.NomorSuratPengantar,
		"jenis_magang":            d.JenisMagang,
		"nama_instansi":           instansiTeks,
		"nama_instansi_kapital":   strings.ToUpper(tpl.NamaInstansi),
		"nama_peserta":            d.Nama,
		"nomor_induk":             d.NomorInduk,
		"label_induk":             d.LabelInduk,
		"sebutan_peserta":         sebutan,
		"tanggal_mulai":           FormatTanggalSurat(d.Mulai),
		"tanggal_selesai":         FormatTanggalSurat(d.Selesai),
		"posisi_bidang":           d.Bidang,
		"tanggal_surat_pengantar": FormatTanggalSurat(d.TanggalSuratPengantar),
	}

	// ── KOP SURAT ──
	// yBawahKop = garis batas bawah kop. Dipakai blok tempat & tanggal supaya
	// selalu berada DI BAWAH kop, tidak pernah sejajar dengan kop.
	yBawahKop := t.MarginAtas
	if t.TampilkanKop {
		berkasLogo := logoSuratAtauBawaan(tpl.FileLogo)

		// Teks kop TETAP memakai kop_x/kop_lebar apa adanya supaya rata tengah
		// halaman, persis seperti surat asli.
		xKop, lebarKop := t.KopX, t.KopLebar

		barisAlamat := []string{
			tpl.AlamatInstansi,
			gabungBaris(tpl.Telepon, tpl.Faksimile),
			gabungBaris(tpl.Laman, tpl.PosEl),
		}

		// Ukur baris kop terlebar untuk tahu di mana tepi kiri tulisan berada.
		pdf.SetFont(font, "", t.UkuranFontKop-2)
		lebarTeksKop := pdf.GetStringWidth(tpl.NamaPemerintah)
		pdf.SetFont(font, "B", t.UkuranFontKop)
		if w := pdf.GetStringWidth(strings.ToUpper(tpl.NamaInstansi)); w > lebarTeksKop {
			lebarTeksKop = w
		}
		pdf.SetFont(font, "", t.UkuranFontAlamat)
		for _, baris := range barisAlamat {
			if w := pdf.GetStringWidth(baris); w > lebarTeksKop {
				lebarTeksKop = w
			}
		}
		// Kelonggaran 3 mm supaya baris terpanjang (nama instansi) tidak
		// pernah dipatahkan MultiCell menjadi dua baris.
		lebarTeksKop += 3
		if lebarTeksKop > lebarKop {
			lebarTeksKop = lebarKop
		}
		xTeksKop := xKop + (lebarKop-lebarTeksKop)/2

		xLogo := t.LogoX
		pakaiLogo := t.TampilkanLogo && berkasLogo != ""
		if pakaiLogo && t.LogoIkutKop {
			if t.PusatkanKopDenganLogo {
				// Logo + celah + tulisan diperlakukan sebagai SATU blok, lalu
				// blok itu ditaruh di tengah area kop. Kalau ruangnya kurang,
				// celah dikecilkan lebih dulu (bukan tulisannya yang dipotong).
				celah := t.JarakLogoKeKop
				lebarBlok := t.LogoLebar + celah + lebarTeksKop
				if lebarBlok > lebarKop {
					if kurang := lebarBlok - lebarKop; kurang < celah {
						celah -= kurang
					} else {
						celah = 0
					}
					lebarBlok = t.LogoLebar + celah + lebarTeksKop
				}
				kiri := xKop + (lebarKop-lebarBlok)/2
				if kiri < 5 {
					kiri = 5
				}
				xLogo = kiri
				xTeksKop = kiri + t.LogoLebar + celah
			} else {
				// Tulisan tetap rata tengah, logo menempel di kirinya
				xLogo = xTeksKop - t.JarakLogoKeKop - t.LogoLebar
				if xLogo < 5 {
					xLogo = 5
				}
			}
		}

		// Baris-baris kop ditulis di dalam area tulisan hasil hitungan di atas.
		// Kalau melewati tepi kanan, blok digeser ke kiri — lebarnya TIDAK
		// dipotong, supaya nama instansi tetap satu baris.
		xKop, lebarKop = xTeksKop, lebarTeksKop
		if xKop+lebarKop > 205 {
			geser := xKop + lebarKop - 205
			xKop -= geser
			xLogo -= geser
			if xLogo < 5 {
				xLogo = 5
			}
		}
		
		if t.TampilkanLogo && berkasLogo != "" {
			pdf.ImageOptions(berkasLogo, xLogo, t.LogoY, t.LogoLebar, 0, false,
				fpdf.ImageOptions{ImageType: "", ReadDpi: true}, 0, "")
			if pdf.Err() {
				pdf.ClearError()
			}
			rec.tambah(BlokSurat{
				ID: "logo", Label: "Logo instansi",
				X: xLogo, Y: t.LogoY,
				W: t.LogoLebar, H: tinggiGambarSurat(pdf, berkasLogo, t.LogoLebar),
				SumbuX: "logo_x", SumbuY: "logo_y", SumbuW: "logo_lebar",
			})
		}

		pdf.SetY(t.MarginAtas)
		pdf.SetFont(font, "", t.UkuranFontKop-2)
		pdf.SetX(xKop)
		pdf.CellFormat(lebarKop, 5.5, tpl.NamaPemerintah, "", 1, "C", false, 0, "")

		pdf.SetFont(font, "B", t.UkuranFontKop)
		pdf.SetX(xKop)
		pdf.MultiCell(lebarKop, 6, strings.ToUpper(tpl.NamaInstansi), "", "C", false)

			pdf.SetFont(font, "", t.UkuranFontAlamat)
			for _, baris := range barisAlamat {
			if strings.TrimSpace(baris) == "" {
				continue
			}
			pdf.SetX(xKop)
			pdf.CellFormat(lebarKop, 4.2, baris, "", 1, "C", false, 0, "")
		}

		y := pdf.GetY() + 1.5
		if t.TampilkanGarisKop {
			pdf.SetLineWidth(t.GarisKopTebal)
			pdf.Line(t.KopX, y, t.KopX+t.KopLebar, y)
			pdf.SetLineWidth(0.2)
		}

		rec.tambah(BlokSurat{
			ID: "kop", Label: "Kop surat",
			X: xKop, Y: t.MarginAtas, W: lebarKop, H: y - t.MarginAtas,
			SumbuX: "kop_x", SumbuY: "margin_atas", SumbuW: "kop_lebar",
		})

		// Logo bisa lebih tinggi daripada teks kop, jadi ambil yang terbawah
		if berkasLogo != "" && t.TampilkanLogo {
			if yLogo := t.LogoY + tinggiGambarSurat(pdf, berkasLogo, t.LogoLebar); yLogo > y {
				y = yLogo
			}
		}
		yBawahKop = y

		pdf.SetY(y + t.JarakSetelahKop)
	}

	// ── TEMPAT & TANGGAL (rata kanan, DI BAWAH KOP) ──
	// Posisinya mengikuti alur setelah kop, lalu dijepit supaya tidak pernah
	// naik sejajar dengan kop surat meskipun tanggal_x/tanggal_lebar diubah.
	if t.TampilkanTanggal {
		yTanggal := pdf.GetY()
		if minY := yBawahKop + t.JarakSetelahKop; yTanggal < minY {
			yTanggal = minY
		}

		// Jaga blok tetap di dalam margin kanan kertas
		xTanggal := t.TanggalX
		lebarTanggal := t.TanggalLebar
		if xTanggal+lebarTanggal > 210-t.MarginKanan {
			xTanggal = 210 - t.MarginKanan - lebarTanggal
		}
		if xTanggal < t.MarginKiri {
			xTanggal = t.MarginKiri
		}

		tempatTerbit := nilaiAtau(tpl.TempatTerbit, "Ponorogo")
		teksTanggal := tempatTerbit + ", " + FormatTanggalSurat(d.TanggalTerbit)

		pdf.SetFont(font, "", t.UkuranFontIsi)
		pdf.SetXY(xTanggal, yTanggal)
		// Rata kanan supaya teks menempel ke sisi kanan blok (tidak menggantung
		// di tengah kertas seperti saat rata kiri).
		pdf.CellFormat(lebarTanggal, lh, teksTanggal, "", 1, "R", false, 0, "")

		rec.tambah(BlokSurat{
			ID: "tanggal", Label: "Tempat & tanggal surat",
			X: xTanggal, Y: yTanggal, W: lebarTanggal, H: lh,
			SumbuX: "tanggal_x", SumbuY: "jarak_setelah_kop", SumbuW: "tanggal_lebar",
		})

		pdf.SetXY(t.MarginKiri, yTanggal+lh+t.JarakSetelahTanggal)
	}

	// ── BLOK TUJUAN (Kepada / Yth.) ──
	tulisBaris := func(indent float64, teks string, tebal bool) {
		gaya := ""
		if tebal {
			gaya = "B"
		}
		pdf.SetFont(font, gaya, t.UkuranFontIsi)
		pdf.SetX(t.MarginKiri + indent)
		pdf.MultiCell(lebar-indent, lh, teks, "", "L", false)
	}

	yTujuan := pdf.GetY()
	tulisBaris(0, "Kepada :", false)

	// "Yth." sejajar dengan baris pertama tujuan, baris berikutnya menjorok
	// Setiap Shift+Enter pada isian modal menjadi satu baris tersendiri di sini,
	// jadi admin bisa memotong nama institusi yang panjang sesuai keinginan.
	barisTujuan := make([]string, 0, 8)
	for _, isian := range []string{d.JabatanTujuan, d.UnitTujuan, d.InstitusiTujuan} {
		barisTujuan = append(barisTujuan, barisTeks(isian)...)
	}
	if strings.TrimSpace(d.KotaTujuan) != "" {
		barisTujuan = append(barisTujuan, "di", strings.ToUpper(satuBaris(d.KotaTujuan)))
	}

	pdf.SetFont(font, "", t.UkuranFontIsi)
	lebarLabelYth := t.IndentTujuan
	if w := pdf.GetStringWidth("Yth.") + 2; w > lebarLabelYth {
		lebarLabelYth = w
	}
	if len(barisTujuan) == 0 {
		tulisBaris(0, "Yth.", false)
	}
	for i, baris := range barisTujuan {
		y := pdf.GetY()
		label := ""
		if i == 0 {
			label = "Yth."
		}
		pdf.SetXY(t.MarginKiri, y)
		pdf.CellFormat(lebarLabelYth, lh, label, "", 0, "L", false, 0, "")
		pdf.SetXY(t.MarginKiri+lebarLabelYth, y)
		pdf.MultiCell(lebar-lebarLabelYth, lh, baris, "", "L", false)
	}

	rec.tambah(BlokSurat{
		ID: "tujuan", Label: "Blok tujuan (Kepada/Yth.)",
		X: t.MarginKiri, Y: yTujuan, W: lebar, H: pdf.GetY() - yTujuan,
		SumbuX: "indent_tujuan", SumbuY: "jarak_setelah_tanggal",
	})

	pdf.SetY(pdf.GetY() + t.JarakParagraf)

	// ── JUDUL & NOMOR (setelah blok Yth., seperti surat asli) ──
	yJudul := pdf.GetY()
	judul := strings.ToUpper(nilaiAtau(d.JudulSurat, "SURAT KETERANGAN MAGANG"))
	gayaJudul := ""
	if t.JudulTebal {
		gayaJudul = "B"
	}
	pdf.SetFont(font, gayaJudul, t.UkuranFontJudul)
	pdf.SetX(t.MarginKiri)
	pdf.MultiCell(lebar, lh+0.8, judul, "", "C", false)
	if t.TampilkanGarisJudul {
		lebarJudul := pdf.GetStringWidth(judul)
		if lebarJudul > lebar {
			lebarJudul = lebar
		}
		y := pdf.GetY() - 0.8
		x := t.MarginKiri + (lebar-lebarJudul)/2
		pdf.Line(x, y, x+lebarJudul, y)
	}
	pdf.SetFont(font, "", t.UkuranFontIsi)
	pdf.SetX(t.MarginKiri)
	pdf.CellFormat(lebar, lh, "NOMOR : "+d.NomorSurat, "", 1, "C", false, 0, "")

	rec.tambah(BlokSurat{
		ID: "judul", Label: "Judul & nomor surat",
		X: t.MarginKiri, Y: yJudul, W: lebar, H: pdf.GetY() - yJudul,
		SumbuY: "jarak_setelah_judul",
	})

	pdf.SetY(pdf.GetY() + t.JarakSetelahJudul)

	// ── PARAGRAF PEMBUKA ──
	pembuka := bersihkanTeksSurat(isiPlaceholderSurat(tpl.ParagrafPembuka, nilai))
	if pembuka != "" {
		yPembuka := pdf.GetY()
		pdf.SetFont(font, "", t.UkuranFontIsi)
		for _, par := range strings.Split(pembuka, "\n\n") {
			// Redaksi mendukung penanda gaya **tebal**, *miring*, __garis bawah__
			TulisParagrafKaya(pdf, font, par, t.MarginKiri, lebar, lh, t.UkuranFontIsi, true)
			pdf.SetY(pdf.GetY() + t.JarakParagraf)
		}
		// Tanpa sumbu: posisinya mengikuti alur teks, hanya untuk penanda visual
		rec.tambah(BlokSurat{
			ID: "pembuka", Label: "Paragraf pembuka",
			X: t.MarginKiri, Y: yPembuka, W: lebar, H: pdf.GetY() - yPembuka,
		})
	}

	// ── DATA PESERTA ──
	type barisData struct{ kunci, label, isi string }
	semua := []barisData{
		{"nama", "Nama", d.Nama},
		{"induk", nilaiAtau(d.LabelInduk, "Nomor Induk"), d.NomorInduk},
		{"bidang", "Bidang/Unit Kerja", d.Bidang},
		{"periode", "Waktu Pelaksanaan", FormatTanggalSurat(d.Mulai) + " s.d. " + FormatTanggalSurat(d.Selesai)},
	}
	yData := pdf.GetY()
	pdf.SetFont(font, "", t.UkuranFontIsi)
	for _, b := range semua {
		if !t.AktifBarisData(b.kunci) || strings.TrimSpace(b.isi) == "" {
			continue
		}
		yAwal := pdf.GetY()
		pdf.SetX(t.MarginKiri + t.IndentData)
		pdf.CellFormat(t.LebarLabelData, lh, b.label, "", 0, "L", false, 0, "")
		pdf.CellFormat(4, lh, ":", "", 0, "L", false, 0, "")
		xIsi := t.MarginKiri + t.IndentData + t.LebarLabelData + 4
		pdf.SetXY(xIsi, yAwal)
		pdf.MultiCell(210-t.MarginKanan-xIsi, lh, b.isi, "", "L", false)
	}

	if pdf.GetY() > yData {
		xData := t.MarginKiri + t.IndentData
		rec.tambah(BlokSurat{
			ID: "data_peserta", Label: "Data peserta",
			X: xData, Y: yData, W: 210 - t.MarginKanan - xData, H: pdf.GetY() - yData,
			SumbuX: "indent_data", SumbuW: "lebar_label_data",
		})
	}

	pdf.SetY(pdf.GetY() + t.JarakParagraf)

	// ── PARAGRAF PENUTUP & SALAM ──
	yPenutup := pdf.GetY()
	for _, teks := range []string{tpl.ParagrafPenutup, tpl.ParagrafSalam} {
		isi := bersihkanTeksSurat(isiPlaceholderSurat(teks, nilai))
		if isi == "" {
			continue
		}
		pdf.SetFont(font, "", t.UkuranFontIsi)
		for _, par := range strings.Split(isi, "\n\n") {
			TulisParagrafKaya(pdf, font, par, t.MarginKiri, lebar, lh, t.UkuranFontIsi, true)
			pdf.SetY(pdf.GetY() + t.JarakParagraf)
		}
	}
	if pdf.GetY() > yPenutup {
		rec.tambah(BlokSurat{
			ID: "penutup", Label: "Paragraf penutup & salam",
			X: t.MarginKiri, Y: yPenutup, W: lebar, H: pdf.GetY() - yPenutup,
		})
	}
	pdf.SetY(pdf.GetY() + t.JarakSetelahIsi)

	// ── BLOK TANDA TANGAN ──
	// Tempat & tanggal TIDAK ditulis di sini lagi; sudah pindah ke kanan atas
	// (di bawah kop), mengikuti contoh surat asli.
	yBlokTtd := pdf.GetY()
	pdf.SetFont(font, "", t.UkuranFontIsi)
	pdf.SetX(t.TtdX)
	pdf.MultiCell(t.TtdLebar, lh, nilaiAtau(d.JabatanTtd, tpl.JabatanPenandatangan), "", "L", false)

	yTtd := pdf.GetY()

	rec.tambah(BlokSurat{
		ID: "ttd", Label: "Blok tanda tangan",
		X: t.TtdX, Y: yBlokTtd, W: t.TtdLebar, H: yTtd - yBlokTtd,
		SumbuX: "ttd_x", SumbuY: "jarak_setelah_isi", SumbuW: "ttd_lebar",
	})

	if fileAdaSurat(tpl.FileStempel) && t.TampilkanStempel {
		pdf.ImageOptions(tpl.FileStempel,
			t.TtdX+t.StempelGeserX, yTtd+t.StempelGeserY, t.StempelLebar, 0, false,
			fpdf.ImageOptions{ImageType: "", ReadDpi: true}, 0, "")
		if pdf.Err() {
			pdf.ClearError()
		}
		rec.tambah(BlokSurat{
			ID: "stempel", Label: "Stempel",
			X: t.TtdX + t.StempelGeserX, Y: yTtd + t.StempelGeserY,
			W: t.StempelLebar, H: tinggiGambarSurat(pdf, tpl.FileStempel, t.StempelLebar),
			SumbuX: "stempel_geser_x", SumbuY: "stempel_geser_y", SumbuW: "stempel_lebar",
		})
	}
	if fileAdaSurat(tpl.FileTtd) && t.TampilkanTtd {
		pdf.ImageOptions(tpl.FileTtd,
			t.TtdX+t.TtdGambarGeserX, yTtd+t.TtdGambarGeserY, t.TtdGambarLebar, 0, false,
			fpdf.ImageOptions{ImageType: "", ReadDpi: true}, 0, "")
		if pdf.Err() {
			pdf.ClearError()
		}
		rec.tambah(BlokSurat{
			ID: "gambar_ttd", Label: "Gambar tanda tangan",
			X: t.TtdX + t.TtdGambarGeserX, Y: yTtd + t.TtdGambarGeserY,
			W: t.TtdGambarLebar, H: tinggiGambarSurat(pdf, tpl.FileTtd, t.TtdGambarLebar),
			SumbuX: "ttd_gambar_geser_x", SumbuY: "ttd_gambar_geser_y", SumbuW: "ttd_gambar_lebar",
		})
	}

	pdf.SetY(yTtd + t.RuangTtd)
	yNama := pdf.GetY()
	namaTtd := nilaiAtau(d.NamaTtd, tpl.NamaPenandatangan)
	// Nama penandatangan ditulis biasa (tidak tebal), mengikuti surat asli.
	// Garis bawah hanya muncul bila saklar "Garis bawah nama" dinyalakan.
	pdf.SetFont(font, "", t.UkuranFontIsi)
	pdf.SetX(t.TtdX)
	pdf.MultiCell(t.TtdLebar, lh, namaTtd, "", "L", false)
	if t.GarisBawahNama {
		w := pdf.GetStringWidth(namaTtd)
		if w > t.TtdLebar {
			w = t.TtdLebar
		}
		y := pdf.GetY() - 0.8
		pdf.Line(t.TtdX, y, t.TtdX+w, y)
	}

	pdf.SetFont(font, "", t.UkuranFontIsi)
	if s := nilaiAtau(d.PangkatTtd, tpl.PangkatPenandatangan); strings.TrimSpace(s) != "" {
		pdf.SetX(t.TtdX)
		pdf.MultiCell(t.TtdLebar, lh, s, "", "L", false)
	}
	if s := strings.TrimSpace(nilaiAtau(d.NipTtd, tpl.NipPenandatangan)); s != "" {
		// Tambahkan awalan "NIP." bila admin hanya mengisi angkanya saja.
		// Kalau sudah ditulis "NIP 1967..." atau "NIP. 1967...", tidak digandakan.
		atas := strings.ToUpper(s)
		switch {
		case strings.HasPrefix(atas, "NIP."):
			// biarkan apa adanya
		case strings.HasPrefix(atas, "NIP"):
			s = "NIP. " + strings.TrimSpace(s[3:])
		default:
			s = "NIP. " + s
		}
		pdf.SetX(t.TtdX)
		pdf.MultiCell(t.TtdLebar, lh, s, "", "L", false)
	}

	rec.tambah(BlokSurat{
		ID: "nama_ttd", Label: "Nama, pangkat & NIP",
		X: t.TtdX, Y: yNama, W: t.TtdLebar, H: pdf.GetY() - yNama,
		SumbuY: "ruang_ttd",
	})

	if rec != nil && rec.aktif {
		return pdf, rec.hasil()
	}
	return pdf, PetaSurat{Lebar: 210, Tinggi: 297}
}

func gabungBaris(a, b string) string {
	a, b = strings.TrimSpace(a), strings.TrimSpace(b)
	switch {
	case a != "" && b != "":
		return a + ", " + b
	case a != "":
		return a
	default:
		return b
	}
}

// GenerateSuratPenerimaanPDF menyimpan surat ke uploads/surat-penerimaan
// dan mengembalikan path relatifnya.
func GenerateSuratPenerimaanPDF(s *models.SuratPenerimaan, tpl models.TemplateSurat) (string, error) {
	pdf := BangunSuratPDF(DataSuratDariModel(s), tpl)
	if pdf.Err() {
		return "", fmt.Errorf("gagal menyusun PDF: %w", pdf.Error())
	}

	dir := filepath.Join("uploads", "surat-penerimaan")
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return "", err
	}
	nama := fmt.Sprintf("surat-%d-%d.pdf", s.ID, time.Now().UnixNano())
	path := filepath.Join(dir, nama)
	if err := pdf.OutputFileAndClose(path); err != nil {
		return "", err
	}
	return strings.ReplaceAll(path, "\\", "/"), nil
}

// SuratPDFBytes membangun PDF surat langsung di memori tanpa menulis file
// ke folder uploads. Dipakai tombol "Pratinjau Perubahan" di modal admin.
func SuratPDFBytes(d DataSurat, tpl models.TemplateSurat) ([]byte, error) {
	pdf := BangunSuratPDF(d, tpl)
	if pdf.Err() {
		return nil, pdf.Error()
	}
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// DataContohSurat menyusun data dummy untuk pratinjau template.
// Dipisah dari PratinjauSuratPDF supaya peta blok memakai data yang sama
// persis, sehingga koordinatnya cocok dengan PDF yang ditampilkan.
func DataContohSurat(tpl models.TemplateSurat, kategori string) DataSurat {
	const polaTgl = "2006-01-02"
	mulai := time.Now()
	selesai := mulai.AddDate(0, 3, 0)
	tglPengantar := mulai.AddDate(0, 0, -7)

	label, induk, judul, jenis := "NPM", "22082010246", tpl.JudulMahasiswa, tpl.JenisMagangMhs
	if strings.EqualFold(kategori, "siswa") {
		label, induk, judul, jenis = "NISN", "0051234567", tpl.JudulSiswa, tpl.JenisMagangSis
	}

	return DataSurat{
		NomorSurat:            "400.14.5.4/KH/0000/405.18/" + fmt.Sprint(mulai.Year()),
		TanggalTerbit:         mulai.Format(polaTgl),
		JabatanTujuan:         "Wakil Dekan I",
		UnitTujuan:            "Fakultas Ilmu Komputer",
		InstitusiTujuan:       "Universitas Contoh Indonesia",
		KotaTujuan:            "Surabaya",
		NomorSuratPengantar:   "530/UN00.0/PJ/" + fmt.Sprint(mulai.Year()),
		TanggalSuratPengantar: tglPengantar.Format(polaTgl),
		Nama:                  "Nama Peserta Contoh",
		NomorInduk:            induk,
		LabelInduk:            label,
		Kategori:              kategori,
		Bidang:                "Aplikasi dan Informatika",
		Mulai:                 mulai.Format(polaTgl),
		Selesai:               selesai.Format(polaTgl),
		JudulSurat:            judul,
		JenisMagang:           jenis,
		JabatanTtd:            tpl.JabatanPenandatangan,
		NamaTtd:               tpl.NamaPenandatangan,
		PangkatTtd:            tpl.PangkatPenandatangan,
		NipTtd:                tpl.NipPenandatangan,
	}
}

// PratinjauSuratPDF membuat PDF contoh (data dummy) tanpa menyimpan file.
func PratinjauSuratPDF(tpl models.TemplateSurat, kategori string) ([]byte, error) {
	pdf := BangunSuratPDF(DataContohSurat(tpl, kategori), tpl)
	if pdf.Err() {
		return nil, pdf.Error()
	}
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// PetaSuratPratinjau menghitung kotak (mm) semua bagian surat pada
// pratinjau, dipakai lapisan geser di halaman admin.
func PetaSuratPratinjau(tpl models.TemplateSurat, kategori string) (PetaSurat, error) {
	rec := &perekamBlok{aktif: true}
	pdf, peta := bangunSuratPDF(DataContohSurat(tpl, kategori), tpl, rec)
	if pdf.Err() {
		return PetaSurat{}, pdf.Error()
	}
	return peta, nil
}