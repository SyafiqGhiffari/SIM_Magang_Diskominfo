package services

import (
	"strings"

	"github.com/go-pdf/fpdf"
)

// ── TEKS KAYA (RICH TEXT) UNTUK REDAKSI SURAT ──────────────────────────────
//
// Admin menulis redaksi surat di textarea biasa, tetapi bisa memberi gaya
// seperti di Word memakai penanda ringkas:
//
//	**tebal**        -> tebal
//	*miring*         -> miring
//	__garis bawah__  -> garis bawah
//
// Penanda bisa ditumpuk, misal **__*penting*__** menjadi tebal + garis bawah
// + miring. Penanda yang tidak ditutup dianggap teks biasa sehingga redaksi
// lama (tanpa penanda) tetap tercetak sama persis.

// potonganKaya adalah sepotong teks dengan gayanya.
type potonganKaya struct {
	Teks       string
	Tebal      bool
	Miring     bool
	GarisBawah bool
}

// kataKaya adalah satu kata (tanpa spasi) beserta gayanya, dipakai saat
// membungkus baris dan meratakan teks.
type kataKaya struct {
	Teks       string
	Tebal      bool
	Miring     bool
	GarisBawah bool
	SpasiDepan bool
}

func (k kataKaya) gaya() string {
	g := ""
	if k.Tebal {
		g += "B"
	}
	if k.Miring {
		g += "I"
	}
	if k.GarisBawah {
		g += "U"
	}
	return g
}

// penandaKaya diurutkan dari yang terpanjang supaya "**" tidak salah dibaca
// sebagai dua kali "*".
var penandaKaya = []struct {
	tanda string
	jenis string // "tebal" | "miring" | "garis_bawah"
}{
	{"**", "tebal"},
	{"__", "garis_bawah"},
	{"*", "miring"},
}

// pasanganTertutup memastikan penanda pembuka punya penutupnya. Kalau tidak
// ada penutup, penanda dibiarkan sebagai teks biasa.
func pasanganTertutup(s string, mulai int, tanda string) bool {
	sisa := s[mulai+len(tanda):]
	if tanda == "*" {
		// Untuk "*" tunggal, penutupnya tidak boleh berupa "**"
		for i := 0; i < len(sisa); i++ {
			if sisa[i] != '*' {
				continue
			}
			if i+1 < len(sisa) && sisa[i+1] == '*' {
				i++
				continue
			}
			return true
		}
		return false
	}
	return strings.Contains(sisa, tanda)
}

// UraiTeksKaya memecah teks berpenanda menjadi potongan-potongan bergaya.
func UraiTeksKaya(teks string) []potonganKaya {
	var hasil []potonganKaya
	var buf strings.Builder
	tebal, miring, garisBawah := false, false, false

	simpan := func() {
		if buf.Len() == 0 {
			return
		}
		hasil = append(hasil, potonganKaya{
			Teks: buf.String(), Tebal: tebal, Miring: miring, GarisBawah: garisBawah,
		})
		buf.Reset()
	}

	for i := 0; i < len(teks); {
		ketemu := false
		for _, p := range penandaKaya {
			if !strings.HasPrefix(teks[i:], p.tanda) {
				continue
			}
			aktif := (p.jenis == "tebal" && tebal) ||
				(p.jenis == "miring" && miring) ||
				(p.jenis == "garis_bawah" && garisBawah)
			if !aktif && !pasanganTertutup(teks, i, p.tanda) {
				break
			}
			simpan()
			switch p.jenis {
			case "tebal":
				tebal = !tebal
			case "miring":
				miring = !miring
			case "garis_bawah":
				garisBawah = !garisBawah
			}
			i += len(p.tanda)
			ketemu = true
			break
		}
		if ketemu {
			continue
		}
		buf.WriteByte(teks[i])
		i++
	}
	simpan()
	return hasil
}

// HapusPenandaKaya membuang penanda gaya, dipakai bila teks perlu tampil
// polos (misalnya pada ekspor CSV/Excel).
func HapusPenandaKaya(teks string) string {
	var b strings.Builder
	for _, p := range UraiTeksKaya(teks) {
		b.WriteString(p.Teks)
	}
	return b.String()
}

// kataDariPotongan memecah potongan bergaya menjadi daftar kata.
func kataDariPotongan(potongan []potonganKaya) []kataKaya {
	var kata []kataKaya
	spasiTertunda := false

	for _, p := range potongan {
		bagian := strings.Split(p.Teks, " ")
		for idx, b := range bagian {
			if idx > 0 {
				spasiTertunda = true
			}
			if b == "" {
				continue
			}
			kata = append(kata, kataKaya{
				Teks: b, Tebal: p.Tebal, Miring: p.Miring, GarisBawah: p.GarisBawah,
				SpasiDepan: spasiTertunda && len(kata) > 0,
			})
			spasiTertunda = false
		}
	}
	return kata
}

// TulisParagrafKaya mencetak satu paragraf berpenanda gaya pada posisi Y
// sekarang, dengan pembungkusan baris sendiri supaya gaya bisa berubah di
// tengah baris. Rata kanan-kiri dipertahankan seperti MultiCell "J":
// semua baris diratakan kecuali baris terakhir.
func TulisParagrafKaya(pdf *fpdf.Fpdf, font, teks string, x, lebar, lh, ukuran float64, ratakan bool) {
	teks = strings.TrimSpace(teks)
	if teks == "" {
		return
	}

	kata := kataDariPotongan(UraiTeksKaya(teks))
	if len(kata) == 0 {
		return
	}

	lebarKata := func(k kataKaya) float64 {
		pdf.SetFont(font, k.gaya(), ukuran)
		return pdf.GetStringWidth(k.Teks)
	}
	pdf.SetFont(font, "", ukuran)
	lebarSpasi := pdf.GetStringWidth(" ")

	tulisBaris := func(baris []kataKaya, spasi float64) {
		y := pdf.GetY()
		pdf.SetXY(x, y)
		for i, k := range baris {
			if i > 0 {
				pdf.SetX(pdf.GetX() + spasi)
			}
			pdf.SetFont(font, k.gaya(), ukuran)
			w := pdf.GetStringWidth(k.Teks)
			pdf.CellFormat(w, lh, k.Teks, "", 0, "L", false, 0, "")
		}
		pdf.SetXY(x, y+lh)
	}

	var baris []kataKaya
	lebarIsi := 0.0

	for _, k := range kata {
		w := lebarKata(k)
		tambahan := w
		if len(baris) > 0 {
			tambahan += lebarSpasi
		}
		if len(baris) > 0 && lebarIsi+tambahan > lebar+0.01 {
			spasi := lebarSpasi
			if ratakan && len(baris) > 1 {
				spasi = (lebar - lebarIsi + lebarSpasi*float64(len(baris)-1)) / float64(len(baris)-1)
				if spasi < lebarSpasi {
					spasi = lebarSpasi
				}
			}
			tulisBaris(baris, spasi)
			baris = nil
			lebarIsi = 0
			tambahan = w
		}
		baris = append(baris, k)
		lebarIsi += tambahan
	}

	if len(baris) > 0 {
		tulisBaris(baris, lebarSpasi)
	}

	pdf.SetFont(font, "", ukuran)
}