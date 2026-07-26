package controllers

import (
	"net/http"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// ==================== REKAP PRESENSI (ADMIN — READ ONLY) ====================

// RekapPeserta adalah satu baris rekap kehadiran seorang peserta.
type RekapPeserta struct {
	PesertaID           uint    `json:"peserta_id"`
	Nama                string  `json:"nama"`
	Institusi           string  `json:"institusi"`
	Bidang              string  `json:"bidang"`
	Kategori            string  `json:"kategori_pendaftar"`
	FotoProfil          string  `json:"foto_profil"`  
	FotoPeserta         string  `json:"foto_peserta"`
	TanggalMulai        string  `json:"tanggal_mulai"`   
	TanggalSelesai      string  `json:"tanggal_selesai"`  
	Hadir               int     `json:"hadir"`
	Terlambat           int     `json:"terlambat"`
	Izin                int     `json:"izin"`
	Sakit               int     `json:"sakit"`
	Alfa                int     `json:"alfa"`
	TotalMenitTerlambat int     `json:"total_menit_terlambat"`
	HariKerja           int     `json:"hari_kerja"`
	PersentaseKehadiran float64 `json:"persentase_kehadiran"`
}

// rentangBulan mengubah "YYYY-MM" menjadi tanggal awal & akhir bulan.
// Jika kosong, memakai bulan berjalan (WIB).
func rentangBulan(bulan string) (string, string, string) {
	loc := utils.WIB()
	now := utils.SekarangWIB()
	awal := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)

	if len(bulan) == 7 {
		if t, err := time.ParseInLocation("2006-01", bulan, loc); err == nil {
			awal = t
		}
	}
	akhir := awal.AddDate(0, 1, -1)
	return awal.Format("2006-01-02"), akhir.Format("2006-01-02"), awal.Format("2006-01")
}

// GetRekapPresensi — rekap kehadiran seluruh peserta dalam satu bulan.
// Query: ?bulan=YYYY-MM&bidang=..&kategori=..&search=..
func GetRekapPresensi(c *gin.Context) {
	_ = services.PastikanHariTerkunci(config.DB)

	dari, sampai, bulan := rentangBulan(strings.TrimSpace(c.Query("bulan")))

	// Batas akhir rekap tidak melewati hari ini
	if hariIni := utils.TanggalHariIni(); sampai > hariIni {
		sampai = hariIni
	}

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}
	hariKerja := kal.DaftarHariKerja(dari, sampai)

	// Rekap bulan lampau perlu memuat alumni (peserta yang sudah selesai magang)
	// karena mereka punya data presensi pada periode tersebut. Rekap bulan
	// berjalan cukup peserta yang masih aktif magang.
	termasukAlumni := c.Query("termasuk_alumni") == "1" || bulan < utils.TanggalHariIni()[:7]

	var peserta []utils.PesertaPresensi
	if termasukAlumni {
		peserta, err = utils.AmbilPesertaPresensiTermasukAlumni(config.DB)
	} else {
		peserta, err = utils.AmbilPesertaPresensi(config.DB)
	}
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data peserta")
		return
	}

	// Agregasi presensi per peserta
	type agregat struct {
		PesertaID           uint
		Hadir               int
		Terlambat           int
		Izin                int
		Sakit               int
		Alfa                int
		TotalMenitTerlambat int
	}
	var agg []agregat
	if err := config.DB.Table("presensis").
		Select(`peserta_id,
			SUM(status = 'hadir')      AS hadir,
			SUM(status = 'terlambat')  AS terlambat,
			SUM(status = 'izin')       AS izin,
			SUM(status = 'sakit')      AS sakit,
			SUM(status = 'alfa')       AS alfa,
			COALESCE(SUM(menit_terlambat), 0) AS total_menit_terlambat`).
		Where("tanggal >= ? AND tanggal <= ?", dari, sampai).
		Group("peserta_id").
		Scan(&agg).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal merekap data presensi")
		return
	}
	aggMap := make(map[uint]agregat, len(agg))
	for _, a := range agg {
		aggMap[a.PesertaID] = a
	}

	filterBidang := map[string]bool{}
	if raw := strings.TrimSpace(c.Query("bidang")); raw != "" {
		for _, v := range strings.Split(raw, ",") {
			filterBidang[strings.TrimSpace(v)] = true
		}
	}
	filterKategori := map[string]bool{}
	if raw := strings.TrimSpace(c.Query("kategori")); raw != "" {
		for _, v := range strings.Split(raw, ",") {
			filterKategori[strings.TrimSpace(v)] = true
		}
	}
	search := strings.ToLower(strings.TrimSpace(c.Query("search")))

	data := make([]RekapPeserta, 0, len(peserta))
	totalPersen := 0.0
	bermasalah := 0
	pesertaDinilai := 0

	for _, p := range peserta {
		if len(filterBidang) > 0 && !filterBidang[p.Bidang] {
			continue
		}
		if len(filterKategori) > 0 && !filterKategori[p.Kategori] {
			continue
		}
		if search != "" &&
			!strings.Contains(strings.ToLower(p.Nama), search) &&
			!strings.Contains(strings.ToLower(p.Institusi), search) &&
			!strings.Contains(strings.ToLower(p.Bidang), search) {
			continue
		}

		// Hari kerja efektif peserta ini (dibatasi periode magangnya)
		wajib := 0
		for _, tgl := range hariKerja {
			if p.WajibPresensiPada(tgl) {
				wajib++
			}
		}

		a := aggMap[p.PesertaID]

		// Lewati peserta yang periode magangnya tidak bersinggungan dengan bulan
		// ini (wajib presensi 0 hari) DAN tidak punya riwayat presensi apa pun
		// pada rentang tersebut. Contoh: peserta mulai 7 Juli tidak boleh muncul
		// di rekap bulan Juni.
		adaRiwayat := a.Hadir+a.Terlambat+a.Izin+a.Sakit+a.Alfa > 0
		if wajib == 0 && !adaRiwayat {
			continue
		}

		// Periode magang peserta ini, dipakai frontend (tampilan matriks) untuk
		// menonaktifkan sel di luar masa magang.
		mulaiPeserta, selesaiPeserta := "", ""
		if p.TanggalMulai != nil {
			mulaiPeserta = normalTanggal(*p.TanggalMulai)
		}
		if p.TanggalSelesai != nil {
			selesaiPeserta = normalTanggal(*p.TanggalSelesai)
		}

		row := RekapPeserta{
			PesertaID:           p.PesertaID,
			Nama:                p.Nama,
			Institusi:           p.Institusi,
			Bidang:              p.Bidang,
			Kategori:            p.Kategori,
			FotoProfil:          p.FotoProfil,  
			FotoPeserta:         p.FotoPeserta, 
			TanggalMulai:        mulaiPeserta,
			TanggalSelesai:      selesaiPeserta,
			Hadir:               a.Hadir,
			Terlambat:           a.Terlambat,
			Izin:                a.Izin,
			Sakit:               a.Sakit,
			Alfa:                a.Alfa,
			TotalMenitTerlambat: a.TotalMenitTerlambat,
			HariKerja:           wajib,
		}
		if wajib > 0 {
			hadirEfektif := a.Hadir + a.Terlambat
			row.PersentaseKehadiran = float64(int((float64(hadirEfektif)/float64(wajib))*1000+0.5)) / 10
		}
		// Hanya peserta yang benar-benar punya kewajiban presensi bulan ini
		// yang ikut dihitung dalam rata-rata & jumlah peserta bermasalah.
		if wajib > 0 {
			totalPersen += row.PersentaseKehadiran
			pesertaDinilai++
			if row.PersentaseKehadiran < 75 {
				bermasalah++
			}
		}
		data = append(data, row)
	}

	rataRata := 0.0
	if pesertaDinilai > 0 {
		rataRata = float64(int((totalPersen/float64(pesertaDinilai))*10+0.5)) / 10
	}

	utils.SuccessResponse(c, http.StatusOK, "Rekap presensi berhasil diambil", gin.H{
		"periode": gin.H{
			"bulan":              bulan,
			"dari":               dari,
			"sampai":             sampai,
			"hari_kerja_efektif": len(hariKerja),
			"tanggal_hari_kerja": hariKerja,
		},
		"ringkasan": gin.H{
			"total_peserta":      len(data),
			"rata_kehadiran":     rataRata,
			"peserta_bermasalah": bermasalah,
		},
		"data": data,
	})
}

// GetRekapPeserta — detail rekap satu peserta: ringkasan + riwayat harian
// (termasuk hari kerja yang belum terisi presensi).
func GetRekapPeserta(c *gin.Context) {
	_ = services.PastikanHariTerkunci(config.DB)

	pesertaID := c.Param("peserta_id")
	dari, sampai, bulan := rentangBulan(strings.TrimSpace(c.Query("bulan")))
	if hariIni := utils.TanggalHariIni(); sampai > hariIni {
		sampai = hariIni
	}

	// Ambil periode magang peserta dari pendaftaran terakhirnya. Riwayat harian
	// tidak boleh menampilkan tanggal sebelum peserta mulai magang atau sesudah
	// magangnya selesai (mis. mulai 7 Juli -> 1-6 Juli tidak ditampilkan).
	var periodeMagang struct {
		TanggalMulai   *string
		TanggalSelesai *string
	}
	config.DB.Table("pendaftaran_magangs").
		Select("tanggal_mulai, tanggal_selesai").
		Where("akun_peserta_id = ?", pesertaID).
		Order("id DESC").
		Limit(1).
		Scan(&periodeMagang)

	mulaiMagang, selesaiMagang := "", ""
	if periodeMagang.TanggalMulai != nil {
		mulaiMagang = normalTanggal(*periodeMagang.TanggalMulai)
	}
	if periodeMagang.TanggalSelesai != nil {
		selesaiMagang = normalTanggal(*periodeMagang.TanggalSelesai)
	}
	if mulaiMagang != "" && mulaiMagang > dari {
		dari = mulaiMagang
	}
	if selesaiMagang != "" && selesaiMagang < sampai {
		sampai = selesaiMagang
	}

	// Periode magang tidak beririsan dengan bulan yang diminta.
	if dari > sampai {
		utils.SuccessResponse(c, http.StatusOK, "Rekap peserta berhasil diambil", gin.H{
			"periode": gin.H{
				"bulan":          bulan,
				"dari":           dari,
				"sampai":         sampai,
				"mulai_magang":   mulaiMagang,
				"selesai_magang": selesaiMagang,
			},
			"riwayat": []any{},
		})
		return
	}

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}

	var rows []PresensiRow
	config.DB.Table("presensis pr").
		Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
		Joins("LEFT JOIN pendaftaran_magangs p ON p.id = pr.pendaftaran_id").
		Joins("LEFT JOIN user_manajemens m ON m.id = p.mentor_id").
		Select(selectPresensiRow).
		Where("pr.peserta_id = ? AND pr.tanggal >= ? AND pr.tanggal <= ?", pesertaID, dari, sampai).
		Order("pr.tanggal asc").
		Scan(&rows)

	presensiByTanggal := make(map[string]PresensiRow, len(rows))
	for _, r := range rows {
		presensiByTanggal[normalTanggal(r.Tanggal)] = r
	}

	type hari struct {
		Tanggal   string       `json:"tanggal"`
		HariKerja bool         `json:"hari_kerja"`
		Alasan    string       `json:"alasan"`
		Status    string       `json:"status"` // "libur" bila bukan hari kerja, "" bila belum terisi
		Presensi  *PresensiRow `json:"presensi"`
	}

	riwayat := make([]hari, 0)
	awal, _ := utils.ParseTanggal(dari)
	akhir, _ := utils.ParseTanggal(sampai)
	for t := awal; !t.After(akhir); t = t.AddDate(0, 0, 1) {
		tgl := t.Format("2006-01-02")
		info := kal.CekHari(tgl)
		h := hari{Tanggal: tgl, HariKerja: info.HariKerja, Alasan: info.Alasan}
		if pr, ok := presensiByTanggal[tgl]; ok {
			p := pr
			h.Presensi = &p
			h.Status = pr.Status
		} else if !info.HariKerja {
			h.Status = "libur"
		}
		riwayat = append(riwayat, h)
	}

	utils.SuccessResponse(c, http.StatusOK, "Rekap peserta berhasil diambil", gin.H{
		"periode": gin.H{
			"bulan":          bulan,
			"dari":           dari,
			"sampai":         sampai,
			"mulai_magang":   mulaiMagang,
			"selesai_magang": selesaiMagang,
		},
		"riwayat": riwayat,
	})
}

// normalTanggal memotong nilai DATETIME dari driver MySQL menjadi "YYYY-MM-DD".
func normalTanggal(s string) string {
	if len(s) >= 10 {
		return s[:10]
	}
	return s
}

// MatriksSel adalah satu sel pada matriks rekap (peserta × tanggal).
// Payload sengaja dibuat seringkas mungkin agar satu bulan penuh untuk
// ratusan peserta tetap ringan dan tidak perlu pagination.
type MatriksSel struct {
	PesertaID uint   `json:"peserta_id"`
	Tanggal   string `json:"tanggal"`
	Status    string `json:"status"`
	Terlambat int    `json:"menit_terlambat"`
}

// GetMatriksPresensi — seluruh sel presensi dalam satu bulan untuk tampilan
// matriks pada halaman Rekap Presensi (admin, read-only).
// Query: bulan=YYYY-MM, bidang=csv (opsional), kategori=csv (opsional)
func GetMatriksPresensi(c *gin.Context) {
	_ = services.PastikanHariTerkunci(config.DB)

	dari, sampai, bulanNormal := rentangBulan(c.Query("bulan"))

	q := config.DB.Table("presensis pr").
		Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
		Joins("LEFT JOIN pendaftaran_magangs p ON p.id = pr.pendaftaran_id").
		Where("pr.tanggal >= ? AND pr.tanggal <= ?", dari, sampai)

	if bidang := strings.TrimSpace(c.Query("bidang")); bidang != "" {
		q = q.Where("p.posisi_bidang IN ?", strings.Split(bidang, ","))
	}
	if kategori := strings.TrimSpace(c.Query("kategori")); kategori != "" {
		q = q.Where("p.kategori_pendaftar IN ?", strings.Split(kategori, ","))
	}

	rows := make([]MatriksSel, 0)
	if err := q.
		Select("pr.peserta_id AS peserta_id, pr.tanggal AS tanggal, pr.status AS status, pr.menit_terlambat AS terlambat").
		Order("pr.peserta_id asc, pr.tanggal asc").
		Scan(&rows).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil matriks presensi")
		return
	}

	// normalkan tanggal agar konsisten "YYYY-MM-DD" walau driver mengembalikan datetime
	for i := range rows {
		rows[i].Tanggal = normalTanggal(rows[i].Tanggal)
	}

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}
	hariKerja := kal.DaftarHariKerja(dari, sampai)

	utils.SuccessResponse(c, http.StatusOK, "Matriks presensi berhasil diambil", gin.H{
		"periode": gin.H{
			"bulan":              bulanNormal,
			"dari":               dari,
			"sampai":             sampai,
			"tanggal_hari_kerja": hariKerja,
			"hari_kerja_efektif": len(hariKerja),
		},
		"total": len(rows),
		"data":  rows,
	})
}