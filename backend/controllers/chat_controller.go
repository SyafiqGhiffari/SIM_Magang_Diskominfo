package controllers

import (
	"net/http"
	"strings"
	"time"
	"unicode"

	"sim-magang-backend/config"
	"sim-magang-backend/models"

	"github.com/gin-gonic/gin"
)

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Tokenize teks (hapus tanda baca, ubah ke huruf kecil, pisah kata)
// ─────────────────────────────────────────────────────────────────────────────

// stopWords adalah kata-kata umum Bahasa Indonesia yang tidak bermakna untuk pencocokan
var stopWords = map[string]bool{
	"yang": true, "di": true, "ke": true, "dari": true, "dan": true, "atau": true,
	"untuk": true, "dengan": true, "pada": true, "ini": true, "itu": true,
	"adalah": true, "ada": true, "saya": true, "kami": true, "kita": true,
	"anda": true, "kak": true, "bang": true, "pak": true, "bu": true,
	"bagaimana": true, "cara": true, "apa": true, "apakah": true,
	"gimana": true, "bisa": true, "boleh": true,
	"kapan": true, "berapa": true, "siapa": true, "mana": true,
	"jika": true, "kalau": true, "mau": true, "ingin": true,
	"tolong": true, "mohon": true, "dong": true, "ya": true, "yg": true,
	"nya": true, "sih": true, "deh": true, "nih": true, "lah": true,
	"sudah": true, "belum": true, "tidak": true, "bukan": true, "gak": true,
	"tak": true, "nggak": true, "tapi": true, "tetapi": true, "namun": true,
}

func tokenize(text string) map[string]bool {
	text = strings.ToLower(text)
	// Hapus tanda baca, sisakan spasi dan huruf/angka
	var sb strings.Builder
	for _, r := range text {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == ' ' {
			sb.WriteRune(r)
		} else {
			sb.WriteRune(' ')
		}
	}
	tokens := make(map[string]bool)
	for _, word := range strings.Fields(sb.String()) {
		if len(word) > 1 && !stopWords[word] {
			tokens[word] = true
		}
	}
	return tokens
}

// jaccardSimilarity menghitung kesamaan dua teks (0.0 – 1.0)
// levenshteinDistance menghitung jarak edit antara dua string (typo tolerance)
func levenshteinDistance(s1, s2 string) int {
	r1 := []rune(s1)
	r2 := []rune(s2)
	len1 := len(r1)
	len2 := len(r2)

	column := make([]int, len1+1)
	for y := 1; y <= len1; y++ {
		column[y] = y
	}

	for x := 1; x <= len2; x++ {
		column[0] = x
		lastkey := x - 1
		for y := 1; y <= len1; y++ {
			oldkey := column[y]
			var incr int
			if r1[y-1] != r2[x-1] {
				incr = 1
			}
			// minimum helper
			min := column[y] + 1
			if column[y-1]+1 < min {
				min = column[y-1] + 1
			}
			if lastkey+incr < min {
				min = lastkey + incr
			}
			column[y] = min
			lastkey = oldkey
		}
	}
	return column[len1]
}

// jaccardFuzzySimilarity menghitung kesamaan dua teks dengan toleransi typo kata
func jaccardFuzzySimilarity(a, b string) float64 {
	setA := tokenize(a)
	setB := tokenize(b)
	if len(setA) == 0 || len(setB) == 0 {
		return 0
	}

	intersection := 0
	for wordA := range setA {
		matched := false
		if setB[wordA] {
			matched = true
		} else {
			// Cek apakah ada kata yang sangat mirip di setB (toleransi typo)
			for wordB := range setB {
				dist := levenshteinDistance(wordA, wordB)
				maxLen := len(wordA)
				if len(wordB) > maxLen {
					maxLen = len(wordB)
				}
				allowedDist := 1
				if maxLen > 6 {
					allowedDist = 2
				}
				if dist <= allowedDist {
					matched = true
					break
				}
			}
		}
		if matched {
			intersection++
		}
	}

	union := len(setA) + len(setB) - intersection
	if union <= 0 {
		return 0
	}
	return float64(intersection) / float64(union)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Cari FAQ yang paling cocok secara offline (Fuzzy Jaccard Similarity)
// ─────────────────────────────────────────────────────────────────────────────

const similarityThreshold = 0.20 // Minimal 20% kesamaan dengan toleransi typo

func findBestFAQ(message string) *models.FaqEntry {
	var entries []models.FaqEntry
	config.DB.Where("is_active = ?", true).Find(&entries)
	if len(entries) == 0 {
		return nil
	}

	msgLower := strings.ToLower(strings.TrimSpace(message))

	// ── TAHAP 1: Keyword manual (jika admin mengisi keywords) ──
	for i, entry := range entries {
		if entry.Keywords == "" {
			continue
		}
		keywords := strings.Split(entry.Keywords, ",")
		for _, kw := range keywords {
			kw = strings.TrimSpace(strings.ToLower(kw))
			if kw != "" && strings.Contains(msgLower, kw) {
				return &entries[i]
			}
		}
	}

	// ── TAHAP 2: Jaccard Fuzzy Similarity terhadap pertanyaan FAQ ──
	bestIdx := -1
	bestScore := 0.0
	for i, entry := range entries {
		score := jaccardFuzzySimilarity(message, entry.Question)
		if score > bestScore {
			bestScore = score
			bestIdx = i
		}
	}
	if bestScore >= similarityThreshold {
		return &entries[bestIdx]
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Ambil atau buat sesi chat aktif
// POST /api/pendaftaran/chat/session
// ─────────────────────────────────────────────────────────────────────────────

func GetOrCreateChatSession(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var session models.ChatSession
	result := config.DB.Where("user_pendaftaran_id = ? AND status = 'open'", userID).
		First(&session)

	if result.Error != nil {
		// Buat sesi baru
		now := time.Now()
		session = models.ChatSession{
			UserPendaftaranID: userID,
			Status:            "open",
			LastMessageAt:     &now,
		}
		if err := config.DB.Create(&session).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal membuat sesi chat"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    session,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Ambil pesan dalam sesi (polling)
// GET /api/pendaftaran/chat/messages?session_id=X&after_id=Y
// ─────────────────────────────────────────────────────────────────────────────

func GetChatMessages(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var session models.ChatSession
	if err := config.DB.Where("user_pendaftaran_id = ? AND status = 'open'", userID).
		First(&session).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": []interface{}{}})
		return
	}

	// Mark pesan admin/bot sebagai sudah dibaca user
	config.DB.Model(&models.ChatMessage{}).
		Where("session_id = ? AND sender_type IN ('admin','bot') AND is_read_user = false", session.ID).
		Update("is_read_user", true)

	// Reset unread count untuk user
	config.DB.Model(&session).Update("unread_user_count", 0)

	var messages []models.ChatMessage
	config.DB.Where("session_id = ?", session.ID).
		Order("created_at asc").
		Find(&messages)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"session_id": session.ID,
		"data":       messages,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Kirim pesan (dengan FAQ auto-reply check)
// POST /api/pendaftaran/chat/message
// ─────────────────────────────────────────────────────────────────────────────

func SendChatMessage(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var body struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Isi pesan tidak boleh kosong"})
		return
	}
	body.Content = strings.TrimSpace(body.Content)
	if body.Content == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Isi pesan tidak boleh kosong"})
		return
	}

	// Ambil atau buat sesi
	var session models.ChatSession
	result := config.DB.Where("user_pendaftaran_id = ? AND status = 'open'", userID).First(&session)
	if result.Error != nil {
		now := time.Now()
		session = models.ChatSession{
			UserPendaftaranID: userID,
			Status:            "open",
			LastMessageAt:     &now,
		}
		config.DB.Create(&session)
	}

	// Simpan pesan user
	now := time.Now()
	userMsg := models.ChatMessage{
		SessionID:   session.ID,
		SenderType:  "user",
		Content:     body.Content,
		IsReadAdmin: false,
		IsReadUser:  true,
	}
	config.DB.Create(&userMsg)

	// Update sesi
	config.DB.Model(&session).Updates(map[string]interface{}{
		"last_message_at":    now,
		"unread_admin_count": session.UnreadAdminCount + 1,
	})

	var botReply *models.ChatMessage

	// Cek kecocokan FAQ (keyword → similarity → Gemini AI)
	if faq := findBestFAQ(body.Content); faq != nil {
		reply := models.ChatMessage{
			SessionID:   session.ID,
			SenderType:  "bot",
			Content:     faq.Answer,
			IsReadAdmin: true,
			IsReadUser:  false,
		}
		config.DB.Create(&reply)
		botReply = &reply

		// Reset unread admin (bot yang jawab, bukan admin)
		config.DB.Model(&session).Updates(map[string]interface{}{
			"unread_admin_count": 0,
			"unread_user_count":  session.UnreadUserCount + 1,
		})
	}

	resp := gin.H{
		"success":     true,
		"message":     "Pesan berhasil dikirim",
		"data":        userMsg,
		"bot_replied": botReply != nil,
	}
	if botReply != nil {
		resp["bot_reply"] = botReply
	}

	c.JSON(http.StatusCreated, resp)
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Jumlah pesan belum dibaca (dari admin/bot)
// GET /api/pendaftaran/chat/unread
// ─────────────────────────────────────────────────────────────────────────────

func GetChatUnreadCount(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))

	var session models.ChatSession
	if err := config.DB.Where("user_pendaftaran_id = ? AND status = 'open'", userID).
		First(&session).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "unread": 0})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"unread":  session.UnreadUserCount,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIK: Cek status online admin (tidak perlu autentikasi)
// GET /api/chat/admin-status
// ─────────────────────────────────────────────────────────────────────────────

func GetAdminOnlineStatus(c *gin.Context) {
	var count int64
	config.DB.Model(&models.UserManajemen{}).
		Where("role = 'admin' AND status_akun = 'aktif' AND is_online = true").
		Count(&count)

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"is_online": count > 0,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Ambil daftar FAQ publik (untuk suggested questions)
// GET /api/pendaftaran/chat/faq
// ─────────────────────────────────────────────────────────────────────────────

func GetPublicFAQ(c *gin.Context) {
	var entries []models.FaqEntry
	config.DB.Where("is_active = ?", true).
		Select("id, question, answer, is_quick_action").
		Order("created_at asc").
		Find(&entries)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    entries,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Ambil daftar Quick Action aktif (tombol pintasan di chat widget)
// GET /api/pendaftaran/chat/quick-actions
// ─────────────────────────────────────────────────────────────────────────────

func GetQuickActions(c *gin.Context) {
	var entries []models.FaqEntry
	config.DB.Where("is_active = ? AND is_quick_action = ?", true, true).
		Select("id, question, answer").
		Order("created_at asc").
		Limit(5).
		Find(&entries)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    entries,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Gunakan Quick Action — catat ke riwayat chat
// POST /api/pendaftaran/chat/quick-action/:id
// ─────────────────────────────────────────────────────────────────────────────

func UseQuickAction(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))
	faqID := c.Param("id")

	// Ambil FAQ
	var faq models.FaqEntry
	if err := config.DB.Where("id = ? AND is_active = ? AND is_quick_action = ?", faqID, true, true).
		First(&faq).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Quick action tidak ditemukan"})
		return
	}

	// Ambil atau buat sesi
	var session models.ChatSession
	result := config.DB.Where("user_pendaftaran_id = ? AND status = 'open'", userID).First(&session)
	if result.Error != nil {
		now := time.Now()
		session = models.ChatSession{
			UserPendaftaranID: userID,
			Status:            "open",
			LastMessageAt:     &now,
		}
		config.DB.Create(&session)
	}

	now := time.Now()

	// Simpan pesan user (label quick action)
	userMsg := models.ChatMessage{
		SessionID:   session.ID,
		SenderType:  "user",
		Content:     faq.Question,
		IsReadAdmin: false,
		IsReadUser:  true,
	}
	config.DB.Create(&userMsg)

	// Simpan balasan bot (jawaban quick action)
	botMsg := models.ChatMessage{
		SessionID:   session.ID,
		SenderType:  "bot",
		Content:     faq.Answer,
		IsReadAdmin: true,
		IsReadUser:  false,
	}
	config.DB.Create(&botMsg)

	// Update sesi
	config.DB.Model(&session).Updates(map[string]interface{}{
		"last_message_at": now,
	})

	c.JSON(http.StatusCreated, gin.H{
		"success":   true,
		"user_msg":  userMsg,
		"bot_reply": botMsg,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Ambil semua sesi chat
// GET /api/manajemen/admin/chat/sessions
// ─────────────────────────────────────────────────────────────────────────────

func AdminGetChatSessions(c *gin.Context) {
	type SessionWithUser struct {
		models.ChatSession
		Nama  string `json:"nama"`
		Email string `json:"email"`
	}

	var sessions []models.ChatSession
	config.DB.Preload("UserPendaftaran").
		Order("last_message_at desc").
		Find(&sessions)

	type SessionResp struct {
		ID               uint       `json:"id"`
		Status           string     `json:"status"`
		LastMessageAt    *time.Time `json:"last_message_at"`
		UnreadAdminCount int        `json:"unread_admin_count"`
		CreatedAt        time.Time  `json:"created_at"`
		UserID           uint       `json:"user_id"`
		UserNama         string     `json:"user_nama"`
		UserEmail        string     `json:"user_email"`
		LastMessage      string     `json:"last_message"`
	}

	var result []SessionResp
	for _, s := range sessions {
		// Ambil pesan terakhir
		var lastMsg models.ChatMessage
		config.DB.Where("session_id = ?", s.ID).Order("created_at desc").First(&lastMsg)

		result = append(result, SessionResp{
			ID:               s.ID,
			Status:           s.Status,
			LastMessageAt:    s.LastMessageAt,
			UnreadAdminCount: s.UnreadAdminCount,
			CreatedAt:        s.CreatedAt,
			UserID:           s.UserPendaftaran.ID,
			UserNama:         s.UserPendaftaran.Nama,
			UserEmail:        s.UserPendaftaran.Email,
			LastMessage:      lastMsg.Content,
		})
	}

	if result == nil {
		result = []SessionResp{}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": result})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Ambil pesan dalam satu sesi
// GET /api/manajemen/admin/chat/session/:id/messages
// ─────────────────────────────────────────────────────────────────────────────

func AdminGetSessionMessages(c *gin.Context) {
	sessionID := c.Param("id")

	// Mark semua pesan user sebagai sudah dibaca admin
	config.DB.Model(&models.ChatMessage{}).
		Where("session_id = ? AND sender_type = 'user' AND is_read_admin = false", sessionID).
		Update("is_read_admin", true)

	// Reset unread count
	config.DB.Model(&models.ChatSession{}).
		Where("id = ?", sessionID).
		Update("unread_admin_count", 0)

	var messages []models.ChatMessage
	config.DB.Where("session_id = ?", sessionID).
		Order("created_at asc").
		Find(&messages)

	c.JSON(http.StatusOK, gin.H{"success": true, "data": messages})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Balas pesan
// POST /api/manajemen/admin/chat/session/:id/reply
// ─────────────────────────────────────────────────────────────────────────────

func AdminReplyChatSession(c *gin.Context) {
	sessionID := c.Param("id")

	var body struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Isi balasan tidak boleh kosong"})
		return
	}

	var session models.ChatSession
	if err := config.DB.First(&session, sessionID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Sesi tidak ditemukan"})
		return
	}

	now := time.Now()
	msg := models.ChatMessage{
		SessionID:   session.ID,
		SenderType:  "admin",
		Content:     strings.TrimSpace(body.Content),
		IsReadAdmin: true,
		IsReadUser:  false,
	}
	config.DB.Create(&msg)

	config.DB.Model(&session).Updates(map[string]interface{}{
		"last_message_at":   now,
		"unread_user_count": session.UnreadUserCount + 1,
	})

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": msg})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Tutup sesi
// PUT /api/manajemen/admin/chat/session/:id/close
// ─────────────────────────────────────────────────────────────────────────────

func AdminCloseChatSession(c *gin.Context) {
	sessionID := c.Param("id")
	if err := config.DB.Model(&models.ChatSession{}).
		Where("id = ?", sessionID).
		Update("status", "closed").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menutup sesi"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Sesi chat berhasil ditutup"})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: CRUD FAQ
// ─────────────────────────────────────────────────────────────────────────────

func AdminGetFAQ(c *gin.Context) {
	var entries []models.FaqEntry
	config.DB.Order("created_at desc").Find(&entries)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": entries})
}

func AdminCreateFAQ(c *gin.Context) {
	adminID := uint(c.GetFloat64("user_id"))
	var body struct {
		Question      string `json:"question"       binding:"required"`
		Answer        string `json:"answer"         binding:"required"`
		Keywords      string `json:"keywords"`
		IsActive      *bool  `json:"is_active"`
		IsQuickAction *bool  `json:"is_quick_action"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	isActive := true
	if body.IsActive != nil {
		isActive = *body.IsActive
	}
	isQuickAction := false
	if body.IsQuickAction != nil {
		isQuickAction = *body.IsQuickAction
	}

	entry := models.FaqEntry{
		Question:      strings.TrimSpace(body.Question),
		Answer:        strings.TrimSpace(body.Answer),
		Keywords:      strings.TrimSpace(body.Keywords),
		IsActive:      isActive,
		IsQuickAction: isQuickAction,
		CreatedByID:   adminID,
	}
	config.DB.Create(&entry)
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": entry})
}

func AdminUpdateFAQ(c *gin.Context) {
	id := c.Param("id")
	var entry models.FaqEntry
	if err := config.DB.First(&entry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "FAQ tidak ditemukan"})
		return
	}

	var body struct {
		Question      string `json:"question"`
		Answer        string `json:"answer"`
		Keywords      string `json:"keywords"`
		IsActive      *bool  `json:"is_active"`
		IsQuickAction *bool  `json:"is_quick_action"`
	}
	c.ShouldBindJSON(&body)

	updates := map[string]interface{}{}
	if body.Question != "" {
		updates["question"] = strings.TrimSpace(body.Question)
	}
	if body.Answer != "" {
		updates["answer"] = strings.TrimSpace(body.Answer)
	}
	if body.Keywords != "" {
		updates["keywords"] = strings.TrimSpace(body.Keywords)
	}
	if body.IsActive != nil {
		updates["is_active"] = *body.IsActive
	}
	if body.IsQuickAction != nil {
		updates["is_quick_action"] = *body.IsQuickAction
	}

	config.DB.Model(&entry).Updates(updates)
	config.DB.First(&entry, id)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": entry})
}

func AdminDeleteFAQ(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB.Delete(&models.FaqEntry{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menghapus FAQ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "FAQ berhasil dihapus"})
}
