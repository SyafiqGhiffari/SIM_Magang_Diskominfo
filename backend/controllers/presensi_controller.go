// ==============================================================================
// CONTROLLER: PRESENSI CONTROLLER
// DESKRIPSI : Pengelolaan sistem presensi terpadu magang. Mencakup pencatatan
//             presensi masuk/pulang, swafoto selfie, validasi GPS & radius, logbook
//             kegiatan harian, permohonan & verifikasi izin/sakit, pengaturan jadwal
//             jam kerja kedinasan, kalender hari libur & sinkronisasi nasional,
//             serta rekapitulasi dan visualisasi matriks presensi bulanan.
// ROLE TERKAIT: [ROLE: ADMIN], [ROLE: MENTOR], [ROLE: PESERTA]
// ==============================================================================

package controllers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ==============================================================================
// ── HELPER & FUNGSI BERSAMA PRESENSI ──────────────────────────────────────────
// ==============================================================================

// mentorIDDariToken mengambil id mentor yang sedang login.
func mentorIDDariToken(c *gin.Context) (uint, bool) {
	id, ok := getUserIDFromContext(c)
	if !ok || id == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return 0, false
	}
	return id, true
}

// pendaftaranPesertaMentor memastikan peserta benar-benar bimbingan mentor ini.
// Mengembalikan id pendaftaran terakhir peserta tersebut.
func pendaftaranPesertaMentor(mentorID, pesertaID uint) (*uint, bool) {
	var row struct {
		ID uint `gorm:"column:id"`
	}
	err := config.DB.Table("pendaftaran_magangs").
		Select("id").
		Where("akun_peserta_id = ? AND mentor_id = ?", pesertaID, mentorID).
		Order("id desc").
		Limit(1).
		Scan(&row).Error
	if err != nil || row.ID == 0 {
		return nil, false
	}
	pid := row.ID
	return &pid, true
}

// pesertaIDDariToken mengambil id akun peserta yang sedang login.
func pesertaIDDariToken(c *gin.Context) (uint, bool) {
	pesertaID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return 0, false
	}
	return pesertaID, true
}

// pendaftaranAktifPeserta mengambil pendaftaran magang terakhir milik peserta.
func pendaftaranAktifPeserta(pesertaID uint) *models.PendaftaranMagang {
	var p models.PendaftaranMagang
	err := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		Order("id desc").
		First(&p).Error
	if err != nil {
		return nil
	}
	return &p
}

// simpanFotoPresensi menyimpan foto selfie presensi ke uploads/presensi/YYYY-MM.
func simpanFotoPresensi(c *gin.Context, file *multipart.FileHeader, jenis string) (string, error) {
	if file == nil {
		return "", nil
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	uploadDir := filepath.Join("uploads", "presensi", utils.SekarangWIB().Format("2006-01"))
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder upload presensi")
	}

	fileName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), jenis, ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan foto presensi")
	}
	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

// izinDisetujuiPada mencari pengajuan izin/sakit yang disetujui dan mencakup tanggal tertentu.
func izinDisetujuiPada(pesertaID uint, tanggal string) *models.PengajuanIzin {
	var izin models.PengajuanIzin
	err := config.DB.
		Where("peserta_id = ? AND status = 'disetujui'", pesertaID).
		Where("tanggal_mulai <= ? AND tanggal_selesai >= ?", tanggal, tanggal).
		Order("id desc").
		First(&izin).Error
	if err != nil {
		return nil
	}
	return &izin
}

var namaBulanSingkatPeserta = map[string]string{
	"01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "Mei", "06": "Jun",
	"07": "Jul", "08": "Agu", "09": "Sep", "10": "Okt", "11": "Nov", "12": "Des",
}

func formatTglIndoSingkatIzin(raw string) string {
	if raw == "" {
		return ""
	}
	tgl := strings.Split(raw, "T")[0]
	parts := strings.Split(tgl, "-")
	if len(parts) == 3 {
		bln := namaBulanSingkatPeserta[parts[1]]
		if bln == "" {
			bln = parts[1]
		}
		d := strings.TrimPrefix(parts[2], "0")
		return fmt.Sprintf("%s %s %s", d, bln, parts[0])
	}
	return raw
}

func formatRentangTglIndoIzin(mulai, selesai string) string {
	fMulai := formatTglIndoSingkatIzin(mulai)
	fSelesai := formatTglIndoSingkatIzin(selesai)
	if fMulai == "" {
		return fSelesai
	}
	if fSelesai == "" || fMulai == fSelesai {
		return fMulai
	}
	return fmt.Sprintf("%s s/d %s", fMulai, fSelesai)
}

func kirimEmailPengajuanIzinBaru(izinID uint) {
	var izin models.PengajuanIzin
	if err := config.DB.First(&izin, izinID).Error; err != nil {
		return
	}

	var peserta models.UserManajemen
	if err := config.DB.First(&peserta, izin.PesertaID).Error; err != nil {
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.
		Where("akun_peserta_id = ?", izin.PesertaID).
		Order("id desc").
		First(&pendaftaran).Error; err != nil {
		return
	}
	if pendaftaran.MentorID == nil {
		return
	}

	var mentor models.UserManajemen
	if err := config.DB.First(&mentor, *pendaftaran.MentorID).Error; err != nil || mentor.Email == "" {
		return
	}

	namaJenis := "Izin"
	if izin.Jenis == "sakit" {
		namaJenis = "Izin Sakit"
	}
	rentangTgl := formatRentangTglIndoIzin(izin.TanggalMulai, izin.TanggalSelesai)
	mentorID := *pendaftaran.MentorID
	services.KirimNotifikasi(services.NotifikasiInput{
		TargetRole:   "mentor",
		TargetUserID: &mentorID,
		Tipe:         "pengajuan_izin",
		Prioritas:    "tinggi",
		Judul:        fmt.Sprintf("Verifikasi %s Baru", namaJenis),
		Pesan:        fmt.Sprintf("Peserta %s mengajukan %s (%s). Memerlukan verifikasi Anda.", peserta.Nama, strings.ToLower(namaJenis), rentangTgl),
		RefTabel:     "pengajuan_izins",
		RefID:        &izin.ID,
		UrlTujuan:    "/mentor/pengajuan-izin",
		Gabungkan:    false,
	})

	subject := emailtemplates.SubjectPengajuanIzinBaru(izin.Jenis, peserta.Nama)
	body := emailtemplates.TemplatePengajuanIzinBaru(
		mentor.Nama,
		peserta.Nama,
		izin.Jenis,
		formatTglIndoSingkatIzin(izin.TanggalMulai),
		formatTglIndoSingkatIzin(izin.TanggalSelesai),
		izin.Alasan,
	)

	if err := services.SendEmail(mentor.Email, subject, body); err != nil {
		log.Println("gagal kirim email pengajuan izin baru:", err)
	}
}

func kirimEmailHasilIzin(izinID uint) {
	var izin models.PengajuanIzin
	if err := config.DB.First(&izin, izinID).Error; err != nil {
		return
	}

	statusText := "Disetujui"
	if izin.Status == "ditolak" {
		statusText = "Ditolak"
	}
	namaJenis := "Izin"
	if izin.Jenis == "sakit" {
		namaJenis = "Izin Sakit"
	}
	rentangTgl := formatRentangTglIndoIzin(izin.TanggalMulai, izin.TanggalSelesai)
	pesertaID := izin.PesertaID
	services.KirimNotifikasi(services.NotifikasiInput{
		TargetRole:   "peserta",
		TargetUserID: &pesertaID,
		Tipe:         "izin_status",
		Prioritas:    "tinggi",
		Judul:        fmt.Sprintf("Pengajuan %s %s", namaJenis, statusText),
		Pesan:        fmt.Sprintf("Pengajuan %s Anda untuk tanggal %s telah %s oleh mentor.", strings.ToLower(namaJenis), rentangTgl, strings.ToLower(statusText)),
		RefTabel:     "pengajuan_izins",
		RefID:        &izin.ID,
		UrlTujuan:    "/peserta/pengajuan-izin",
		Gabungkan:    false,
	})

	tujuan := utils.EmailAktifPeserta(config.DB, izin.PesertaID)
	if tujuan == "" {
		return
	}

	var peserta models.UserManajemen
	if err := config.DB.First(&peserta, izin.PesertaID).Error; err != nil {
		return
	}

	subject := emailtemplates.SubjectHasilPengajuanIzin(izin.Jenis, izin.Status)
	body := emailtemplates.TemplateHasilPengajuanIzin(
		peserta.Nama,
		izin.Jenis,
		izin.TanggalMulai,
		izin.TanggalSelesai,
		izin.Status,
		izin.CatatanMentor,
	)

	if err := services.SendEmail(tujuan, subject, body); err != nil {
		log.Println("gagal kirim email hasil izin:", err)
	}
}

func coalesceString(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}

// ==============================================================================
// ── BAGIAN ADMIN: DATA PRESENSI (READ ONLY & REKAP KESELURUHAN) ───────────────
// ==============================================================================

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
	Jurusan        string  `json:"jurusan"`
	ProgramStudi   string  `json:"program_studi"`
	JurusanSekolah string  `json:"jurusan_sekolah"`
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
	ModeKehadiran  string  `json:"mode_kehadiran"`
	Latitude       *string `json:"latitude"`
	Longitude      *string `json:"longitude"`
	JarakMeter     *int    `json:"jarak_meter"`
	Sumber         string  `json:"sumber"`
	MentorNama     string  `json:"mentor_nama"`
	TotalRiwayat   int     `json:"total_riwayat"`
}

const selectPresensiRow = `
	pr.id, pr.peserta_id, pr.tanggal, pr.jam_masuk, pr.jam_pulang,
	pr.status, pr.menit_terlambat, pr.lupa_presensi, pr.dikunci,
	pr.keterangan, pr.foto_masuk, pr.foto_pulang, pr.mode_kehadiran,
	pr.latitude, pr.longitude, pr.jarak_meter, pr.sumber,
	u.nama AS nama,
	COALESCE(u.foto_profil, '') AS foto_profil,
	COALESCE(p.file_pas_foto, '') AS foto_peserta,
	COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
	COALESCE(p.posisi_bidang, '') AS bidang,
	COALESCE(p.kategori_pendaftar, '') AS kategori,
	COALESCE(NULLIF(p.program_studi, ''), p.jurusan_sekolah, '') AS jurusan,
	COALESCE(p.program_studi, '') AS program_studi,
	COALESCE(p.jurusan_sekolah, '') AS jurusan_sekolah,
	COALESCE(m.nama, '') AS mentor_nama
`

func basePresensiQuery(c *gin.Context) *gorm.DB {
	return buildPresensiQuery(c, true)
}

func basePresensiQueryTanpaMode(c *gin.Context) *gorm.DB {
	return buildPresensiQuery(c, false)
}

func buildPresensiQuery(c *gin.Context, pakaiMode bool) *gorm.DB {
	q := config.DB.Table("presensis pr").
		Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
		Joins(`LEFT JOIN pendaftaran_magangs p ON p.id = COALESCE(pr.pendaftaran_id, (
			SELECT p2.id FROM pendaftaran_magangs p2
			WHERE p2.akun_peserta_id = pr.peserta_id
			ORDER BY p2.id DESC LIMIT 1
		))`).
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
	if raw := strings.TrimSpace(c.Query("mentor_id")); raw != "" {
		q = q.Where("p.mentor_id = ?", raw)
	}

	mode := c.Query("mode")
	if pakaiMode && mode == "terbaru" {
		q = q.Joins(`JOIN (
			SELECT pr2.peserta_id, MAX(pr2.tanggal) AS max_tanggal
			FROM presensis pr2
			GROUP BY pr2.peserta_id
		) mx ON mx.peserta_id = pr.peserta_id AND mx.max_tanggal = pr.tanggal`)
	} else {
		if dari := strings.TrimSpace(c.Query("tanggal_dari")); dari != "" {
			q = q.Where("pr.tanggal >= ?", dari)
		}
		if sampai := strings.TrimSpace(c.Query("tanggal_sampai")); sampai != "" {
			q = q.Where("pr.tanggal <= ?", sampai)
		}
	}

	return q
}

func urutanPresensi(sort string) string {
	switch sort {
	case "tanggal_asc":
		return "pr.tanggal ASC, pr.id ASC"
	case "nama_asc":
		return "u.nama ASC, pr.tanggal DESC"
	case "nama_desc":
		return "u.nama DESC, pr.tanggal DESC"
	case "status_asc":
		return "pr.status ASC, pr.tanggal DESC"
	default:
		return "pr.tanggal DESC, pr.id DESC"
	}
}

// [ROLE: ADMIN]
// GetAllPresensi mengambil data presensi utama peserta magang untuk tabel monitoring presensi admin (mendukung filter tanggal, status, bidang, search, dan pagination).
// Endpoint: GET /api/manajemen/admin/presensi
func GetAllPresensi(c *gin.Context) {
	_ = services.PastikanHariTerkunci(config.DB)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 10
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

	if c.Query("mode") == "terbaru" && len(rows) > 0 {
		ids := make([]uint, 0, len(rows))
		for _, r := range rows {
			ids = append(ids, r.PesertaID)
		}
		type hitungRiwayat struct {
			PesertaID uint `json:"peserta_id"`
			Jumlah    int  `json:"jumlah"`
		}
		var hasil []hitungRiwayat
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
		},
	})
}

// [ROLE: ADMIN]
// GetPresensi mengambil detail satu data presensi peserta berdasarkan ID presensi.
// Endpoint: GET /api/manajemen/admin/presensi/:id
func GetPresensi(c *gin.Context) {
	id := c.Param("id")
	var row PresensiRow
	err := config.DB.Table("presensis pr").
		Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
		Joins(`LEFT JOIN pendaftaran_magangs p ON p.id = COALESCE(pr.pendaftaran_id, (
			SELECT p2.id FROM pendaftaran_magangs p2
			WHERE p2.akun_peserta_id = pr.peserta_id
			ORDER BY p2.id DESC LIMIT 1
		))`).
		Joins("LEFT JOIN user_manajemens m ON m.id = p.mentor_id").
		Where("pr.id = ?", id).
		Select(selectPresensiRow).
		Scan(&row).Error

	if err != nil || row.ID == 0 {
		utils.ErrorResponse(c, http.StatusNotFound, "Data presensi tidak ditemukan")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Detail presensi berhasil diambil", row)
}

// [ROLE: ADMIN]
// GetStatistikPresensi mengambil ringkasan statistik presensi (hadir, terlambat, izin, sakit, alfa, lupa presensi, dan status hari kerja hari ini) untuk kartu metrik admin.
// Endpoint: GET /api/manajemen/admin/presensi/statistik
func GetStatistikPresensi(c *gin.Context) {
	_ = services.PastikanHariTerkunci(config.DB)

	dari := strings.TrimSpace(c.Query("tanggal_dari"))
	sampai := strings.TrimSpace(c.Query("tanggal_sampai"))
	if dari == "" && sampai == "" {
		dari = utils.TanggalHariIni()
		sampai = dari
	}

	buatQuery := func() *gorm.DB {
		q := config.DB.Table("presensis pr").
			Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
			Joins(`LEFT JOIN pendaftaran_magangs p ON p.id = COALESCE(pr.pendaftaran_id, (
				SELECT p2.id FROM pendaftaran_magangs p2
				WHERE p2.akun_peserta_id = pr.peserta_id
				ORDER BY p2.id DESC LIMIT 1
			))`).
			Joins("LEFT JOIN user_manajemens m ON m.id = p.mentor_id")

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
		if raw := strings.TrimSpace(c.Query("mentor_id")); raw != "" {
			q = q.Where("p.mentor_id = ?", raw)
		}
		if s := strings.TrimSpace(c.Query("search")); s != "" {
			key := "%" + s + "%"
			q = q.Where(
				"u.nama LIKE ? OR p.posisi_bidang LIKE ? OR p.asal_kampus LIKE ? OR p.asal_sekolah LIKE ? OR p.npm_nim LIKE ? OR p.nisn LIKE ?",
				key, key, key, key, key, key,
			)
		}
		return q
	}

	type barisStatus struct {
		Status string `gorm:"column:status"`
		Jumlah int64  `gorm:"column:jumlah"`
	}
	var baris []barisStatus
	if err := buatQuery().
		Select("pr.status AS status, COUNT(*) AS jumlah").
		Group("pr.status").
		Scan(&baris).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung statistik presensi")
		return
	}

	hasil := map[string]int64{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	var total int64
	for _, b := range baris {
		hasil[b.Status] = b.Jumlah
		total += b.Jumlah
	}

	var lupa int64
	buatQuery().Where("pr.lupa_presensi = 1").Count(&lupa)

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
			peserta, _ := utils.AmbilPesertaPresensi(config.DB)
			for _, p := range peserta {
				if p.WajibPresensiPada(hariIni) {
					wajibHariIni++
				}
			}
		}
	}

	var sudahHariIni int64
	config.DB.Model(&models.Presensi{}).Where("tanggal = ?", hariIni).Count(&sudahHariIni)
	belumHariIni := wajibHariIni - int(sudahHariIni)
	if belumHariIni < 0 {
		belumHariIni = 0
	}

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
		"hadir":         hasil["hadir"],
		"terlambat":     hasil["terlambat"],
		"izin":          hasil["izin"],
		"sakit":         hasil["sakit"],
		"alfa":          hasil["alfa"],
		"lupa_presensi": lupa,
	})
}

// [ROLE: ADMIN]
// GetOpsiFilterPresensi mengambil daftar opsi bidang magang aktif dan mentor pembimbing untuk dropdown filter pada halaman presensi admin.
// Endpoint: GET /api/manajemen/admin/presensi/opsi-filter
func GetOpsiFilterPresensi(c *gin.Context) {
	type OpsiBidang struct {
		Nama string `json:"nama"`
	}
	var bidang []OpsiBidang
	config.DB.Table("bidang_magangs").
		Select("nama").
		Where("is_active = 1").
		Order("nama ASC").
		Scan(&bidang)

	type OpsiMentor struct {
		ID   uint   `json:"id"`
		Nama string `json:"nama"`
	}
	var mentor []OpsiMentor
	config.DB.Table("user_manajemens").
		Select("id, nama").
		Where("role = 'mentor' AND status_akun = 'aktif'").
		Order("nama ASC").
		Scan(&mentor)

	utils.SuccessResponse(c, http.StatusOK, "Opsi filter berhasil diambil", gin.H{
		"bidang": bidang,
		"mentor": mentor,
	})
}

// ==============================================================================
// ── BAGIAN MENTOR: PRESENSI BIMBINGAN & PENGAJUAN IZIN ────────────────────────
// ==============================================================================

// [ROLE: MENTOR]
// GetPresensiMentor mengambil daftar presensi seluruh peserta bimbingan yang dibimbing oleh mentor yang sedang login.
// Endpoint: GET /api/manajemen/mentor/presensi
func GetPresensiMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	_ = services.PastikanHariTerkunci(config.DB)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 10
	}

	var total int64
	if err := basePresensiQuery(c).Where("p.mentor_id = ?", mentorID).Count(&total).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung data presensi")
		return
	}

	rows := make([]PresensiRow, 0)
	if err := basePresensiQuery(c).
		Where("p.mentor_id = ?", mentorID).
		Select(selectPresensiRow).
		Order(urutanPresensi(c.Query("sort"))).
		Limit(limit).Offset((page - 1) * limit).
		Scan(&rows).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data presensi")
		return
	}

	if c.Query("mode") == "terbaru" && len(rows) > 0 {
		ids := make([]uint, 0, len(rows))
		for _, r := range rows {
			ids = append(ids, r.PesertaID)
		}
		type hitungRiwayat struct {
			PesertaID uint `json:"peserta_id"`
			Jumlah    int  `json:"jumlah"`
		}
		var hasil []hitungRiwayat
		basePresensiQueryTanpaMode(c).
			Where("p.mentor_id = ? AND pr.peserta_id IN ?", mentorID, ids).
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
	utils.SuccessResponse(c, http.StatusOK, "Data presensi bimbingan berhasil diambil", gin.H{
		"data": rows,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": totalPage,
		},
	})
}

// [ROLE: MENTOR]
// GetStatistikPresensiMentor mengambil ringkasan statistik kehadiran dan perizinan khusus untuk peserta bimbingan dari mentor yang sedang login.
// Endpoint: GET /api/manajemen/mentor/presensi/rekap
func GetStatistikPresensiMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	_ = services.PastikanHariTerkunci(config.DB)

	dari := strings.TrimSpace(c.Query("tanggal_dari"))
	sampai := strings.TrimSpace(c.Query("tanggal_sampai"))
	if dari == "" && sampai == "" {
		dari = utils.TanggalHariIni()
		sampai = dari
	}

	buatQuery := func() *gorm.DB {
		q := config.DB.Table("presensis pr").
			Joins("JOIN user_manajemens u ON u.id = pr.peserta_id").
			Joins(`LEFT JOIN pendaftaran_magangs p ON p.id = COALESCE(pr.pendaftaran_id, (
				SELECT p2.id FROM pendaftaran_magangs p2
				WHERE p2.akun_peserta_id = pr.peserta_id
				ORDER BY p2.id DESC LIMIT 1
			))`).
			Where("p.mentor_id = ?", mentorID)

		if dari != "" {
			q = q.Where("pr.tanggal >= ?", dari)
		}
		if sampai != "" {
			q = q.Where("pr.tanggal <= ?", sampai)
		}
		if raw := strings.TrimSpace(c.Query("kategori")); raw != "" {
			q = q.Where("p.kategori_pendaftar IN ?", strings.Split(raw, ","))
		}
		if s := strings.TrimSpace(c.Query("search")); s != "" {
			key := "%" + s + "%"
			q = q.Where(
				"u.nama LIKE ? OR p.asal_kampus LIKE ? OR p.asal_sekolah LIKE ? OR p.npm_nim LIKE ? OR p.nisn LIKE ?",
				key, key, key, key, key,
			)
		}
		return q
	}

	type barisStatus struct {
		Status string `gorm:"column:status"`
		Jumlah int64  `gorm:"column:jumlah"`
	}
	var baris []barisStatus
	if err := buatQuery().
		Select("pr.status AS status, COUNT(*) AS jumlah").
		Group("pr.status").
		Scan(&baris).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung statistik presensi")
		return
	}

	hasil := map[string]int64{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	var total int64
	for _, b := range baris {
		hasil[b.Status] = b.Jumlah
		total += b.Jumlah
	}

	var lupa int64
	buatQuery().Where("pr.lupa_presensi = 1").Count(&lupa)

	pesertaSemua, _ := utils.AmbilPesertaPresensi(config.DB)
	var pesertaBimbingan []utils.PesertaPresensi
	for _, p := range pesertaSemua {
		if p.MentorID != nil && *p.MentorID == mentorID {
			pesertaBimbingan = append(pesertaBimbingan, p)
		}
	}

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
			for _, p := range pesertaBimbingan {
				if p.WajibPresensiPada(hariIni) {
					wajibHariIni++
				}
			}
		}
	}

	var sudahHariIni int64
	config.DB.Table("presensis pr").
		Joins("JOIN pendaftaran_magangs p ON p.id = pr.pendaftaran_id").
		Where("p.mentor_id = ? AND pr.tanggal = ?", mentorID, hariIni).
		Count(&sudahHariIni)
	belumHariIni := wajibHariIni - int(sudahHariIni)
	if belumHariIni < 0 {
		belumHariIni = 0
	}

	var izinMenunggu int64
	_ = config.DB.Table("pengajuan_izins pi").
		Joins("JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
		Where("p.mentor_id = ? AND pi.status = 'menunggu'", mentorID).
		Count(&izinMenunggu).Error

	utils.SuccessResponse(c, http.StatusOK, "Statistik presensi bimbingan berhasil diambil", gin.H{
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
		"hadir":         hasil["hadir"],
		"terlambat":     hasil["terlambat"],
		"izin":          hasil["izin"],
		"sakit":         hasil["sakit"],
		"alfa":          hasil["alfa"],
		"lupa_presensi": lupa,
		"total_peserta": len(pesertaBimbingan),
		"izin_menunggu": izinMenunggu,
	})
}

type updatePresensiInput struct {
	Status     *string `json:"status"`
	JamMasuk   *string `json:"jam_masuk"`
	JamPulang  *string `json:"jam_pulang"`
	Keterangan *string `json:"keterangan"`
}

// [ROLE: MENTOR]
// UpdatePresensiMentor melakukan koreksi manual status kehadiran, jam masuk/pulang, atau catatan presensi peserta bimbingan oleh mentor pembimbing.
// Endpoint: PUT /api/manajemen/mentor/presensi/:id
func UpdatePresensiMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var presensi models.Presensi
	if err := config.DB.First(&presensi, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data presensi tidak ditemukan")
		return
	}

	if _, milik := pendaftaranPesertaMentor(mentorID, presensi.PesertaID); !milik {
		utils.ErrorResponse(c, http.StatusForbidden, "Anda hanya dapat mengoreksi presensi peserta bimbingan Anda")
		return
	}

	var input updatePresensiInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data yang dikirim tidak valid")
		return
	}

	if input.Status != nil {
		switch *input.Status {
		case "hadir", "terlambat", "izin", "sakit", "alfa":
			presensi.Status = *input.Status
		default:
			utils.ErrorResponse(c, http.StatusBadRequest, "Status presensi tidak dikenali")
			return
		}
	}

	if input.JamMasuk != nil {
		jam := strings.TrimSpace(*input.JamMasuk)
		if jam == "" {
			presensi.JamMasuk = nil
		} else {
			presensi.JamMasuk = &jam
		}
	}
	if input.JamPulang != nil {
		jam := strings.TrimSpace(*input.JamPulang)
		if jam == "" {
			presensi.JamPulang = nil
		} else {
			presensi.JamPulang = &jam
		}
	}
	if input.Keterangan != nil {
		presensi.Keterangan = strings.TrimSpace(*input.Keterangan)
	}

	// Hitung ulang keterlambatan bila status kehadiran & jam masuk tersedia
	if presensi.Status == "hadir" || presensi.Status == "terlambat" {
		if presensi.JamMasuk != nil && *presensi.JamMasuk != "" {
			if kal, err := utils.MuatKalenderKerja(config.DB); err == nil {
				hasil := kal.HitungStatusMasuk(normalTanggal(presensi.Tanggal), *presensi.JamMasuk)
				presensi.MenitTerlambat = hasil.MenitTerlambat
				presensi.LupaPresensi = hasil.LupaPresensi
				if input.Status == nil {
					presensi.Status = hasil.Status
				}
			}
		} else {
			presensi.MenitTerlambat = 0
			presensi.LupaPresensi = false
		}
	} else {
		presensi.MenitTerlambat = 0
		presensi.LupaPresensi = false
	}

	presensi.Sumber = "mentor"
	presensi.DicatatOlehID = &mentorID

	if err := config.DB.Save(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan koreksi presensi")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Presensi berhasil dikoreksi", presensi)
}

// PengajuanIzinRow adalah bentuk data pengajuan izin untuk frontend mentor.
type PengajuanIzinRow struct {
	ID             uint   `json:"id"`
	PesertaID      uint   `json:"peserta_id"`
	Nama           string `json:"nama"`
	FotoProfil     string `json:"foto_profil"`
	NomorInduk     string `json:"nomor_induk"`
	Institusi      string `json:"institusi"`
	Jurusan        string `json:"jurusan"`
	Bidang         string `json:"bidang"`
	Jenis          string `json:"jenis"`
	TanggalMulai   string `json:"tanggal_mulai"`
	TanggalSelesai string `json:"tanggal_selesai"`
	Alasan         string `json:"alasan"`
	FileBukti      string `json:"file_bukti"`
	Status         string `json:"status"`
	CatatanMentor  string `json:"catatan_mentor"`
	CreatedAt      string `json:"created_at"`
}

// [ROLE: MENTOR]
// GetPengajuanIzinMentor mengambil daftar permohonan izin/sakit peserta bimbingan (mendukung filter status dan pencarian nama).
// Endpoint: GET /api/manajemen/mentor/pengajuan-izin
func GetPengajuanIzinMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	buildQuery := func() *gorm.DB {
		q := config.DB.Table("pengajuan_izins pi").
			Joins("JOIN user_manajemens u ON u.id = pi.peserta_id").
			Joins("LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
			Where("p.mentor_id = ?", mentorID)

		if v := strings.TrimSpace(c.Query("status")); v != "" {
			q = q.Where("pi.status IN ?", strings.Split(v, ","))
		}
		if v := strings.TrimSpace(c.Query("jenis")); v != "" {
			q = q.Where("pi.jenis IN ?", strings.Split(v, ","))
		}
		if s := strings.TrimSpace(c.Query("search")); s != "" {
			key := "%" + s + "%"
			q = q.Where("u.nama LIKE ? OR pi.alasan LIKE ?", key, key)
		}
		return q
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 10
	}

	var total int64
	if err := buildQuery().Count(&total).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghitung pengajuan izin")
		return
	}

	rows := make([]PengajuanIzinRow, 0)
	err := buildQuery().
		Select(`
			pi.id, pi.peserta_id, pi.jenis, pi.tanggal_mulai, pi.tanggal_selesai,
			pi.alasan, pi.file_bukti, pi.status, pi.catatan_mentor, pi.created_at,
			u.nama AS nama,
			COALESCE(u.foto_profil, '') AS foto_profil,
			COALESCE(NULLIF(p.npm_nim, ''), p.nisn, '') AS nomor_induk,
			COALESCE(NULLIF(p.asal_kampus, ''), p.asal_sekolah, '') AS institusi,
			COALESCE(NULLIF(p.program_studi, ''), p.jurusan_sekolah, '') AS jurusan,
			COALESCE(p.posisi_bidang, '') AS bidang
		`).
		Order("FIELD(pi.status,'menunggu','disetujui','ditolak'), pi.created_at desc").
		Limit(limit).Offset((page - 1) * limit).
		Scan(&rows).Error
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil pengajuan izin")
		return
	}

	totalPage := int((total + int64(limit) - 1) / int64(limit))
	utils.SuccessResponse(c, http.StatusOK, "Pengajuan izin berhasil diambil", gin.H{
		"data": rows,
		"meta": gin.H{"page": page, "limit": limit, "total": total, "total_page": totalPage},
	})
}

type prosesIzinInput struct {
	Status  string `json:"status" binding:"required"` // "disetujui" | "ditolak"
	Catatan string `json:"catatan"`
}

// [ROLE: MENTOR]
// ProsesPengajuanIzinMentor memproses persetujuan atau penolakan pengajuan izin/sakit peserta, serta mencatat kehadiran izin/sakit secara otomatis pada kalender kerja.
// Endpoint: POST /api/manajemen/mentor/pengajuan-izin/:id/review
func ProsesPengajuanIzinMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var izin models.PengajuanIzin
	if err := config.DB.First(&izin, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Pengajuan izin tidak ditemukan")
		return
	}

	pendaftaranID, milik := pendaftaranPesertaMentor(mentorID, izin.PesertaID)
	if !milik {
		utils.ErrorResponse(c, http.StatusForbidden, "Anda hanya dapat memproses pengajuan peserta bimbingan Anda")
		return
	}

	var input prosesIzinInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data yang dikirim tidak valid")
		return
	}
	if input.Status != "disetujui" && input.Status != "ditolak" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status hanya boleh 'disetujui' atau 'ditolak'")
		return
	}
	if izin.Status != "menunggu" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Pengajuan ini sudah diproses sebelumnya")
		return
	}

	sekarang := utils.SekarangWIB()
	izin.Status = input.Status
	izin.CatatanMentor = strings.TrimSpace(input.Catatan)
	izin.DiprosesOlehID = &mentorID
	izin.DiprosesPada = &sekarang

	jumlahHari := 0

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&izin).Error; err != nil {
			return err
		}

		if input.Status != "disetujui" {
			return nil
		}

		kal, err := utils.MuatKalenderKerja(tx)
		if err != nil {
			return err
		}

		dari := normalTanggal(izin.TanggalMulai)
		sampai := normalTanggal(izin.TanggalSelesai)

		for _, tgl := range kal.DaftarHariKerja(dari, sampai) {
			var presensi models.Presensi
			cari := tx.Where("peserta_id = ? AND tanggal = ?", izin.PesertaID, tgl).First(&presensi)

			ket := "Disetujui mentor: " + izin.Alasan

			if cari.Error != nil {
				baru := models.Presensi{
					PesertaID:       izin.PesertaID,
					PendaftaranID:   pendaftaranID,
					Tanggal:         tgl,
					Status:          izin.Jenis,
					Keterangan:      ket,
					Sumber:          "sistem",
					DicatatOlehID:   &mentorID,
					PengajuanIzinID: &izin.ID,
				}
				if err := tx.Create(&baru).Error; err != nil {
					return err
				}
			} else {
				presensi.Status = izin.Jenis
				presensi.Keterangan = ket
				presensi.MenitTerlambat = 0
				presensi.LupaPresensi = false
				presensi.Sumber = "sistem"
				presensi.DicatatOlehID = &mentorID
				presensi.PengajuanIzinID = &izin.ID
				if presensi.PendaftaranID == nil {
					presensi.PendaftaranID = pendaftaranID
				}
				if err := tx.Save(&presensi).Error; err != nil {
					return err
				}
			}
			jumlahHari++
		}
		return nil
	})

	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses pengajuan izin")
		return
	}

	now := time.Now()
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'mentor' AND ref_tabel = 'pengajuan_izins' AND ref_id = ?", izin.ID).
		Update("dibaca_pada", now)

	go kirimEmailHasilIzin(izin.ID)

	utils.SuccessResponse(c, http.StatusOK, "Pengajuan izin berhasil diproses", gin.H{
		"pengajuan":            izin,
		"jumlah_hari_tercatat": jumlahHari,
	})
}

// [ROLE: MENTOR]
// GetHitunganAntreanMentor menghitung total antrean aksi mentor (izin menunggu verifikasi, tugas menunggu dinilai, dan laporan akhir menunggu review).
// Endpoint: GET /api/manajemen/mentor/antrean/hitungan
func GetHitunganAntreanMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	var izinMenunggu int64
	config.DB.Table("pengajuan_izins pi").
		Joins("JOIN user_manajemens u ON u.id = pi.peserta_id").
		Joins("LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
		Where("p.mentor_id = ? AND pi.status = ?", mentorID, "menunggu").
		Count(&izinMenunggu)

	var tugasMenunggu int64
	config.DB.Table("pengumpulan_tugas pt").
		Joins("JOIN tugas_magangs tm ON tm.id = pt.tugas_id").
		Where("(tm.mentor_id = ? OR pt.peserta_id IN (SELECT akun_peserta_id FROM pendaftaran_magangs WHERE mentor_id = ? AND status_pendaftaran = 'diterima')) AND pt.status = ?", mentorID, mentorID, "menunggu").
		Count(&tugasMenunggu)

	var laporanMenunggu int64
	config.DB.Table("pendaftaran_magangs p").
		Joins("LEFT JOIN penilaian_magangs pn ON pn.peserta_id = p.akun_peserta_id").
		Where("p.mentor_id = ? AND p.status_pendaftaran = 'diterima' AND p.file_laporan_akhir != '' AND (pn.laporan_akhir_disetujui IS NULL OR pn.laporan_akhir_disetujui = false)", mentorID).
		Count(&laporanMenunggu)

	var penilaianTertunda int64
	config.DB.Table("pendaftaran_magangs p").
		Joins("LEFT JOIN penilaian_magangs pn ON pn.peserta_id = p.akun_peserta_id").
		Where("p.mentor_id = ? AND p.status_pendaftaran = 'diterima' AND (pn.status_penilaian IS NULL OR pn.status_penilaian != 'final')", mentorID).
		Count(&penilaianTertunda)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"izin":          izinMenunggu,
			"tugas":         tugasMenunggu,
			"laporan_akhir": laporanMenunggu,
			"penilaian":     penilaianTertunda,
		},
	})
}

// [ROLE: MENTOR]
// GetStatistikPengajuanIzinMentor mengambil statistik permohonan izin peserta bimbingan (menunggu, disetujui, ditolak, serta kategori izin/sakit).
// Endpoint: GET /api/manajemen/mentor/pengajuan-izin/statistik
func GetStatistikPengajuanIzinMentor(c *gin.Context) {
	mentorID, ok := mentorIDDariToken(c)
	if !ok {
		return
	}

	baseQ := func() *gorm.DB {
		return config.DB.Table("pengajuan_izins pi").
			Joins("JOIN user_manajemens u ON u.id = pi.peserta_id").
			Joins("LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = pi.peserta_id").
			Where("p.mentor_id = ?", mentorID)
	}

	type barisStat struct {
		Status string `gorm:"column:status"`
		Jumlah int64  `gorm:"column:jumlah"`
	}
	var baris []barisStat
	_ = baseQ().
		Select("pi.status, COUNT(*) as jumlah").
		Group("pi.status").
		Scan(&baris).Error

	var menunggu, disetujui, ditolak, total int64
	for _, b := range baris {
		total += b.Jumlah
		switch b.Status {
		case "menunggu":
			menunggu = b.Jumlah
		case "disetujui":
			disetujui = b.Jumlah
		case "ditolak":
			ditolak = b.Jumlah
		}
	}

	var izinCount, sakitCount int64
	_ = baseQ().Where("pi.jenis = ?", "izin").Count(&izinCount).Error
	_ = baseQ().Where("pi.jenis = ?", "sakit").Count(&sakitCount).Error

	utils.SuccessResponse(c, http.StatusOK, "Statistik pengajuan izin berhasil diambil", gin.H{
		"menunggu":  menunggu,
		"disetujui": disetujui,
		"ditolak":   ditolak,
		"total":     total,
		"izin":      izinCount,
		"sakit":     sakitCount,
	})
}

// ==============================================================================
// ── BAGIAN PESERTA: PRESENSI MASUK/PULANG, IZIN, RIWAYAT & LOGBOOK ────────────
// ==============================================================================

// [ROLE: PESERTA]
// GetStatusPresensiHariIni mengambil status kehadiran hari ini, jadwal jam kerja aktif, toleransi keterlambatan, dan status tombol absen masuk/pulang peserta login.
// Endpoint: GET /api/manajemen/peserta/presensi/hari-ini
func GetStatusPresensiHariIni(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	_ = services.PastikanHariTerkunci(config.DB)

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}

	tanggal := utils.TanggalHariIni()
	jamSekarang := utils.JamSekarang()
	info := kal.CekHari(tanggal)

	var presensi models.Presensi
	adaPresensi := config.DB.
		Where("peserta_id = ? AND tanggal = ?", pesertaID, tanggal).
		First(&presensi).Error == nil

	izinHariIni := izinDisetujuiPada(pesertaID, tanggal)

	dari := utils.SekarangWIB().Format("2006-01") + "-01"
	type hitungan struct {
		Status string
		Total  int
	}
	var rekap []hitungan
	config.DB.Model(&models.Presensi{}).
		Select("status, COUNT(*) as total").
		Where("peserta_id = ? AND tanggal >= ? AND tanggal <= ?", pesertaID, dari, tanggal).
		Group("status").
		Scan(&rekap)

	ringkas := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	for _, r := range rekap {
		ringkas[r.Status] = r.Total
	}

	sudahMasuk := adaPresensi && presensi.JamMasuk != nil && *presensi.JamMasuk != ""
	sudahPulang := adaPresensi && presensi.JamPulang != nil && *presensi.JamPulang != ""

	pendaftaran := pendaftaranAktifPeserta(pesertaID)
	belumMulaiMagang := false
	tanggalMulaiMagang := ""
	if pendaftaran != nil && pendaftaran.TanggalMulai != "" {
		tanggalMulaiMagang = pendaftaran.TanggalMulai
		if tanggal < pendaftaran.TanggalMulai {
			belumMulaiMagang = true
		}
	}

	statusStr := "belum_absen"
	if belumMulaiMagang {
		statusStr = "belum_mulai"
	} else if !info.HariKerja {
		statusStr = "libur"
	} else if izinHariIni != nil {
		statusStr = izinHariIni.Jenis
	} else if adaPresensi && presensi.Status != "" && presensi.Status != "belum" {
		statusStr = presensi.Status
	} else if sudahMasuk {
		if presensi.Status == "terlambat" || presensi.MenitTerlambat > 0 {
			statusStr = "terlambat"
		} else {
			statusStr = "hadir"
		}
	} else if adaPresensi && presensi.Status == "alfa" {
		statusStr = "alfa"
	}

	if info.HariKerja && info.JamKerja.JamMasuk == "" {
		info.JamKerja = models.JamKerja{
			Hari:               info.Hari,
			JamMasuk:           "07:30",
			JamPulang:          "15:30",
			ToleransiTerlambat: 30,
			IsAktif:            true,
		}
	}

	jamMasukBuka := "06:00"
	belumWaktunyaMasuk := false
	if info.HariKerja && jamSekarang < jamMasukBuka {
		belumWaktunyaMasuk = true
	}

	bisaAbsenMasuk := !belumMulaiMagang && info.HariKerja && izinHariIni == nil && !sudahMasuk && !belumWaktunyaMasuk

	belumWaktunyaPulang := false
	if info.HariKerja && info.JamKerja.JamPulang != "" && jamSekarang < info.JamKerja.JamPulang {
		belumWaktunyaPulang = true
	}

	bisaAbsenPulang := !belumMulaiMagang && info.HariKerja && izinHariIni == nil && sudahMasuk && !sudahPulang && !belumWaktunyaPulang

	var jamMasukVal *string = nil
	var jamPulangVal *string = nil
	menitTerlambatVal := 0
	keteranganLogbookVal := ""

	if adaPresensi {
		jamMasukVal = presensi.JamMasuk
		jamPulangVal = presensi.JamPulang
		menitTerlambatVal = presensi.MenitTerlambat
		keteranganLogbookVal = presensi.Keterangan
	}

	respons := gin.H{
		"tanggal":              tanggal,
		"hari":                 info.Hari,
		"hari_kerja":           info.HariKerja,
		"alasan":               info.Alasan,
		"jam_sekarang":         jamSekarang,
		"belum_mulai_magang":   belumMulaiMagang,
		"tanggal_mulai_magang": tanggalMulaiMagang,
		"jam_kerja": gin.H{
			"jam_masuk_buka":      jamMasukBuka,
			"jam_masuk":           info.JamKerja.JamMasuk,
			"jam_pulang":          info.JamKerja.JamPulang,
			"toleransi_terlambat": info.JamKerja.ToleransiTerlambat,
		},
		"status":                statusStr,
		"sudah_masuk":           sudahMasuk,
		"sudah_pulang":          sudahPulang,
		"bisa_absen_masuk":      bisaAbsenMasuk,
		"bisa_absen_pulang":     bisaAbsenPulang,
		"belum_waktunya_masuk":  belumWaktunyaMasuk,
		"belum_waktunya_pulang": belumWaktunyaPulang,
		"jam_masuk":             jamMasukVal,
		"jam_pulang":            jamPulangVal,
		"menit_terlambat":       menitTerlambatVal,
		"keterangan":            keteranganLogbookVal,
		"presensi":              nil,
		"izin_hari_ini":         izinHariIni,
		"rekap_bulan_ini":       ringkas,
	}
	if adaPresensi {
		respons["presensi"] = presensi
	}

	utils.SuccessResponse(c, http.StatusOK, "Status presensi hari ini berhasil diambil", respons)
}

// formatDurasiKeterlambatan mengubah durasi menit menjadi representasi jam dan menit (misal: "5 jam 35 menit")
func formatDurasiKeterlambatan(menit int) string {
	if menit <= 0 {
		return "0 menit"
	}
	jam := menit / 60
	sisaMenit := menit % 60

	if jam > 0 && sisaMenit > 0 {
		return fmt.Sprintf("%d jam %d menit", jam, sisaMenit)
	} else if jam > 0 {
		return fmt.Sprintf("%d jam", jam)
	}
	return fmt.Sprintf("%d menit", sisaMenit)
}

// [ROLE: PESERTA]
// PresensiMasuk mencatat absensi masuk peserta magang (dilengkapi swafoto selfie, koordinat GPS latitude/longitude, jarak meter dari kantor, dan mode WFO/WFH).
// Endpoint: POST /api/manajemen/peserta/presensi/masuk
func PresensiMasuk(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	tanggal := utils.TanggalHariIni()

	if p := pendaftaranAktifPeserta(pesertaID); p != nil && p.TanggalMulai != "" && tanggal < p.TanggalMulai {
		utils.ErrorResponse(c, http.StatusBadRequest, "Periode magang Anda belum dimulai. Presensi masuk baru dapat dilakukan mulai tanggal "+p.TanggalMulai+".")
		return
	}

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}

	jam := utils.JamSekarang()
	info := kal.CekHari(tanggal)
	if !info.HariKerja {
		utils.ErrorResponse(c, http.StatusBadRequest, "Hari ini bukan hari kerja ("+info.Alasan+"), presensi tidak dapat dilakukan")
		return
	}
	if info.JamKerja.JamMasuk == "" {
		info.JamKerja = models.JamKerja{
			Hari:               info.Hari,
			JamMasuk:           "07:30",
			JamPulang:          "15:30",
			ToleransiTerlambat: 30,
			IsAktif:            true,
		}
	}

	jamMasukBuka := "06:00"
	if jam < jamMasukBuka {
		utils.ErrorResponse(c, http.StatusBadRequest, "Sesi presensi masuk belum dibuka. Presensi masuk dibuka mulai pukul "+jamMasukBuka+" WIB.")
		return
	}

	if izin := izinDisetujuiPada(pesertaID, tanggal); izin != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Hari ini Anda tercatat %s berdasarkan surat pengajuan yang telah disetujui mentor.", strings.ToUpper(izin.Jenis)))
		return
	}

	var lama models.Presensi
	sudahAda := config.DB.Where("peserta_id = ? AND tanggal = ?", pesertaID, tanggal).First(&lama).Error == nil
	if sudahAda && lama.JamMasuk != nil && *lama.JamMasuk != "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda sudah melakukan presensi masuk hari ini pada jam "+*lama.JamMasuk)
		return
	}
	if sudahAda && (lama.Status == "izin" || lama.Status == "sakit") {
		utils.ErrorResponse(c, http.StatusBadRequest, "Hari ini Anda tercatat "+lama.Status+" berdasarkan pengajuan yang disetujui mentor")
		return
	}

	fileFoto, errFile := validateUploadedFile(c, "foto", false, imageExtensions, imageMimeTypes, imageLabel)
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}
	pathFoto, errSave := simpanFotoPresensi(c, fileFoto, "masuk")
	if errSave != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, errSave.Error())
		return
	}

	hasil := kal.HitungStatusMasuk(tanggal, jam)
	keterangan := strings.TrimSpace(c.PostForm("keterangan"))
	if keterangan == "" {
		keterangan = hasil.Keterangan
	}

	presensi := lama
	presensi.PesertaID = pesertaID
	presensi.Tanggal = tanggal
	presensi.JamMasuk = &jam
	presensi.Status = hasil.Status
	presensi.MenitTerlambat = hasil.MenitTerlambat
	presensi.LupaPresensi = hasil.LupaPresensi
	presensi.Keterangan = keterangan
	presensi.Sumber = "peserta"
	presensi.DicatatOlehID = &pesertaID

	modeKehadiran := strings.ToLower(strings.TrimSpace(c.PostForm("mode_kehadiran")))
	if modeKehadiran != "wfh" && modeKehadiran != "dinas_luar" {
		modeKehadiran = "wfo"
	}
	presensi.ModeKehadiran = modeKehadiran

	if lat := strings.TrimSpace(c.PostForm("latitude")); lat != "" {
		presensi.Latitude = &lat
	}
	if lng := strings.TrimSpace(c.PostForm("longitude")); lng != "" {
		presensi.Longitude = &lng
	}
	if jarakStr := strings.TrimSpace(c.PostForm("jarak_meter")); jarakStr != "" {
		if j, err := strconv.Atoi(jarakStr); err == nil {
			presensi.JarakMeter = &j
		}
	}

	fotoMasukLama := ""
	if pathFoto != "" {
		fotoMasukLama = presensi.FotoMasuk
		presensi.FotoMasuk = pathFoto
	}
	if presensi.PendaftaranID == nil {
		if pd := pendaftaranAktifPeserta(pesertaID); pd != nil {
			presensi.PendaftaranID = &pd.ID
		}
	}

	if sudahAda {
		err = config.DB.Save(&presensi).Error
	} else {
		err = config.DB.Create(&presensi).Error
	}
	if err != nil {
		cleanupUploadedFiles(pathFoto)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan presensi masuk")
		return
	}

	gantiFile(fotoMasukLama, pathFoto)

	// Otomatis tandai notifikasi pengingat masuk & peringatan belum presensi hari ini sebagai sudah dibaca
	now := time.Now()
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'peserta' AND target_user_id = ? AND tipe IN ('presensi_masuk', 'peringatan_belum_presensi') AND DATE(created_at) = ? AND dibaca_pada IS NULL", pesertaID, tanggal).
		Update("dibaca_pada", now)

	pesan := "Presensi masuk berhasil dicatat tepat waktu. Selamat beraktivitas!"
	if hasil.Status == "terlambat" {
		pesan = fmt.Sprintf("Presensi masuk tercatat terlambat %s.", formatDurasiKeterlambatan(hasil.MenitTerlambat))
	}
	utils.SuccessResponse(c, http.StatusOK, pesan, presensi)
}

// [ROLE: PESERTA]
// PresensiPulang mencatat kepulangan peserta magang setelah jam kerja berakhir, wajib menyertakan swafoto dan deskripsi ringkas logbook kegiatan hari ini.
// Endpoint: POST /api/manajemen/peserta/presensi/pulang
func PresensiPulang(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}

	tanggal := utils.TanggalHariIni()
	jam := utils.JamSekarang()
	info := kal.CekHari(tanggal)

	if izin := izinDisetujuiPada(pesertaID, tanggal); izin != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, fmt.Sprintf("Hari ini Anda tercatat %s berdasarkan surat pengajuan yang telah disetujui mentor.", strings.ToUpper(izin.Jenis)))
		return
	}

	var presensi models.Presensi
	if err := config.DB.Where("peserta_id = ? AND tanggal = ?", pesertaID, tanggal).First(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda belum melakukan presensi masuk hari ini")
		return
	}
	if presensi.JamMasuk == nil || *presensi.JamMasuk == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda belum melakukan presensi masuk hari ini")
		return
	}
	if presensi.JamPulang != nil && *presensi.JamPulang != "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Anda sudah melakukan presensi pulang pada jam "+*presensi.JamPulang)
		return
	}

	if !info.HariKerja {
		utils.ErrorResponse(c, http.StatusBadRequest, "Hari ini bukan hari kerja ("+info.Alasan+"), presensi tidak dapat dilakukan")
		return
	}
	if info.JamKerja.JamPulang == "" {
		info.JamKerja = models.JamKerja{
			Hari:               info.Hari,
			JamMasuk:           "07:30",
			JamPulang:          "15:30",
			ToleransiTerlambat: 30,
			IsAktif:            true,
		}
	}

	if info.JamKerja.JamPulang != "" && jam < info.JamKerja.JamPulang {
		utils.ErrorResponse(c, http.StatusBadRequest, "Sesi presensi pulang belum dibuka. Jam kepulangan dibuka mulai pukul "+info.JamKerja.JamPulang+" WIB.")
		return
	}

	catatan := strings.TrimSpace(c.PostForm("keterangan"))
	if catatan == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Logbook kegiatan harian wajib diisi sebelum melakukan presensi pulang.")
		return
	}

	fileFoto, errFile := validateUploadedFile(c, "foto", false, imageExtensions, imageMimeTypes, imageLabel)
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}
	pathFoto, errSave := simpanFotoPresensi(c, fileFoto, "pulang")
	if errSave != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, errSave.Error())
		return
	}

	presensi.JamPulang = &jam

	fotoPulangLama := ""
	if pathFoto != "" {
		fotoPulangLama = presensi.FotoPulang
		presensi.FotoPulang = pathFoto
	}

	presensi.Keterangan = catatan

	if err := config.DB.Save(&presensi).Error; err != nil {
		cleanupUploadedFiles(pathFoto)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan presensi pulang")
		return
	}

	gantiFile(fotoPulangLama, pathFoto)

	// Otomatis tandai notifikasi pengingat pulang & pengingat logbook hari ini sebagai sudah dibaca
	now := time.Now()
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'peserta' AND target_user_id = ? AND tipe IN ('presensi_pulang', 'logbook_reminder') AND DATE(created_at) = ? AND dibaca_pada IS NULL", pesertaID, tanggal).
		Update("dibaca_pada", now)

	utils.SuccessResponse(c, http.StatusOK, "Presensi pulang dan logbook kegiatan harian berhasil dicatat.", presensi)
}

// [ROLE: PESERTA]
// GetRiwayatPresensiSaya mengambil seluruh riwayat presensi harian peserta magang yang sedang login dalam rentang satu bulan (termasuk status libur dan izin).
// Endpoint: GET /api/manajemen/peserta/presensi/riwayat
func GetRiwayatPresensiSaya(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}
	_ = services.PastikanHariTerkunci(config.DB)

	bulan := c.Query("bulan")
	dari, sampai, bulanNormal := rentangBulan(bulan)

	var rows []models.Presensi
	if err := config.DB.
		Preload("DicatatOleh").
		Where("peserta_id = ? AND tanggal >= ? AND tanggal <= ?", pesertaID, dari, sampai).
		Order("tanggal desc").
		Find(&rows).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat riwayat presensi")
		return
	}

	kal, err := utils.MuatKalenderKerja(config.DB)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat kalender kerja")
		return
	}
	hariKerja := kal.DaftarHariKerja(dari, sampai)

	today := utils.TanggalHariIni()
	if today >= dari && today <= sampai {
		adaHariIni := false
		for _, r := range rows {
			if strings.HasPrefix(r.Tanggal, today) {
				adaHariIni = true
				break
			}
		}
		if !adaHariIni {
			info := kal.CekHari(today)
			if info.HariKerja {
				statusToday := "belum"
				ketToday := "Belum melakukan presensi hari ini"
				if izin := izinDisetujuiPada(pesertaID, today); izin != nil {
					statusToday = izin.Jenis
					ketToday = izin.Alasan
				}
				todayRow := models.Presensi{
					PesertaID:  pesertaID,
					Tanggal:    today,
					Status:     statusToday,
					Keterangan: ketToday,
					Sumber:     "sistem",
				}
				rows = append([]models.Presensi{todayRow}, rows...)
			}
		}
	}

	ringkas := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	totalMenit := 0
	for _, r := range rows {
		ringkas[r.Status]++
		totalMenit += r.MenitTerlambat
	}
	persen := 0.0
	if len(hariKerja) > 0 {
		persen = float64(ringkas["hadir"]+ringkas["terlambat"]) / float64(len(hariKerja)) * 100
	}

	utils.SuccessResponse(c, http.StatusOK, "Riwayat presensi berhasil diambil", gin.H{
		"periode": gin.H{
			"bulan":              bulanNormal,
			"dari":               dari,
			"sampai":             sampai,
			"hari_kerja_efektif": len(hariKerja),
		},
		"ringkasan": gin.H{
			"hadir":                 ringkas["hadir"],
			"terlambat":             ringkas["terlambat"],
			"izin":                  ringkas["izin"],
			"sakit":                 ringkas["sakit"],
			"alfa":                  ringkas["alfa"],
			"total_menit_terlambat": totalMenit,
			"persentase_kehadiran":  persen,
		},
		"data": rows,
	})
}

// [ROLE: PESERTA]
// GetPengajuanIzinSaya mengambil daftar riwayat permohonan izin atau sakit yang pernah diajukan oleh peserta magang login beserta status persetujuan mentor.
// Endpoint: GET /api/manajemen/peserta/pengajuan-izin
func GetPengajuanIzinSaya(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	q := config.DB.Model(&models.PengajuanIzin{}).Where("peserta_id = ?", pesertaID)
	if status := strings.TrimSpace(c.Query("status")); status != "" {
		q = q.Where("status = ?", status)
	}

	var rows []models.PengajuanIzin
	if err := q.Order("created_at desc").Find(&rows).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat pengajuan izin")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengajuan izin berhasil diambil", rows)
}

// [ROLE: PESERTA]
// BuatPengajuanIzin mengajukan permohonan izin atau sakit baru dengan mengunggah berkas surat bukti / surat dokter serta rentang tanggal ketidakhadiran.
// Endpoint: POST /api/manajemen/peserta/pengajuan-izin
func BuatPengajuanIzin(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	jenis := strings.ToLower(strings.TrimSpace(c.PostForm("jenis")))
	mulai := normalTanggal(strings.TrimSpace(c.PostForm("tanggal_mulai")))
	selesai := normalTanggal(strings.TrimSpace(c.PostForm("tanggal_selesai")))
	alasan := strings.TrimSpace(c.PostForm("alasan"))

	if jenis != "izin" && jenis != "sakit" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jenis pengajuan harus 'izin' atau 'sakit'")
		return
	}
	if mulai == "" || selesai == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal mulai dan tanggal selesai wajib diisi")
		return
	}
	if selesai < mulai {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal selesai tidak boleh lebih awal dari tanggal mulai")
		return
	}
	if len(alasan) < 10 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Alasan pengajuan minimal 10 karakter")
		return
	}

	if p := pendaftaranAktifPeserta(pesertaID); p != nil {
		if p.TanggalMulai != "" && mulai < p.TanggalMulai {
			utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal pengajuan izin tidak boleh mendahului tanggal mulai magang Anda ("+p.TanggalMulai+").")
			return
		}
		if p.TanggalSelesai != "" && selesai > p.TanggalSelesai {
			utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal pengajuan izin tidak boleh melampaui tanggal selesai magang Anda ("+p.TanggalSelesai+").")
			return
		}
	}

	var bentrok int64
	config.DB.Model(&models.PengajuanIzin{}).
		Where("peserta_id = ? AND status IN ('menunggu','disetujui')", pesertaID).
		Where("tanggal_mulai <= ? AND tanggal_selesai >= ?", selesai, mulai).
		Count(&bentrok)
	if bentrok > 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Sudah ada pengajuan pada rentang tanggal tersebut")
		return
	}

	wajibBukti := jenis == "sakit"
	extBukti := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".pdf": true}
	mimeBukti := map[string]bool{"image/jpeg": true, "image/png": true, "application/pdf": true}
	fileBukti, errFile := validateUploadedFile(c, "file_bukti", wajibBukti, extBukti, mimeBukti, "JPG, JPEG, PNG, atau PDF")
	if errFile != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, errFile.Error())
		return
	}
	pathBukti, errSave := simpanFotoPresensi(c, fileBukti, "bukti-izin")
	if errSave != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, errSave.Error())
		return
	}

	izin := models.PengajuanIzin{
		PesertaID:      pesertaID,
		Jenis:          jenis,
		TanggalMulai:   mulai,
		TanggalSelesai: selesai,
		Alasan:         alasan,
		FileBukti:      pathBukti,
		Status:         "menunggu",
	}

	var buktiLama []string
	if pathBukti != "" {
		var izinDitolak []models.PengajuanIzin
		config.DB.
			Where("peserta_id = ? AND status = 'ditolak'", pesertaID).
			Where("tanggal_mulai <= ? AND tanggal_selesai >= ?", selesai, mulai).
			Where("file_bukti <> ''").
			Find(&izinDitolak)
		for _, lama := range izinDitolak {
			buktiLama = append(buktiLama, lama.FileBukti)
		}
	}

	if err := config.DB.Create(&izin).Error; err != nil {
		cleanupUploadedFiles(pathBukti)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pengajuan izin")
		return
	}

	hapusFileLama(buktiLama...)

	go kirimEmailPengajuanIzinBaru(izin.ID)

	utils.SuccessResponse(c, http.StatusCreated, "Pengajuan berhasil dikirim, menunggu verifikasi mentor", izin)
}

// [ROLE: PESERTA]
// BatalkanPengajuanIzin membatalkan permohonan izin/sakit yang masih berstatus 'menunggu' verifikasi mentor pembimbing.
// Endpoint: DELETE /api/manajemen/peserta/pengajuan-izin/:id
func BatalkanPengajuanIzin(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var izin models.PengajuanIzin
	if err := config.DB.Where("id = ? AND peserta_id = ?", c.Param("id"), pesertaID).First(&izin).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.ErrorResponse(c, http.StatusNotFound, "Pengajuan tidak ditemukan")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memuat pengajuan")
		return
	}
	if izin.Status != "menunggu" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Pengajuan yang sudah diproses mentor tidak dapat dibatalkan")
		return
	}

	if err := config.DB.Delete(&izin).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membatalkan pengajuan")
		return
	}
	cleanupUploadedFiles(izin.FileBukti)

	config.DB.Where("ref_tabel = 'pengajuan_izins' AND ref_id = ?", izin.ID).Delete(&models.Notifikasi{})

	utils.SuccessResponse(c, http.StatusOK, "Pengajuan berhasil dibatalkan", gin.H{"id": izin.ID})
}

// [ROLE: PESERTA]
// GetLogbookPeserta mengambil riwayat catatan logbook harian, rekapitulasi kehadiran, persentase pengisian, dan informasi mentor pembimbing peserta login.
// Endpoint: GET /api/manajemen/peserta/logbook
func GetLogbookPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var user models.UserManajemen
	if err := config.DB.First(&user, pesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data peserta tidak ditemukan")
		return
	}

	var pendaftaran models.PendaftaranMagang
	hasPendaftaran := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		Order("id desc").
		First(&pendaftaran).Error == nil

	var mentorData gin.H = nil
	if hasPendaftaran && pendaftaran.MentorID != nil {
		var mentor models.UserManajemen
		if config.DB.First(&mentor, *pendaftaran.MentorID).Error == nil {
			mentorData = gin.H{
				"id":          mentor.ID,
				"nama":        mentor.Nama,
				"foto_profil": mentor.FotoProfil,
				"jabatan":     mentor.Jabatan,
				"email":       mentor.Email,
				"no_hp":       mentor.NoHp,
			}
		}
	}

	var presensiList []models.Presensi
	config.DB.
		Where("peserta_id = ?", pesertaID).
		Order("tanggal desc").
		Find(&presensiList)

	totalPresensi := len(presensiList)
	totalHadir := 0
	totalLogbookTerisi := 0
	for _, p := range presensiList {
		if p.Status == "hadir" || p.Status == "terlambat" {
			totalHadir++
			if strings.TrimSpace(p.Keterangan) != "" && p.Keterangan != "Tidak melakukan presensi" {
				totalLogbookTerisi++
			}
		}
	}

	persenLogbook := 0.0
	if totalHadir > 0 {
		persenLogbook = float64(totalLogbookTerisi) / float64(totalHadir) * 100
		if persenLogbook > 100 {
			persenLogbook = 100
		}
	}

	var landing models.PengaturanLandingPage
	config.DB.First(&landing)
	var suratSetting models.TemplateSurat
	if err := config.DB.Where("is_default = ?", true).First(&suratSetting).Error; err != nil {
		config.DB.Order("id asc").First(&suratSetting)
	}

	utils.SuccessResponse(c, http.StatusOK, "Data logbook peserta berhasil dimuat", gin.H{
		"peserta": gin.H{
			"id":            user.ID,
			"nama":          user.Nama,
			"email":         user.Email,
			"no_hp":         user.NoHp,
			"foto_profil":   user.FotoProfil,
			"status_magang": user.StatusMagang,
		},
		"pendaftaran": gin.H{
			"posisi_bidang":   pendaftaran.PosisiBidang,
			"institusi":       coalesceString(pendaftaran.AsalKampus, pendaftaran.AsalSekolah),
			"jurusan":         coalesceString(pendaftaran.ProgramStudi, pendaftaran.JurusanSekolah),
			"nim":             coalesceString(pendaftaran.NpmNim, pendaftaran.Nisn),
			"tanggal_mulai":   pendaftaran.TanggalMulai,
			"tanggal_selesai": pendaftaran.TanggalSelesai,
		},
		"mentor": mentorData,
		"instansi": gin.H{
			"nama_pemerintah": landing.SubJudulSitus,
			"nama_instansi":   landing.NamaSitus,
			"alamat_instansi": landing.AlamatLengkap,
			"logo":            landing.FileLogo,
			"pejabat_nama":    suratSetting.NamaPenandatangan,
			"pejabat_nip":     suratSetting.NipPenandatangan,
			"pejabat_jabatan": suratSetting.JabatanPenandatangan,
			"stempel":         suratSetting.FileStempel,
			"ttd_pejabat":     suratSetting.FileTtd,
		},
		"statistik": gin.H{
			"total_presensi":       totalPresensi,
			"total_hadir":          totalHadir,
			"total_logbook_terisi": totalLogbookTerisi,
			"persentase_pengisian": persenLogbook,
		},
		"logbook": presensiList,
	})
}

// [ROLE: PESERTA]
// UpdateLogbookPeserta memperbarui atau melengkapi catatan uraian aktivitas logbook kegiatan harian pada presensi tanggal tertentu.
// Endpoint: PUT /api/manajemen/peserta/logbook/:id
func UpdateLogbookPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	idParam := c.Param("id")
	presensiID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID presensi tidak valid")
		return
	}

	var presensi models.Presensi
	if err := config.DB.Where("id = ? AND peserta_id = ?", presensiID, pesertaID).First(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Catatan presensi tidak ditemukan")
		return
	}

	var req struct {
		Keterangan string `json:"keterangan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Deskripsi logbook wajib diisi")
		return
	}

	presensi.Keterangan = strings.TrimSpace(req.Keterangan)
	if err := config.DB.Save(&presensi).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui catatan logbook")
		return
	}

	// Otomatis tandai notifikasi pengingat logbook peserta sebagai sudah dibaca
	now := time.Now()
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'logbook_reminder' AND dibaca_pada IS NULL", pesertaID).
		Update("dibaca_pada", now)

	utils.SuccessResponse(c, http.StatusOK, "Catatan logbook berhasil diperbarui", presensi)
}

// ==============================================================================
// ── PENGATURAN PRESENSI (JAM KERJA & HARI LIBUR) ─────────────────────────────
// ==============================================================================

// Jam kerja default saat tabel masih kosong (di-seed otomatis).
var defaultJamKerja = []models.JamKerja{
	{Hari: "senin", JamMasuk: "08:00", JamPulang: "16:00", ToleransiTerlambat: 0, IsAktif: true},
	{Hari: "selasa", JamMasuk: "08:00", JamPulang: "16:00", ToleransiTerlambat: 0, IsAktif: true},
	{Hari: "rabu", JamMasuk: "08:00", JamPulang: "16:00", ToleransiTerlambat: 0, IsAktif: true},
	{Hari: "kamis", JamMasuk: "08:00", JamPulang: "16:00", ToleransiTerlambat: 0, IsAktif: true},
	{Hari: "jumat", JamMasuk: "08:00", JamPulang: "16:30", ToleransiTerlambat: 0, IsAktif: true},
}

type JamKerjaInput struct {
	JamMasuk           string `json:"jam_masuk" binding:"required"`
	JamPulang          string `json:"jam_pulang" binding:"required"`
	ToleransiTerlambat int    `json:"toleransi_terlambat"`
	IsAktif            *bool  `json:"is_aktif"`
}

// seedJamKerjaJikaKosong mengisi 5 hari kerja default bila tabel masih kosong.
func seedJamKerjaJikaKosong() {
	var count int64
	config.DB.Model(&models.JamKerja{}).Count(&count)
	if count == 0 {
		for _, jam := range defaultJamKerja {
			j := jam
			config.DB.Create(&j)
		}
	}
}

func validJam(s string) bool {
	_, err := time.Parse("15:04", s)
	return err == nil
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR]
// GetAllJamKerja mengambil daftar konfigurasi jam kerja kedinasan (jam masuk, jam pulang, toleransi keterlambatan) untuk setiap hari kerja aktif.
// Endpoint: GET /api/manajemen/jam-kerja (Shared) / GET /api/manajemen/admin/jam-kerja (Admin)
func GetAllJamKerja(c *gin.Context) {
	seedJamKerjaJikaKosong()

	var list []models.JamKerja
	// Urutkan sesuai urutan hari kerja (fitur MySQL FIELD()).
	if err := config.DB.
		Order("FIELD(hari, 'senin', 'selasa', 'rabu', 'kamis', 'jumat')").
		Find(&list).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data jam kerja")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Data jam kerja berhasil diambil", list)
}

// [ROLE: ADMIN]
// UpdateJamKerja memperbarui jam masuk, jam pulang, batas toleransi keterlambatan, atau status aktif hari kerja.
// Endpoint: PUT /api/manajemen/admin/jam-kerja/:id
func UpdateJamKerja(c *gin.Context) {
	id := c.Param("id")

	var jam models.JamKerja
	if err := config.DB.First(&jam, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data jam kerja tidak ditemukan")
		return
	}

	var input JamKerjaInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jam masuk dan jam pulang wajib diisi")
		return
	}

	if !validJam(input.JamMasuk) || !validJam(input.JamPulang) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format jam tidak valid (gunakan format HH:MM)")
		return
	}
	if input.JamPulang <= input.JamMasuk {
		utils.ErrorResponse(c, http.StatusBadRequest, "Jam pulang harus lebih besar dari jam masuk")
		return
	}
	if input.ToleransiTerlambat < 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Toleransi keterlambatan tidak boleh bernilai negatif")
		return
	}

	jam.JamMasuk = input.JamMasuk
	jam.JamPulang = input.JamPulang
	jam.ToleransiTerlambat = input.ToleransiTerlambat
	if input.IsAktif != nil {
		jam.IsAktif = *input.IsAktif
	}

	if err := config.DB.Save(&jam).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui jam kerja")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Jam kerja berhasil diperbarui", jam)
}

type HariLiburInput struct {
	Tanggal string `json:"tanggal" binding:"required"` // format "YYYY-MM-DD"
	Nama    string `json:"nama" binding:"required"`
}

func validTanggal(s string) bool {
	_, err := time.Parse("2006-01-02", s)
	return err == nil
}

// normalisasiTanggal mengubah berbagai format tanggal API menjadi "YYYY-MM-DD".
func normalisasiTanggal(s string) string {
	formats := []string{"2006-01-02", "2006-1-2", "2006-01-2", "2006-1-02"}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t.Format("2006-01-02")
		}
	}
	return ""
}

// [ROLE: SEMUA USER MANAJEMEN: ADMIN, MENTOR, PESERTA]
// GetAllHariLibur mengambil daftar hari libur resmi dan cuti bersama yang berlaku di sistem (dapat difilter per tahun).
// Endpoint: GET /api/manajemen/hari-libur (Shared) / GET /api/manajemen/admin/hari-libur (Admin)
func GetAllHariLibur(c *gin.Context) {
	tahun := c.Query("tahun") // opsional, filter berdasarkan tahun

	query := config.DB.Order("tanggal asc")
	if tahun != "" {
		query = query.Where("tanggal LIKE ?", tahun+"-%")
	}

	var list []models.HariLibur
	if err := query.Find(&list).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data hari libur")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Data hari libur berhasil diambil", list)
}

// [ROLE: ADMIN]
// CreateHariLibur menambahkan tanggal hari libur lokal atau cuti bersama khusus secara manual ke kalender sistem.
// Endpoint: POST /api/manajemen/admin/hari-libur
func CreateHariLibur(c *gin.Context) {
	var input HariLiburInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal dan nama hari libur wajib diisi")
		return
	}

	if !validTanggal(input.Tanggal) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format tanggal tidak valid (gunakan format YYYY-MM-DD)")
		return
	}

	var existing models.HariLibur
	if err := config.DB.Where("tanggal = ?", input.Tanggal).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal tersebut sudah terdaftar sebagai hari libur")
		return
	}

	libur := models.HariLibur{
		Tanggal: input.Tanggal,
		Nama:    input.Nama,
		Tipe:    "manual",
	}
	if err := config.DB.Create(&libur).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menambahkan hari libur")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Hari libur berhasil ditambahkan", libur)
}

// [ROLE: ADMIN]
// UpdateHariLibur memperbarui tanggal atau keterangan nama hari libur manual yang telah dibuat oleh instansi.
// Endpoint: PUT /api/manajemen/admin/hari-libur/:id
func UpdateHariLibur(c *gin.Context) {
	id := c.Param("id")

	var libur models.HariLibur
	if err := config.DB.First(&libur, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Hari libur tidak ditemukan")
		return
	}

	// Libur nasional dikelola lewat sinkronisasi, tidak boleh diedit manual.
	if libur.Tipe == "nasional" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Hari libur nasional tidak dapat diedit. Gunakan sinkronisasi untuk memperbaruinya.")
		return
	}

	var input HariLiburInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal dan nama hari libur wajib diisi")
		return
	}

	if !validTanggal(input.Tanggal) {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format tanggal tidak valid (gunakan format YYYY-MM-DD)")
		return
	}

	var existing models.HariLibur
	if err := config.DB.Where("tanggal = ? AND id <> ?", input.Tanggal, libur.ID).First(&existing).Error; err == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Tanggal tersebut sudah terdaftar sebagai hari libur")
		return
	}

	libur.Tanggal = input.Tanggal
	libur.Nama = input.Nama
	if err := config.DB.Save(&libur).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui hari libur")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Hari libur berhasil diperbarui", libur)
}

// [ROLE: ADMIN]
// DeleteHariLibur menghapus hari libur manual dari kalender sistem.
// Endpoint: DELETE /api/manajemen/admin/hari-libur/:id
func DeleteHariLibur(c *gin.Context) {
	id := c.Param("id")

	var libur models.HariLibur
	if err := config.DB.First(&libur, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Hari libur tidak ditemukan")
		return
	}

	if err := config.DB.Delete(&libur).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus hari libur")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Hari libur berhasil dihapus", nil)
}

type apiHariLiburItem struct {
	Date        string `json:"date"`
	Description string `json:"description"`
}

type apiHariLiburResponse struct {
	Status  string             `json:"status"`
	Code    int                `json:"code"`
	Data    []apiHariLiburItem `json:"data"`
	Message string             `json:"message"`
}

// [ROLE: ADMIN]
// SyncHariLiburNasional melakukan sinkronisasi otomatis kalender hari libur nasional dan cuti bersama dari API eksternal resmi ke database lokal.
// Endpoint: POST /api/manajemen/admin/hari-libur/sync-nasional
func SyncHariLiburNasional(c *gin.Context) {
	tahun := c.Query("tahun")
	if tahun == "" {
		tahun = fmt.Sprintf("%d", time.Now().Year())
	}

	url := fmt.Sprintf("https://api-hari-libur.vercel.app/api?year=%s", tahun)

	client := http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadGateway, "Gagal menghubungi layanan hari libur nasional. Pastikan server terhubung ke internet.")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		utils.ErrorResponse(c, http.StatusBadGateway, "Layanan hari libur nasional sedang tidak tersedia. Silakan coba lagi nanti.")
		return
	}

	var result apiHariLiburResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		utils.ErrorResponse(c, http.StatusBadGateway, "Format data dari layanan hari libur nasional tidak dikenali.")
		return
	}

	jumlahBaru := 0
	jumlahUpdate := 0
	for _, item := range result.Data {
		tgl := normalisasiTanggal(item.Date)
		if tgl == "" {
			continue
		}

		nama := item.Description

		var libur models.HariLibur
		err := config.DB.Where("tanggal = ?", tgl).First(&libur).Error
		if err != nil {
			// Belum ada → buat entri nasional baru.
			config.DB.Create(&models.HariLibur{Tanggal: tgl, Nama: nama, Tipe: "nasional"})
			jumlahBaru++
		} else if libur.Tipe == "nasional" && libur.Nama != nama {
			// Sudah ada & bertipe nasional → perbarui namanya bila berubah.
			// Entri instansi admin sengaja TIDAK disentuh.
			libur.Nama = nama
			config.DB.Save(&libur)
			jumlahUpdate++
		}
	}

	utils.SuccessResponse(c, http.StatusOK, fmt.Sprintf("Sinkronisasi libur nasional tahun %s berhasil", tahun), gin.H{
		"tahun":         tahun,
		"jumlah_baru":   jumlahBaru,
		"jumlah_update": jumlahUpdate,
	})
}

// ==============================================================================
// ── REKAP PRESENSI & MATRIKS PRESENSI ─────────────────────────────────────────
// ==============================================================================

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

// [ROLE: ADMIN]
// GetRekapPresensi menghasilkan data rekapitulasi kehadiran bulanan seluruh peserta magang (kehadiran, keterlambatan, izin, sakit, alfa, persentase kehadiran).
// Endpoint: GET /api/manajemen/admin/presensi/rekap
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
		adaRiwayat := a.Hadir + a.Terlambat + a.Izin + a.Sakit + a.Alfa > 0
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

// [ROLE: ADMIN]
// GetRekapPeserta mengambil rekapitulasi kehadiran individual seorang peserta magang dalam satu bulan beserta status kehadiran per hari kalender kerja.
// Endpoint: GET /api/manajemen/admin/presensi/rekap/:peserta_id
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
		Joins(`LEFT JOIN pendaftaran_magangs p ON p.id = COALESCE(pr.pendaftaran_id, (
			SELECT p2.id FROM pendaftaran_magangs p2
			WHERE p2.akun_peserta_id = pr.peserta_id
			ORDER BY p2.id DESC LIMIT 1
		))`).
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
type MatriksSel struct {
	PesertaID uint   `json:"peserta_id"`
	Tanggal   string `json:"tanggal"`
	Status    string `json:"status"`
	Terlambat int    `json:"menit_terlambat"`
}

// [ROLE: ADMIN]
// GetMatriksPresensi menghasilkan data matriks kehadiran (peserta × tanggal hari kerja) dalam satu bulan untuk visualisasi tabel grid presensi admin.
// Endpoint: GET /api/manajemen/admin/presensi/rekap/matriks
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