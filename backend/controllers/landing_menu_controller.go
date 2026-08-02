package controllers

import (
	"net/http"
	"strings"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// pathMenuLanding = WHITELIST route yang boleh muncul di menu.
// Ini satu-satunya sumber kebenaran untuk tujuan link.
// Admin tidak bisa menambah / mengubah isi map ini dari web manajemen,
// sehingga tidak mungkin ada menu yang mengarah ke halaman tidak ada.
var pathMenuLanding = map[string]string{
	"beranda":        "/",
	"tentang":        "/tentang",
	"program-magang": "/program-magang",
	"persyaratan":    "/persyaratan",
	"faq":            "/faq",
	"kontak":         "/kontak",
}

// seedMenuLandingJikaKosong mengisi menu bawaan persis seperti
// yang sekarang masih hardcoded di Navbar.jsx dan Footer.jsx.
func seedMenuLandingJikaKosong() {
	var jumlah int64
	config.DB.Model(&models.LandingMenu{}).Count(&jumlah)
	if jumlah > 0 {
		return
	}

	bawaan := []models.LandingMenu{
		{Kode: "beranda", Label: "Beranda", LabelFooter: "Beranda Portal", Urutan: 1, TampilNavbar: true, TampilFooter: true},
		{Kode: "tentang", Label: "Tentang", LabelFooter: "Tentang Program", Urutan: 2, TampilNavbar: true, TampilFooter: true},
		{Kode: "program-magang", Label: "Program Magang", LabelFooter: "Pilihan Bidang Magang", Urutan: 3, TampilNavbar: true, TampilFooter: true},
		{Kode: "persyaratan", Label: "Persyaratan", LabelFooter: "Ketentuan & Syarat", Urutan: 4, TampilNavbar: true, TampilFooter: true},
		{Kode: "faq", Label: "FAQ", LabelFooter: "Pertanyaan Populer (FAQ)", Urutan: 5, TampilNavbar: true, TampilFooter: true},
		{Kode: "kontak", Label: "Kontak", LabelFooter: "Hubungi Kami", Urutan: 6, TampilNavbar: true, TampilFooter: false},
	}

	for i := range bawaan {
		config.DB.Create(&bawaan[i])
	}
}

// menuLandingPublik mengembalikan dua daftar siap pakai untuk Navbar & Footer.
func menuLandingPublik() gin.H {
	seedMenuLandingJikaKosong()

	var semua []models.LandingMenu
	config.DB.Order("urutan asc, id asc").Find(&semua)

	navbar := make([]gin.H, 0)
	footer := make([]gin.H, 0)

	for _, m := range semua {
		path, ok := pathMenuLanding[m.Kode]
		if !ok {
			// Kode tidak dikenali (misal sisa data lama) → abaikan, jangan render.
			continue
		}

		if m.TampilNavbar && strings.TrimSpace(m.Label) != "" {
			navbar = append(navbar, gin.H{
				"kode":  m.Kode,
				"label": m.Label,
				"path":  path,
			})
		}

		if m.TampilFooter {
			label := strings.TrimSpace(m.LabelFooter)
			if label == "" {
				label = m.Label
			}
			if label != "" {
				footer = append(footer, gin.H{
					"kode":  m.Kode,
					"label": label,
					"path":  path,
				})
			}
		}
	}

	return gin.H{"navbar": navbar, "footer": footer}
}

// ==================== ENDPOINT ADMIN ====================

func GetMenuLanding(c *gin.Context) {
	seedMenuLandingJikaKosong()

	var semua []models.LandingMenu
	if err := config.DB.Order("urutan asc, id asc").Find(&semua).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil menu navigasi")
		return
	}

	hasil := make([]gin.H, 0, len(semua))
	for _, m := range semua {
		hasil = append(hasil, gin.H{
			"id":            m.ID,
			"kode":          m.Kode,
			"path":          pathMenuLanding[m.Kode], // hanya untuk ditampilkan, read-only
			"label":         m.Label,
			"label_footer":  m.LabelFooter,
			"urutan":        m.Urutan,
			"tampil_navbar": m.TampilNavbar,
			"tampil_footer": m.TampilFooter,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "Menu navigasi berhasil diambil", hasil)
}

type menuLandingInput struct {
	Label        *string `json:"label"`
	LabelFooter  *string `json:"label_footer"`
	TampilNavbar *bool   `json:"tampil_navbar"`
	TampilFooter *bool   `json:"tampil_footer"`
}

// UpdateMenuLanding sengaja TIDAK menerima perubahan kode/path.
func UpdateMenuLanding(c *gin.Context) {
	var menu models.LandingMenu
	if err := config.DB.First(&menu, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Menu tidak ditemukan")
		return
	}

	var input menuLandingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}

	if input.Label != nil {
		label := strings.TrimSpace(*input.Label)
		if label == "" {
			utils.ErrorResponse(c, http.StatusBadRequest, "Label menu tidak boleh kosong")
			return
		}
		menu.Label = label
	}
	if input.LabelFooter != nil {
		menu.LabelFooter = strings.TrimSpace(*input.LabelFooter)
	}
	if input.TampilNavbar != nil {
		menu.TampilNavbar = *input.TampilNavbar
	}
	if input.TampilFooter != nil {
		menu.TampilFooter = *input.TampilFooter
	}

	if err := config.DB.Save(&menu).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan menu")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Menu berhasil disimpan", menu)
}

// UrutkanMenuLanding menerima { "urutan": [id1, id2, ...] } sesuai posisi baru.
func UrutkanMenuLanding(c *gin.Context) {
	var body struct {
		Urutan []uint `json:"urutan"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}

	for i, id := range body.Urutan {
		config.DB.Model(&models.LandingMenu{}).Where("id = ?", id).Update("urutan", i+1)
	}

	utils.SuccessResponse(c, http.StatusOK, "Urutan menu berhasil disimpan", nil)
}