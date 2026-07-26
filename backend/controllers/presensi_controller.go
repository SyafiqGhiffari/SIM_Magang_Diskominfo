package controllers

import (
	"net/http"
	"strconv"
	"strings"

	"sim-magang-backend/config"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==================== DATA PRESENSI (ADMIN — READ ONLY) ====================
//
// Admin hanya boleh MELIHAT data presensi dan merekapnya.
// Pengajuan izin/sakit & koreksi presensi adalah wewenang mentor.

// PresensiRow adalah bentuk data presensi yang dikirim ke frontend.
type PresensiRow struct {
	ID             uint    `json:"id"`
	PesertaID      uint    `json:"peserta_id"`
	Nama           string  `json:"nama"`
	FotoProfil     string  `json:"foto_profil"`
	FotoPeserta    string  `json:"foto_peserta"`
	Institusi      string  `json:"institusi"`
	Bidang         string  `json:"bidang"`
	Kategori       string  `json:"kategori_pendaftar"`
	Tanggal        string  `json:"tanggal"`
	JamMasuk       *string `json:"jam_masuk"`
	JamPulang      *string `json:"jam_pulang"`
	Status         string  `json:"status"`
	MenitTerlambat int     `json:"menit_terlambat"`
	LupaPresensi   bool    `json:"lupa_presensi"`
	Dikunci        bool    `json:"dikunci"`
	Keterangan     string  `json:"keterangan"`
	FotoMasuk      string  `json:"foto_masuk"`
	FotoPulang     string  `json:"foto_pulang"`
	Sumber         string  `json:"sumber"`
	MentorNama     string  `json:"mentor_nama"`
	// TotalRiwayat hanya diisi saat mode=terbaru, dipakai untuk badge
	// "+N riwayat" pada baris ringkas di frontend.
	TotalRiwayat int `json:"total_riwayat"`
}

const selectPresensiRow = `
	pr.id, pr.peserta_id, pr.tanggal, pr.jam_masuk, pr.jam_pulang,
	pr.status, pr.menit_terlambat, pr.lupa_presensi, pr.dikunci,
	pr.keterangan, pr.foto_masuk, pr.foto_pulang, pr.sumber,
	u.nama AS nama,
	COALESCE(u.foto_profil, '') AS foto_profil,
	COALESCE(p.file_pas_foto, '') AS foto_peserta,
	COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
	COALESCE(p.posisi_bidang, '') AS bidang,
	COALESCE(p.kategori_pendaftar, '') AS kategori,
	COALESCE(m.nama, '') AS mentor_nama
`

	// basePresensiQuery membangun query presensi + join peserta/pendaftaran/mentor,
	// lengkap dengan filter dari query string (termasuk mode=terbaru).
	func basePresensiQuery(c *gin.Context) *gorm.DB {
		return buildPresensiQuery(c, true)
	}

	// basePresensiQueryTanpaMode sama seperti basePresensiQuery, tetapi mengabaikan
	// mode=terbaru. Dipakai untuk menghitung total riwayat tiap peserta agar
	// angkanya tetap mengikuti filter tanggal/status/bidang yang aktif.
	func basePresensiQueryTanpaMode(c *gin.Context) *gorm.DB {
		return buildPresensiQuery(c, false)
	}

	func buildPresensiQuery(c *gin.Context, pakaiMode bool) *gorm.DB {
		q := config.DB.Table("presensis pr").
		Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
		Joins("LEFT JOIN pendaftaran_magangs p ON p.id = pr.pendaftaran_id").
		Joins("LEFT JOIN user_manajemens m ON m.id = p.mentor_id")

	if s := strings.TrimSpace(c.Query("search")); s != "" {
		key := "%" + s + "%"
		q = q.Where(
			"u.nama LIKE ? OR p.posisi_bidang LIKE ? OR p.asal_kampus LIKE ? OR p.asal_sekolah LIKE ? OR p.npm_nim LIKE ? OR p.nisn LIKE ?",
			key, key, key, key, key, key,
		)
	}

	if raw := strings.TrimSpace(c.Query("status")); raw != "" {
		var status []string
		for _, s := range strings.Split(raw, ",") {
			s = strings.TrimSpace(s)
			switch s {
			case "hadir", "terlambat", "izin", "sakit", "alfa":
				status = append(status, s)
			}
		}
		if len(status) > 0 {
			q = q.Where("pr.status IN ?", status)
		}
	}

	if raw := strings.TrimSpace(c.Query("bidang")); raw != "" {
		q = q.Where("p.posisi_bidang IN ?", strings.Split(raw, ","))
	}
	if raw := strings.TrimSpace(c.Query("kategori")); raw != "" {
		q = q.Where("p.kategori_pendaftar IN ?", strings.Split(raw, ","))
	}
	if v := strings.TrimSpace(c.Query("peserta_id")); v != "" {
		q = q.Where("pr.peserta_id = ?", v)
	}
	if v := strings.TrimSpace(c.Query("tanggal_dari")); v != "" {
		q = q.Where("pr.tanggal >= ?", v)
	}
	if v := strings.TrimSpace(c.Query("tanggal_sampai")); v != "" {
		q = q.Where("pr.tanggal <= ?", v)
	}
	if strings.TrimSpace(c.Query("lupa_presensi")) == "1" {
		q = q.Where("pr.lupa_presensi = 1")
	}

	// mode=terbaru → tampilkan hanya 1 baris presensi TERBARU tiap peserta,
	// agar daftar tidak dipenuhi nama yang sama berulang kali.
	if pakaiMode && strings.TrimSpace(c.Query("mode")) == "terbaru" {
		sub := config.DB.Table("presensis px").
			Select("MAX(px.tanggal)").
			Where("px.peserta_id = pr.peserta_id")
		if v := strings.TrimSpace(c.Query("tanggal_dari")); v != "" {
			sub = sub.Where("px.tanggal >= ?", v)
		}
		if v := strings.TrimSpace(c.Query("tanggal_sampai")); v != "" {
			sub = sub.Where("px.tanggal <= ?", v)
		}
		q = q.Where("pr.tanggal = (?)", sub)
	}

	return q
}

func urutanPresensi(sort string) string {
	switch sort {
	case "tanggal_lama":
		return "pr.tanggal asc, u.nama asc"
	case "nama_az":
		return "u.nama asc, pr.tanggal desc"
	case "nama_za":
		return "u.nama desc, pr.tanggal desc"
	case "status":
		return "FIELD(pr.status,'alfa','terlambat','izin','sakit','hadir'), pr.tanggal desc"
	case "terlambat_terbanyak":
		return "pr.menit_terlambat desc, pr.tanggal desc"
	default: // tanggal_baru
		return "pr.tanggal desc, u.nama asc"
	}
}

// GetAllPresensi — daftar presensi dengan filter, sortir, dan pagination.
func GetAllPresensi(c *gin.Context) {
	// Jaring pengaman: pastikan hari-hari yang sudah lewat sudah ditutup
	// (alfa otomatis dibuat) sebelum data dibaca.
	_ = services.PastikanHariTerkunci(config.DB)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 1000 {
		limit = 1000 // dipangkas, bukan dikembalikan ke 10 (dipakai fitur ekspor)
	}

	var total int64
	if err := basePresensiQuery(c).Count(&total).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung data presensi")
		return
	}

	rows := make([]PresensiRow, 0)
	if err := basePresensiQuery(c).
		Select(selectPresensiRow).
		Order(urutanPresensi(c.Query("sort"))).
		Limit(limit).Offset((page - 1) * limit).
		Scan(&rows).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data presensi")
		return
	}

	// Pada mode ringkas, sertakan jumlah total riwayat presensi tiap peserta
	// supaya frontend bisa menampilkan badge "N lainnya".
	if strings.TrimSpace(c.Query("mode")) == "terbaru" && len(rows) > 0 {
		ids := make([]uint, 0, len(rows))
		for _, r := range rows {
			ids = append(ids, r.PesertaID)
		}
		type hitungRiwayat struct {
			PesertaID uint `json:"peserta_id"`
			Jumlah    int  `json:"jumlah"`
		}
		var hasil []hitungRiwayat
		// Hitung memakai filter yang sama dengan tabel (tanggal, status, bidang,
		// kategori, pencarian), tetapi TANPA mode=terbaru — kalau mode ikut
		// dipakai, hasil COUNT selalu 1 dan badge "N lainnya" jadi salah.
		basePresensiQueryTanpaMode(c).
			Where("pr.peserta_id IN ?", ids).
			Select("pr.peserta_id AS peserta_id, COUNT(*) AS jumlah").
			Group("pr.peserta_id").
			Scan(&hasil)

		jumlahPer := make(map[uint]int, len(hasil))
		for _, h := range hasil {
			jumlahPer[h.PesertaID] = h.Jumlah
		}
		for i := range rows {
			rows[i].TotalRiwayat = jumlahPer[rows[i].PesertaID]
		}
	}

	totalPage := int((total + int64(limit) - 1) / int64(limit))
	utils.SuccessResponse(c, http.StatusOK, "Data presensi berhasil diambil", gin.H{
		"data": rows,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": totalPage,
			"mode":       strings.TrimSpace(c.Query("mode")),
		},
	})
}

// GetPresensi — detail satu baris presensi.
func GetPresensi(c *gin.Context) {
	var row PresensiRow
	err := config.DB.Table("presensis pr").
		Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
		Joins("LEFT JOIN pendaftaran_magangs p ON p.id = pr.pendaftaran_id").
		Joins("LEFT JOIN user_manajemens m ON m.id = p.mentor_id").
		Select(selectPresensiRow).
		Where("pr.id = ?", c.Param("id")).
		Scan(&row).Error
	if err != nil || row.ID == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "Data presensi tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Detail presensi berhasil diambil", row)
}

// GetStatistikPresensi — angka untuk kartu statistik halaman Data Presensi.
// Mengikuti filter tanggal/bidang/kategori yang sedang aktif.
// Jika tanggal tidak dikirim, default = hari ini (WIB).
func GetStatistikPresensi(c *gin.Context) {
	_ = services.PastikanHariTerkunci(config.DB)

	// Statistik pada halaman Data Presensi bersifat HARIAN: bila frontend tidak
	// mengirim rentang tanggal, gunakan hari ini. Rentang tetap didukung agar
	// endpoint ini bisa dipakai ulang oleh halaman rekap.
	dari := strings.TrimSpace(c.Query("tanggal_dari"))
	sampai := strings.TrimSpace(c.Query("tanggal_sampai"))
	if dari == "" && sampai == "" {
		dari = utils.TanggalHariIni()
		sampai = dari
	}

	// builder dipakai ulang untuk hitung per-status dan hitung lupa presensi
	// agar filternya tidak pernah berbeda.
	buatQuery := func() *gorm.DB {
		q := config.DB.Table("presensis pr").
			Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
			Joins("LEFT JOIN pendaftaran_magangs p ON p.id = pr.pendaftaran_id")

		if dari != "" {
			q = q.Where("pr.tanggal >= ?", dari)
		}
		if sampai != "" {
			q = q.Where("pr.tanggal <= ?", sampai)
		}
		if raw := strings.TrimSpace(c.Query("bidang")); raw != "" {
			q = q.Where("p.posisi_bidang IN ?", strings.Split(raw, ","))
		}
		if raw := strings.TrimSpace(c.Query("kategori")); raw != "" {
			q = q.Where("p.kategori_pendaftar IN ?", strings.Split(raw, ","))
		}
		if s := strings.TrimSpace(c.Query("search")); s != "" {
			key := "%" + s + "%"
			q = q.Where(
				"u.nama LIKE ? OR p.posisi_bidang LIKE ? OR p.asal_kampus LIKE ? OR p.asal_sekolah LIKE ?",
				key, key, key, key,
			)
		}
		return q
	}

	q := buatQuery()

	type baris struct {
		Status string `json:"status"`
		Jumlah int    `json:"jumlah"`
	}
	var hasil []baris
	if err := q.Select("pr.status AS status, COUNT(*) AS jumlah").Group("pr.status").Scan(&hasil).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil statistik presensi")
		return
	}

	stat := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	total := 0
	for _, b := range hasil {
		stat[b.Status] = b.Jumlah
		total += b.Jumlah
	}

	// Peserta wajib presensi & yang belum mengisi presensi hari ini
	peserta, _ := utils.AmbilPesertaPresensi(config.DB)
	hariIni := utils.TanggalHariIni()
	kal, errKal := utils.MuatKalenderKerja(config.DB)
	hariKerja := false
	alasanHari := ""
	wajibHariIni := 0
	if errKal == nil {
		info := kal.CekHari(hariIni)
		hariKerja = info.HariKerja
		alasanHari = info.Alasan
		if hariKerja {
			for _, p := range peserta {
				if p.WajibPresensiPada(hariIni) {
					wajibHariIni++
				}
			}
		}
	}

	var sudahHariIni int64
	config.DB.Table("presensis").Where("tanggal = ?", hariIni).Count(&sudahHariIni)
	belumHariIni := wajibHariIni - int(sudahHariIni)
	if belumHariIni < 0 {
		belumHariIni = 0
	}

	var lupaPresensi int64
	buatQuery().Where("pr.lupa_presensi = 1").Count(&lupaPresensi)

	utils.SuccessResponse(c, http.StatusOK, "Statistik presensi berhasil diambil", gin.H{
		"periode": gin.H{"dari": dari, "sampai": sampai},
		"hari_ini": gin.H{
			"tanggal":        hariIni,
			"hari_kerja":     hariKerja,
			"alasan":         alasanHari,
			"wajib_presensi": wajibHariIni,
			"sudah_presensi": int(sudahHariIni),
			"belum_presensi": belumHariIni,
		},
		"total":         total,
		"hadir":         stat["hadir"],
		"terlambat":     stat["terlambat"],
		"izin":          stat["izin"],
		"sakit":         stat["sakit"],
		"alfa":          stat["alfa"],
		"lupa_presensi": lupaPresensi,
		"total_peserta": len(peserta),
	})
}

// GetOpsiFilterPresensi — daftar bidang & kategori untuk modal filter.
func GetOpsiFilterPresensi(c *gin.Context) {
	var bidang []string
	config.DB.Table("pendaftaran_magangs").
		Where("posisi_bidang IS NOT NULL AND posisi_bidang <> ''").
		Distinct().Order("posisi_bidang asc").Pluck("posisi_bidang", &bidang)

	utils.SuccessResponse(c, http.StatusOK, "Opsi filter presensi berhasil diambil", gin.H{
		"bidang":   bidang,
		"kategori": []string{"mahasiswa", "siswa"},
		"status":   []string{"hadir", "terlambat", "izin", "sakit", "alfa"},
	})
}