package services

// BlokSurat adalah satu bagian surat beserta kotak pembatasnya dalam mm,
// plus nama field TataLetakSurat yang harus berubah ketika kotak itu
// digeser pada pratinjau interaktif di halaman admin.
//
// SumbuX/SumbuY/SumbuW kosong berarti bagian itu tidak bisa digeser pada
// sumbu tersebut (posisinya mengikuti alur teks di atasnya).
type BlokSurat struct {
	ID    string  `json:"id"`
	Label string  `json:"label"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	W     float64 `json:"w"`
	H     float64 `json:"h"`

	SumbuX string `json:"sumbu_x"`
	SumbuY string `json:"sumbu_y"`
	SumbuW string `json:"sumbu_w"`

	// Arah +1 berarti geser ke kanan/bawah menambah nilai field,
	// -1 berarti menguranginya.
	ArahX float64 `json:"arah_x"`
	ArahY float64 `json:"arah_y"`
}

// PetaSurat adalah kumpulan kotak semua bagian surat pada halaman pertama.
type PetaSurat struct {
	Lebar  float64     `json:"lebar"`  // 210 mm (A4 potret)
	Tinggi float64     `json:"tinggi"` // 297 mm
	Blok   []BlokSurat `json:"blok"`
}

// perekamBlok dipakai BangunSuratPDF untuk mencatat posisi tiap bagian
// saat surat digambar. Saat aktif == false, semua pencatatan diabaikan
// sehingga pembuatan PDF biasa tidak terbebani sama sekali.
type perekamBlok struct {
	aktif bool
	blok  []BlokSurat
}

func (p *perekamBlok) tambah(b BlokSurat) {
	if p == nil || !p.aktif {
		return
	}
	if b.ArahX == 0 {
		b.ArahX = 1
	}
	if b.ArahY == 0 {
		b.ArahY = 1
	}
	if b.W < 0 {
		b.W = 0
	}
	if b.H < 0 {
		b.H = 0
	}
	p.blok = append(p.blok, b)
}

func (p *perekamBlok) hasil() PetaSurat {
	return PetaSurat{Lebar: 210, Tinggi: 297, Blok: p.blok}
}