package controllers

import (
	"net/http"
	"strconv"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

func filterNotifikasi(c *gin.Context) (role string, userID uint) {
	role = c.GetString("role")
	userID = uint(c.GetFloat64("user_id"))
	return
}

// GET /api/manajemen/notifikasi?only_unread=true&limit=20
func GetNotifikasiSaya(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	limit := 20
	if l, err := strconv.Atoi(c.Query("limit")); err == nil && l > 0 && l <= 100 {
		limit = l
	}

	q := config.DB.Where(
		"target_role = ? AND (target_user_id IS NULL OR target_user_id = ?)",
		role, userID,
	)
	if c.Query("only_unread") == "true" {
		q = q.Where("dibaca_pada IS NULL")
	}
	if tipe := c.Query("tipe"); tipe != "" {
		q = q.Where("tipe = ?", tipe)
	}

	var list []models.Notifikasi
	if err := q.Order("created_at DESC").Limit(limit).Find(&list).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil notifikasi")
		return
	}

	var unread int64
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = ? AND (target_user_id IS NULL OR target_user_id = ?) AND dibaca_pada IS NULL", role, userID).
		Count(&unread)

	utils.SuccessResponse(c, http.StatusOK, "Notifikasi berhasil diambil", gin.H{
		"items":        list,
		"unread_count": unread,
	})
}

// GET /api/manajemen/notifikasi/unread-count
func GetUnreadNotifikasiCount(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	var unread int64
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = ? AND (target_user_id IS NULL OR target_user_id = ?) AND dibaca_pada IS NULL", role, userID).
		Count(&unread)

	utils.SuccessResponse(c, http.StatusOK, "Jumlah notifikasi belum dibaca", gin.H{"unread_count": unread})
}

// PUT /api/manajemen/notifikasi/:id/baca
func BacaNotifikasi(c *gin.Context) {
	role, userID := filterNotifikasi(c)
	id := c.Param("id")

	var notif models.Notifikasi
	if err := config.DB.Where(
		"id = ? AND target_role = ? AND (target_user_id IS NULL OR target_user_id = ?)",
		id, role, userID,
	).First(&notif).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Notifikasi tidak ditemukan")
		return
	}

	if notif.DibacaPada == nil {
		now := time.Now()
		notif.DibacaPada = &now
		config.DB.Save(&notif)
	}

	utils.SuccessResponse(c, http.StatusOK, "Notifikasi ditandai sudah dibaca", notif)
}

// PUT /api/manajemen/notifikasi/baca-semua
func BacaSemuaNotifikasi(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	if err := config.DB.Model(&models.Notifikasi{}).
		Where("target_role = ? AND (target_user_id IS NULL OR target_user_id = ?) AND dibaca_pada IS NULL", role, userID).
		Update("dibaca_pada", time.Now()).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menandai notifikasi")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Semua notifikasi ditandai sudah dibaca", nil)
}

// DELETE /api/manajemen/notifikasi/:id
func HapusNotifikasi(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	if err := config.DB.Where(
		"id = ? AND target_role = ? AND (target_user_id IS NULL OR target_user_id = ?)",
		c.Param("id"), role, userID,
	).Delete(&models.Notifikasi{}).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus notifikasi")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Notifikasi berhasil dihapus", nil)
}

// DELETE /api/manajemen/notifikasi/semua/hapus
// Pola URL "/semua/hapus" dipakai (bukan "/semua") agar tidak bertabrakan
// dengan rute wildcard "/:id" di pohon router Gin.
func HapusSemuaNotifikasi(c *gin.Context) {
	role, userID := filterNotifikasi(c)

	if err := config.DB.Where(
		"target_role = ? AND (target_user_id IS NULL OR target_user_id = ?)",
		role, userID,
	).Delete(&models.Notifikasi{}).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus semua notifikasi")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Semua notifikasi berhasil dihapus", nil)
}