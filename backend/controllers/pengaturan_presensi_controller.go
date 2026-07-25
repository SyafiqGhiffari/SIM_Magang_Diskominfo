package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// ==================== JAM KERJA ====================

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

// ==================== HARI LIBUR ====================

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

// ==================== SINKRONISASI LIBUR NASIONAL ====================

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