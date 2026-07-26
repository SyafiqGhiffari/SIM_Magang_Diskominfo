package utils

import (
	"time"

	"sim-magang-backend/models"

	"gorm.io/gorm"
)

// Semua perhitungan presensi memakai zona waktu WIB (Asia/Jakarta) agar batas
// "ganti hari" tidak melenceng walau server berjalan di UTC.
var lokasiWIB *time.Location

func WIB() *time.Location {
	if lokasiWIB == nil {
		loc, err := time.LoadLocation("Asia/Jakarta")
		if err != nil {
			loc = time.FixedZone("WIB", 7*3600)
		}
		lokasiWIB = loc
	}
	return lokasiWIB
}

func SekarangWIB() time.Time { return time.Now().In(WIB()) }
func TanggalHariIni() string { return SekarangWIB().Format("2006-01-02") }
func JamSekarang() string    { return SekarangWIB().Format("15:04") }
func TanggalKemarin() string { return SekarangWIB().AddDate(0, 0, -1).Format("2006-01-02") }
func ParseTanggal(s string) (time.Time, error) {
	return time.ParseInLocation("2006-01-02", s, WIB())
}

var namaHari = map[time.Weekday]string{
	time.Monday:    "senin",
	time.Tuesday:   "selasa",
	time.Wednesday: "rabu",
	time.Thursday:  "kamis",
	time.Friday:    "jumat",
	time.Saturday:  "sabtu",
	time.Sunday:    "minggu",
}

// KalenderKerja adalah snapshot pengaturan jam kerja + hari libur.
// Dimuat sekali lalu dipakai berulang agar tidak query per tanggal.
type KalenderKerja struct {
	JamKerja map[string]models.JamKerja  // key: "senin" ... "jumat"
	Libur    map[string]models.HariLibur // key: "YYYY-MM-DD"
}

func MuatKalenderKerja(db *gorm.DB) (*KalenderKerja, error) {
	var jamKerja []models.JamKerja
	if err := db.Find(&jamKerja).Error; err != nil {
		return nil, err
	}

	var libur []models.HariLibur
	if err := db.Find(&libur).Error; err != nil {
		return nil, err
	}

	kal := &KalenderKerja{
		JamKerja: make(map[string]models.JamKerja, len(jamKerja)),
		Libur:    make(map[string]models.HariLibur, len(libur)),
	}
	for _, jk := range jamKerja {
		kal.JamKerja[jk.Hari] = jk
	}
	for _, hl := range libur {
		kal.Libur[hl.Tanggal] = hl
	}
	return kal, nil
}

// InfoHari menjelaskan apakah sebuah tanggal wajib presensi atau tidak.
type InfoHari struct {
	Tanggal   string
	Hari      string
	HariKerja bool
	Alasan    string // "akhir pekan", "hari libur: ...", "diliburkan admin"
	JamKerja  models.JamKerja
}

// CekHari mengembalikan status hari kerja efektif untuk sebuah tanggal.
func (k *KalenderKerja) CekHari(tanggal string) InfoHari {
	info := InfoHari{Tanggal: tanggal}

	t, err := ParseTanggal(tanggal)
	if err != nil {
		info.Alasan = "format tanggal tidak valid"
		return info
	}
	info.Hari = namaHari[t.Weekday()]

	// Sabtu & Minggu otomatis libur
	if t.Weekday() == time.Saturday || t.Weekday() == time.Sunday {
		info.Alasan = "akhir pekan"
		return info
	}

	// Hari libur nasional / manual
	if hl, ok := k.Libur[tanggal]; ok {
		info.Alasan = "hari libur: " + hl.Nama
		return info
	}

	jk, ok := k.JamKerja[info.Hari]
	if !ok {
		info.Alasan = "jam kerja belum diatur"
		return info
	}
	if !jk.IsAktif {
		info.Alasan = "diliburkan admin"
		return info
	}

	info.HariKerja = true
	info.JamKerja = jk
	return info
}

// DaftarHariKerja mengembalikan seluruh tanggal hari kerja efektif dalam rentang
// (inklusif). Dipakai untuk rekap & penutupan hari yang terlewat.
func (k *KalenderKerja) DaftarHariKerja(dari, sampai string) []string {
	awal, err1 := ParseTanggal(dari)
	akhir, err2 := ParseTanggal(sampai)
	if err1 != nil || err2 != nil || akhir.Before(awal) {
		return nil
	}

	var hasil []string
	for t := awal; !t.After(akhir); t = t.AddDate(0, 0, 1) {
		tgl := t.Format("2006-01-02")
		if k.CekHari(tgl).HariKerja {
			hasil = append(hasil, tgl)
		}
	}
	return hasil
}

// keMenit mengubah "HH:MM" menjadi jumlah menit sejak 00:00.
func keMenit(jam string) int {
	t, err := time.Parse("15:04", jam)
	if err != nil {
		return -1
	}
	return t.Hour()*60 + t.Minute()
}

// HasilAbsenMasuk adalah hasil perhitungan status saat peserta absen masuk.
type HasilAbsenMasuk struct {
	Status         string // "hadir" atau "terlambat"
	MenitTerlambat int
	LupaPresensi   bool // absen setelah jam pulang
	Keterangan     string
}

// HitungStatusMasuk menentukan status presensi dari jam absen masuk.
// Presensi TIDAK ditutup saat jam pulang: peserta yang baru absen malam hari
// tetap diterima, tetapi otomatis tercatat "terlambat".
func (k *KalenderKerja) HitungStatusMasuk(tanggal, jamMasuk string) HasilAbsenMasuk {
	info := k.CekHari(tanggal)
	if !info.HariKerja {
		return HasilAbsenMasuk{Status: "hadir", Keterangan: "Absen di luar hari kerja (" + info.Alasan + ")"}
	}

	masuk := keMenit(jamMasuk)
	jadwalMasuk := keMenit(info.JamKerja.JamMasuk)
	jadwalPulang := keMenit(info.JamKerja.JamPulang)
	if masuk < 0 || jadwalMasuk < 0 {
		return HasilAbsenMasuk{Status: "hadir"}
	}

	batas := jadwalMasuk + info.JamKerja.ToleransiTerlambat
	if masuk <= batas {
		return HasilAbsenMasuk{Status: "hadir"}
	}

	hasil := HasilAbsenMasuk{
		Status:         "terlambat",
		MenitTerlambat: masuk - jadwalMasuk,
	}
	if jadwalPulang > 0 && masuk > jadwalPulang {
		hasil.LupaPresensi = true
		hasil.Keterangan = "Presensi dilakukan setelah jam pulang (lupa presensi)"
	}
	return hasil
}