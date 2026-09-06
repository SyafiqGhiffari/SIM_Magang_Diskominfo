package controllers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// Batas ukuran & jenis berkas yang boleh dikirim lewat chat.
const maksUkuranLampiran = 5 * 1024 * 1024 // 5 MB

var extGambar = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true,
}

// Format video yang bisa diputar langsung di peramban tanpa pemutar tambahan.
var extVideo = map[string]bool{
	".mp4": true, ".webm": true, ".mov": true,
}

var extDokumen = map[string]bool{
	".pdf": true, ".doc": true, ".docx": true,
	".xls": true, ".xlsx": true, ".zip": true,
}

// simpanLampiran menangani bagian yang sama antara pengunggahan oleh admin dan
// oleh peserta: validasi, penyimpanan berkas, dan penentuan tipe pesan.
func simpanLampiran(c *gin.Context, sesiID uint) (*models.ChatMessage, error) {
	file, err := c.FormFile("file")
	if err != nil {
		return nil, fmt.Errorf("berkas wajib dilampirkan")
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	tipe := ""
	switch {
	case extGambar[ext]:
		tipe = "gambar"
	case extVideo[ext]:
		tipe = "video"
	case extDokumen[ext]:
		tipe = "berkas"
	default:
		return nil, fmt.Errorf("format tidak didukung. Gunakan JPG, PNG, WEBP, MP4, WEBM, MOV, PDF, DOC, DOCX, XLS, XLSX, atau ZIP")
	}

	// Video diberi kelonggaran karena 5MB terlalu ketat bahkan untuk rekaman
	// beberapa detik dari ponsel.
	batas := int64(maksUkuranLampiran)
	if tipe == "video" {
		batas = 20 * 1024 * 1024
	}
	if file.Size > batas {
		return nil, fmt.Errorf("ukuran berkas maksimal %dMB", batas/1024/1024)
	}

	// Validasi signature biner asli file untuk mencegah file berbahaya
	if err := utils.ValidateFileMagicBytes(file, nil); err != nil {
		return nil, err
	}

	uploadDir := filepath.Join("uploads", "chat")
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return nil, fmt.Errorf("gagal membuat folder unggahan")
	}

	// Nama berkas diacak agar tidak saling menimpa dan tidak bisa ditebak.
	namaSimpan := fmt.Sprintf("chat_%d_%d%s", sesiID, time.Now().UnixNano(), ext)
	fullPath := filepath.Join(uploadDir, namaSimpan)
	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		return nil, fmt.Errorf("gagal menyimpan berkas")
	}

	return &models.ChatMessage{
		SessionID: sesiID,
		Tipe:      tipe,
		Content:   strings.TrimSpace(c.PostForm("content")),
		FilePath:  strings.ReplaceAll(fullPath, "\\", "/"),
		FileNama:  file.Filename,
		FileSize:  file.Size,
	}, nil
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Kirim lampiran
// POST /api/manajemen/admin/chat/session/:id/lampiran
// ─────────────────────────────────────────────────────────────────────────────

func AdminKirimLampiran(c *gin.Context) {
	var sesi models.ChatSession
	if err := config.DB.First(&sesi, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sesi chat tidak ditemukan")
		return
	}

	pesan, err := simpanLampiran(c, sesi.ID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	pesan.SenderType = "admin"
	pesan.IsReadAdmin = true
	if r := c.PostForm("reply_to_id"); r != "" {
		var id uint
		if _, e := fmt.Sscan(r, &id); e == nil && id > 0 {
			pesan.ReplyToID = &id
		}
	}

	if err := config.DB.Create(pesan).Error; err != nil {
		_ = os.Remove(pesan.FilePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pesan")
		return
	}

	sekarang := time.Now()
	config.DB.Model(&sesi).Updates(map[string]interface{}{
		"last_message_at":   sekarang,
		"unread_user_count": gorm_expr_tambah(sesi.UnreadUserCount),
	})

	config.DB.Preload("ReplyTo").First(pesan, pesan.ID)
	utils.SuccessResponse(c, http.StatusOK, "Lampiran terkirim", pesan)
}

// gorm_expr_tambah menaikkan penghitung sebesar satu.
func gorm_expr_tambah(nilai int) int { return nilai + 1 }

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Hapus pesan (hapus lunak)
// DELETE /api/manajemen/admin/chat/pesan/:id
// ─────────────────────────────────────────────────────────────────────────────

func AdminHapusPesan(c *gin.Context) {
	var pesan models.ChatMessage
	if err := config.DB.First(&pesan, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Pesan tidak ditemukan")
		return
	}
	if pesan.DihapusPada != nil {
		utils.SuccessResponse(c, http.StatusOK, "Pesan sudah dihapus sebelumnya", nil)
		return
	}

	sekarang := time.Now()

	// Baris pesan tetap disimpan (hapus lunak) agar jejak percakapan utuh,
	// tetapi berkas fisiknya dibuang supaya folder unggahan tidak membengkak.
	// Nama & ukuran berkas dikosongkan sekalian, karena berkasnya sudah tiada.
	pembaruan := map[string]interface{}{"dihapus_pada": sekarang}

	if pesan.FilePath != "" {
		jalur := filepath.Clean(pesan.FilePath)

		// Pengaman: hanya berkas di dalam folder unggahan chat yang boleh
		// dihapus, sehingga jalur yang cacat tidak bisa menyentuh berkas lain.
		if strings.HasPrefix(jalur, filepath.Join("uploads", "chat")) {
			if err := os.Remove(jalur); err != nil && !os.IsNotExist(err) {
				// Kegagalan menghapus berkas tidak membatalkan penghapusan pesan;
				// yang penting isinya tidak lagi bisa diakses dari antarmuka.
				fmt.Printf("[chat] gagal menghapus berkas %s: %v\n", jalur, err)
			}
		}

		pembaruan["file_path"] = ""
		pembaruan["file_nama"] = ""
		pembaruan["file_size"] = 0
	}

	config.DB.Model(&pesan).Updates(pembaruan)
	utils.SuccessResponse(c, http.StatusOK, "Pesan dihapus", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Sematkan / lepas sematan percakapan
// PUT /api/manajemen/admin/chat/session/:id/sematkan
// ─────────────────────────────────────────────────────────────────────────────

func AdminSematkanSesi(c *gin.Context) {
	var sesi models.ChatSession
	if err := config.DB.First(&sesi, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sesi tidak ditemukan")
		return
	}
	baru := !sesi.IsPinnedAdmin
	config.DB.Model(&sesi).Update("is_pinned_admin", baru)

	pesan := "Percakapan disematkan"
	if !baru {
		pesan = "Sematan dilepas"
	}
	utils.SuccessResponse(c, http.StatusOK, pesan, gin.H{"is_pinned_admin": baru})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Tandai percakapan sebagai belum dibaca
// PUT /api/manajemen/admin/chat/session/:id/tandai-belum-dibaca
// ─────────────────────────────────────────────────────────────────────────────

func AdminTandaiBelumDibaca(c *gin.Context) {
	var sesi models.ChatSession
	if err := config.DB.First(&sesi, c.Param("id")).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Sesi tidak ditemukan")
		return
	}
	config.DB.Model(&sesi).Update("admin_marked_unread", true)
	utils.SuccessResponse(c, http.StatusOK, "Ditandai belum dibaca", nil)
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Kirim lampiran
// POST /api/pendaftaran/chat/lampiran
// ─────────────────────────────────────────────────────────────────────────────

func PesertaKirimLampiran(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var sesi models.ChatSession
	if err := config.DB.Where("user_pendaftaran_id = ? AND status = 'open'", userID).
		First(&sesi).Error; err != nil {
		// Sesi dibuat otomatis bila peserta langsung mengirim berkas
		sesi = models.ChatSession{UserPendaftaranID: userID, Status: "open"}
		if err := config.DB.Create(&sesi).Error; err != nil {
			utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat sesi chat")
			return
		}
	}

	pesan, err := simpanLampiran(c, sesi.ID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	pesan.SenderType = "user"
	pesan.IsReadUser = true
	if r := c.PostForm("reply_to_id"); r != "" {
		var id uint
		if _, e := fmt.Sscan(r, &id); e == nil && id > 0 {
			pesan.ReplyToID = &id
		}
	}

	if err := config.DB.Create(pesan).Error; err != nil {
		_ = os.Remove(pesan.FilePath)
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan pesan")
		return
	}

	sekarang := time.Now()
	config.DB.Model(&sesi).Updates(map[string]interface{}{
		"last_message_at":    sekarang,
		"unread_admin_count": sesi.UnreadAdminCount + 1,
		"admin_marked_unread": false,
	})

	config.DB.Preload("ReplyTo").First(pesan, pesan.ID)
	utils.SuccessResponse(c, http.StatusOK, "Lampiran terkirim", pesan)
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Denyut keberadaan
// PUT /api/pendaftaran/denyut
//
// Dipanggil berkala oleh dasbor peserta. Sengaja dibuat sangat ringan karena
// frekuensinya tinggi — hanya satu UPDATE tanpa SELECT.
// ─────────────────────────────────────────────────────────────────────────────

func PesertaDenyut(c *gin.Context) {
	// Memakai pembantu yang sama dengan controller lain, karena tipe user_id
	// di context bisa float64, uint, atau int tergantung jalur autentikasinya.
	userID, ok := getUserIDFromContext(c)
	if !ok || userID == 0 {
		c.Status(http.StatusUnauthorized)
		return
	}
	config.DB.Model(&models.UserPendaftaran{}).
		Where("id = ?", userID).
		Update("last_active_at", time.Now())
	c.Status(http.StatusNoContent)
}