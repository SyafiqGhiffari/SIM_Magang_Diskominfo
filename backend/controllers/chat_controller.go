package controllers

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ═════════════════════════════════════════════════════════════════════════════
// TAHAP 5 — ANALITIK FAQ & AKSI MASSAL
// ═════════════════════════════════════════════════════════════════════════════

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

// sinonimKata menyamakan istilah yang bermakna sama agar pencocokan tidak
// gagal hanya karena peserta memakai kata sehari-hari. Nilai di kanan adalah
// bentuk baku yang dipakai internal.
var sinonimKata = map[string]string{
	// Dokumen
	"berkas": "dokumen", "file": "dokumen", "fail": "dokumen",
	"lampiran": "dokumen", "scan": "dokumen", "softcopy": "dokumen",

	// Pendaftaran
	"registrasi": "daftar", "regis": "daftar", "mendaftar": "daftar",
	"pendaftaran": "daftar", "apply": "daftar", "melamar": "daftar",

	// Magang
	"pkl": "magang", "internship": "magang", "intern": "magang",
	"prakerin": "magang",

	// Persyaratan
	"persyaratan": "syarat", "ketentuan": "syarat", "kualifikasi": "syarat",
	"kriteria": "syarat",

	// Sertifikat
	"sertif": "sertifikat", "sertipikat": "sertifikat", "piagam": "sertifikat",

	// Unggah
	"upload": "unggah", "mengupload": "unggah", "mengunggah": "unggah",
	"submit": "unggah", "kirim": "unggah",

	// Unduh
	"download": "unduh", "mendownload": "unduh", "mengunduh": "unduh",

	// Jadwal
	"waktu": "jadwal", "tanggal": "jadwal", "periode": "jadwal",
	"durasi": "jadwal", "lama": "jadwal",

	// Akun
	"password": "sandi", "pw": "sandi", "kata sandi": "sandi",
	"akun": "akun", "email": "akun", "username": "akun",

	// Status
	"diterima": "status", "ditolak": "status", "lolos": "status",
	"verifikasi": "status", "hasil": "status", "pengumuman": "status",

	// Surat
	"sk": "surat", "balasan": "surat", "penerimaan": "surat",
	"pengantar": "surat", "rekomendasi": "surat",

	// Revisi
	"perbaikan": "revisi", "perbaiki": "revisi", "ganti": "revisi",
	"ubah": "revisi", "edit": "revisi",

	// Lokasi
	"alamat": "lokasi", "tempat": "lokasi", "kantor": "lokasi",
	"bidang": "bidang", "divisi": "bidang", "penempatan": "bidang",

	// Presensi
	"absen": "presensi", "absensi": "presensi", "kehadiran": "presensi",
	"izin": "izin", "sakit": "izin", "cuti": "izin",
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Ekspor & impor FAQ dalam bentuk CSV
// ─────────────────────────────────────────────────────────────────────────────

// kolomCSVFaq adalah urutan baku kolom pada berkas ekspor. Urutan ini juga
// menjadi acuan berkas contoh, tetapi impor tidak bergantung pada urutan —
// ia membaca nama kolom pada baris pertama.
var kolomCSVFaq = []string{
	"id",
	"question",
	"answer",
	"keywords",
	"category",
	"is_active",
	"show_on_landing",
	"is_quick_action",
	"quick_label",
	"action_type",
	"action_target",
	"quick_icon",
	"tampil_saat_status",
	"order_index",
	"view_count",
	"helpful_count",
	"unhelpful_count",
}

// awalanUmum dan akhiranUmum dipakai untuk memangkas imbuhan Bahasa Indonesia
// secara sederhana. Urutan penting: yang terpanjang diperiksa lebih dulu agar
// "mengunggah" tidak salah dipangkas menjadi "ngunggah".
var awalanUmum = []string{"menge", "meng", "meny", "mem", "men", "peng", "peny", "pem", "pen", "per", "ber", "ter", "me", "di", "ke", "se"}
var akhiranUmum = []string{"kannya", "annya", "nya", "kan", "an", "i"}

// akarKata memangkas imbuhan bila hasilnya masih cukup panjang untuk bermakna.
// Ini bukan stemmer linguistik penuh, hanya penyederhana praktis yang cukup
// untuk kebutuhan pencocokan FAQ.
func akarKata(kata string) string {
	const panjangMinimal = 4

	for _, awalan := range awalanUmum {
		if len(kata) > len(awalan)+panjangMinimal-1 && strings.HasPrefix(kata, awalan) {
			kata = kata[len(awalan):]
			break
		}
	}

	for _, akhiran := range akhiranUmum {
		if len(kata) > len(akhiran)+panjangMinimal-1 && strings.HasSuffix(kata, akhiran) {
			kata = kata[:len(kata)-len(akhiran)]
			break
		}
	}

	return kata
}

// normalisasiKata mengubah satu kata menjadi bentuk baku yang dipakai
// saat mencocokkan. Sinonim diperiksa dua kali: sebelum dan sesudah
// pemangkasan imbuhan.
func normalisasiKata(kata string) string {
	kata = strings.ToLower(kata)

	if baku, ada := sinonimKata[kata]; ada {
		return baku
	}

	dasar := akarKata(kata)
	if baku, ada := sinonimKata[dasar]; ada {
		return baku
	}

	return dasar
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
		if len(word) <= 1 || stopWords[word] {
			continue
		}
		// Simpan bentuk baku, bukan bentuk mentah, supaya "berkasnya"
		// dan "dokumen" bertemu di token yang sama.
		baku := normalisasiKata(word)
		if baku != "" && !stopWords[baku] {
			tokens[baku] = true
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
// HELPER: Penilaian gabungan tiga sumber bukti
// ─────────────────────────────────────────────────────────────────────────────

// Bobot dipilih agar kata kunci yang diisi admin tetap paling menentukan,
// tetapi tidak lagi menjadi satu-satunya penentu seperti sebelumnya.
const (
	bobotKeyword = 0.45
	bobotJaccard = 0.35
	bobotJawaban = 0.20

	ambangJawab = 0.55 // cukup yakin -> jawab langsung
	ambangSaran = 0.30 // ragu -> tawarkan pilihan
)

// skorKeyword mengukur berapa bagian dari kata kunci admin yang muncul di
// pesan peserta. Mengembalikan 0 bila admin tidak mengisi kata kunci, sehingga
// FAQ tanpa keyword tetap bisa menang lewat dua komponen lainnya.
func skorKeyword(pesanBaku map[string]bool, keywords string) float64 {
	if strings.TrimSpace(keywords) == "" {
		return 0
	}

	total := 0
	cocok := 0

	for _, kw := range strings.Split(keywords, ",") {
		kw = strings.TrimSpace(strings.ToLower(kw))
		if kw == "" {
			continue
		}
		total++

		// Kata kunci boleh terdiri dari beberapa kata; semuanya harus hadir.
		bagian := strings.Fields(kw)
		semuaAda := len(bagian) > 0
		for _, b := range bagian {
			if !pesanBaku[normalisasiKata(b)] {
				semuaAda = false
				break
			}
		}
		if semuaAda {
			cocok++
		}
	}

	if total == 0 {
		return 0
	}
	return float64(cocok) / float64(total)
}

// skorTeksJawaban memberi nilai tambahan bila isi jawaban menyinggung kata
// yang ditanyakan. Berguna untuk FAQ berjudul pendek namun berisi panjang.
func skorTeksJawaban(pesanBaku map[string]bool, jawaban string) float64 {
	if len(pesanBaku) == 0 {
		return 0
	}

	tokenJawaban := tokenize(jawaban)
	if len(tokenJawaban) == 0 {
		return 0
	}

	cocok := 0
	for kata := range pesanBaku {
		if tokenJawaban[kata] {
			cocok++
		}
	}
	return float64(cocok) / float64(len(pesanBaku))
}

// hitungSkorFAQ menggabungkan ketiga komponen menjadi satu nilai 0.0 – 1.0.
func hitungSkorFAQ(pesan string, pesanBaku map[string]bool, e *models.FaqEntry) float64 {
	sk := skorKeyword(pesanBaku, e.Keywords)
	sj := jaccardFuzzySimilarity(pesan, e.Question)
	sa := skorTeksJawaban(pesanBaku, e.Answer)

	skor := bobotKeyword*sk + bobotJaccard*sj + bobotJawaban*sa

	if skor > 1 {
		skor = 1
	}
	return skor
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Cari FAQ yang paling cocok secara offline (Fuzzy Jaccard Similarity)
// ─────────────────────────────────────────────────────────────────────────────

const similarityThreshold = 0.20 // Minimal 20% kesamaan dengan toleransi typo

// findBestFAQ mengembalikan FAQ yang cukup meyakinkan untuk dijawab langsung.
// Bila tidak ada yang melewati ambang, hasilnya nil dan pemanggil sebaiknya
// menawarkan saran lewat cariKandidatFAQ.
func findBestFAQ(message string) *models.FaqEntry {
	var entries []models.FaqEntry
	config.DB.Where("is_active = ?", true).Find(&entries)
	if len(entries) == 0 {
		return nil
	}

	msgLower := strings.ToLower(strings.TrimSpace(message))
	pesanBaku := tokenize(message)

	// ── JALUR CEPAT: peserta mengetik kata kunci nyaris persis ──
	// Hanya berlaku untuk kata kunci yang cukup panjang, agar kata pendek
	// seperti "sk" tidak menyambar pertanyaan yang sebenarnya berbeda.
	for i := range entries {
		if entries[i].Keywords == "" {
			continue
		}
		for _, kw := range strings.Split(entries[i].Keywords, ",") {
			kw = strings.TrimSpace(strings.ToLower(kw))
			if len(kw) < 5 {
				continue
			}
			if msgLower == kw || strings.Contains(" "+msgLower+" ", " "+kw+" ") {
				return &entries[i]
			}
		}
	}

	// ── JALUR UTAMA: skor gabungan tiga komponen ──
	indeksTerbaik := -1
	skorTerbaik := 0.0
	for i := range entries {
		skor := hitungSkorFAQ(message, pesanBaku, &entries[i])
		if skor > skorTerbaik {
			skorTerbaik = skor
			indeksTerbaik = i
		}
	}

	if indeksTerbaik >= 0 && skorTerbaik >= ambangJawab {
		return &entries[indeksTerbaik]
	}

	return nil
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Ambil beberapa kandidat FAQ beserta skornya (untuk saran otomatis)
// ─────────────────────────────────────────────────────────────────────────────

type KandidatFAQ struct {
	ID       uint    `json:"id"`
	Question string  `json:"question"`
	Answer   string  `json:"answer"`
	Category string  `json:"category"`
	Skor     float64 `json:"skor"`
}

// cariKandidatFAQ mengembalikan hingga `maks` FAQ paling mirip, terurut menurun.
func cariKandidatFAQ(message string, maks int) []KandidatFAQ {
	var entries []models.FaqEntry
	config.DB.Where("is_active = ?", true).Find(&entries)
	if len(entries) == 0 {
		return []KandidatFAQ{}
	}

	pesanBaku := tokenize(message)
	hasil := make([]KandidatFAQ, 0, len(entries))

	for i := range entries {
		e := &entries[i]
		skor := hitungSkorFAQ(message, pesanBaku, e)
		if skor <= 0 {
			continue
		}

		hasil = append(hasil, KandidatFAQ{
			ID: e.ID, Question: e.Question, Answer: e.Answer,
			Category: e.Category, Skor: skor,
		})
	}

	sort.Slice(hasil, func(a, b int) bool { return hasil[a].Skor > hasil[b].Skor })

	if len(hasil) > maks {
		hasil = hasil[:maks]
	}
	return hasil
}

// skorTertinggi mengambil nilai kecocokan terbaik, 0 bila tidak ada kandidat.
func skorTertinggi(message string) float64 {
	k := cariKandidatFAQ(message, 1)
	if len(k) == 0 {
		return 0
	}
	return k[0].Skor
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
	var saranFAQ []KandidatFAQ
	var faqTerjawabID *uint // FAQ sumber jawaban, dipakai widget untuk tombol jempol

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
		faqTerjawabID = &faq.ID

		config.DB.Model(faq).UpdateColumn("view_count", gorm.Expr("view_count + 1"))

		// Reset unread admin (bot yang jawab, bukan admin)
		config.DB.Model(&session).Updates(map[string]interface{}{
			"unread_admin_count": 0,
			"unread_user_count":  session.UnreadUserCount + 1,
		})
	} else {
		// Tidak cukup yakin untuk menjawab, tapi mungkin ada yang mendekati.
		// Ambil kandidat di zona ragu-ragu untuk ditawarkan sebagai pilihan.
		for _, k := range cariKandidatFAQ(body.Content, 3) {
			if k.Skor >= ambangSaran {
				saranFAQ = append(saranFAQ, k)
			}
		}

		if len(saranFAQ) > 0 {
			isi := "Maaf, saya belum sepenuhnya menangkap maksud Anda. Mungkin salah satu ini yang dicari?"
			balasan := models.ChatMessage{
				SessionID:   session.ID,
				SenderType:  "bot",
				Content:     isi,
				IsReadAdmin: true,
				IsReadUser:  false,
			}
			config.DB.Create(&balasan)
			botReply = &balasan

			config.DB.Model(&session).Updates(map[string]interface{}{
				"unread_user_count": session.UnreadUserCount + 1,
			})
		}
	}

	// Notifikasi in-app untuk admin.
	// Digabungkan per sesi (Gabungkan=true) supaya bell tidak dibanjiri.
	var namaPengirim string
	var pendaftar models.UserPendaftaran
	if err := config.DB.First(&pendaftar, userID).Error; err == nil && pendaftar.Nama != "" {
		namaPengirim = pendaftar.Nama
	} else {
		namaPengirim = "Pendaftar"
	}

	sesiID := session.ID
	if botReply != nil && len(saranFAQ) > 0 {
		// Bot menawarkan tebakan — admin perlu tahu, tapi tidak mendesak
		go services.KirimNotifikasiAdmin(
			"chat_baru",
			"Chatbot ragu menjawab",
			fmt.Sprintf("%s: \"%s\" — bot hanya menawarkan saran, mungkin perlu FAQ baru.",
				namaPengirim, potongTeks(body.Content, 80)),
			"chat_sessions", &sesiID,
			fmt.Sprintf("/admin?chat=%d", sesiID),
			"normal", true,
		)

		// Tetap dicatat sebagai bahan FAQ, karena jawaban pasti belum ada
		go catatPertanyaanTakTerjawab(
			namaPengirim, pendaftar.Email, body.Content,
			"chat_bot", &sesiID, c.ClientIP(),
		)
	} else if botReply == nil {
		// Tidak ada FAQ yang cocok -> catat sebagai bahan FAQ baru
		go catatPertanyaanTakTerjawab(
			namaPengirim, pendaftar.Email, body.Content,
			"chat_bot", &sesiID, c.ClientIP(),
		)

		// Tidak ada FAQ yang cocok -> benar-benar butuh balasan admin
		go services.KirimNotifikasiAdmin(
			"chat_baru",
			"Pesan chat belum terjawab",
			fmt.Sprintf("%s: \"%s\" — belum terjawab otomatis, butuh balasan admin.",
				namaPengirim, potongTeks(body.Content, 80)),
			"chat_sessions", &sesiID,
			fmt.Sprintf("/admin?chat=%d", sesiID),
			"tinggi", true,
		)
	} else {
		go services.KirimNotifikasiAdmin(
			"chat_baru",
			"Pesan chat baru",
			fmt.Sprintf("%s: \"%s\" — sudah dijawab otomatis oleh FAQ.",
				namaPengirim, potongTeks(body.Content, 80)),
			"chat_sessions", &sesiID,
			fmt.Sprintf("/admin?chat=%d", sesiID),
			"rendah", true,
		)
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
	if len(saranFAQ) > 0 {
		resp["saran"] = saranFAQ
	}
	if faqTerjawabID != nil {
		resp["faq_id"] = *faqTerjawabID
	}

	c.JSON(http.StatusCreated, resp)
}

// potongTeks memendekkan isi pesan agar rapi di dropdown notifikasi.
func potongTeks(s string, maks int) string {
	r := []rune(s)
	if len(r) <= maks {
		return s
	}
	return string(r[:maks]) + "…"
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
		Select("id, question, answer, category, order_index, is_quick_action").
		Order("order_index asc, id asc").
		Find(&entries)

	if entries == nil {
		entries = []models.FaqEntry{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    entries,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Ambil daftar Quick Action aktif (tombol pintasan di chat widget)
// GET /api/pendaftaran/chat/quick-actions
// ─────────────────────────────────────────────────────────────────────────────

// MaxQuickAction adalah batas tombol pintasan yang boleh tampil di chat widget.
const MaxQuickAction = 6

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACTION BERTIPE — validasi & konstanta
// ─────────────────────────────────────────────────────────────────────────────

var tipeAksiSah = map[string]bool{
	"jawaban":  true,
	"navigasi": true,
	"unduh":    true,
	"eskalasi": true,
	"status":   true,
}

var statusPendaftaranSah = map[string]bool{
	"belum_daftar": true, // sudah punya akun tapi belum mengisi formulir
	"menunggu":     true,
	"revisi":       true,
	"diterima":     true,
	"ditolak":      true,
}

// validasiAksi memastikan kombinasi tipe + target masuk akal sebelum disimpan.
func validasiAksi(tipe, target string) error {
	tipe = strings.TrimSpace(tipe)
	target = strings.TrimSpace(target)

	if !tipeAksiSah[tipe] {
		return fmt.Errorf("tipe aksi \"%s\" tidak dikenal", tipe)
	}

	switch tipe {
	case "navigasi":
		if target == "" {
			return fmt.Errorf("tipe navigasi wajib mengisi tujuan halaman, contoh: /dashboard?tab=status")
		}
		if !strings.HasPrefix(target, "/") {
			return fmt.Errorf("tujuan navigasi harus diawali garis miring, contoh: /dashboard")
		}
	case "unduh":
		if target == "" {
			return fmt.Errorf("tipe unduh wajib mengisi alamat berkas")
		}
		if !strings.HasPrefix(target, "/") &&
			!strings.HasPrefix(target, "http://") &&
			!strings.HasPrefix(target, "https://") {
			return fmt.Errorf("alamat berkas harus diawali /, http:// atau https://")
		}
	}
	return nil
}

// validasiFilterStatus memeriksa daftar status yang dipisah koma.
func validasiFilterStatus(daftar string) (string, error) {
	daftar = strings.TrimSpace(daftar)
	if daftar == "" {
		return "", nil
	}

	bagian := strings.Split(daftar, ",")
	bersih := make([]string, 0, len(bagian))
	for _, b := range bagian {
		b = strings.TrimSpace(strings.ToLower(b))
		if b == "" {
			continue
		}
		if !statusPendaftaranSah[b] {
			return "", fmt.Errorf("status \"%s\" tidak dikenal", b)
		}
		bersih = append(bersih, b)
	}
	return strings.Join(bersih, ","), nil
}

// statusPendaftaranUser mengambil status pendaftaran terkini seorang pengguna.
func statusPendaftaranUser(userID uint) (string, *models.PendaftaranMagang) {
	var p models.PendaftaranMagang
	err := config.DB.Where("user_pendaftaran_id = ?", userID).
		Order("created_at desc").
		First(&p).Error
	if err != nil {
		return "belum_daftar", nil
	}
	if p.StatusPendaftaran == "" {
		return "menunggu", &p
	}
	return p.StatusPendaftaran, &p
}

// cocokStatus memeriksa apakah tombol boleh tampil untuk status tertentu.
func cocokStatus(filter, status string) bool {
	filter = strings.TrimSpace(filter)
	if filter == "" {
		return true // tanpa filter = tampil untuk semua
	}
	for _, s := range strings.Split(filter, ",") {
		if strings.TrimSpace(s) == status {
			return true
		}
	}
	return false
}

type QuickActionResp struct {
	ID           uint   `json:"id"`
	Question     string `json:"question"`
	Answer       string `json:"answer"`
	Label        string `json:"label"`         // teks yang dipakai di tombol
	ActionType   string `json:"action_type"`   // jawaban | navigasi | unduh | eskalasi | status
	ActionTarget string `json:"action_target"` // tujuan navigasi / alamat berkas
	Icon         string `json:"icon"`          // nama ikon lucide-react
}

func GetQuickActions(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))
	statusUser, _ := statusPendaftaranUser(userID)

	// Ambil semua kandidat dulu, penyaringan konteks dilakukan di Go
	// agar tetap terbaca dan tidak bergantung pada FIND_IN_SET MySQL.
	var entries []models.FaqEntry
	config.DB.Where("is_active = ? AND is_quick_action = ?", true, true).
		Order("order_index asc, id asc").
		Find(&entries)

	data := make([]QuickActionResp, 0, MaxQuickAction)
	for _, e := range entries {
		if !cocokStatus(e.TampilSaatStatus, statusUser) {
			continue
		}

		label := strings.TrimSpace(e.QuickLabel)
		if label == "" {
			label = e.Question
		}

		tipe := e.ActionType
		if tipe == "" {
			tipe = "jawaban"
		}

		data = append(data, QuickActionResp{
			ID:           e.ID,
			Question:     e.Question,
			Answer:       e.Answer,
			Label:        label,
			ActionType:   tipe,
			ActionTarget: e.ActionTarget,
			Icon:         e.QuickIcon,
		})

		if len(data) >= MaxQuickAction {
			break
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"data":        data,
		"status_user": statusUser,
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

	// Pastikan tombol ini memang boleh dipakai oleh status pengguna saat ini
	statusUser, dataPendaftaran := statusPendaftaranUser(userID)
	if !cocokStatus(faq.TampilSaatStatus, statusUser) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Pintasan ini tidak tersedia untuk status pendaftaran Anda saat ini",
		})
		return
	}

	tipeAksi := faq.ActionType
	if tipeAksi == "" {
		tipeAksi = "jawaban"
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

	// ── Rakit balasan sesuai tipe aksi ──
	isiBalasan := faq.Answer
	butuhAdmin := false

	switch tipeAksi {
	case "status":
		isiBalasan = rakitJawabanStatus(statusUser, dataPendaftaran, faq.Answer)

	case "eskalasi":
		butuhAdmin = true
		if strings.TrimSpace(isiBalasan) == "" {
			isiBalasan = "Baik, pertanyaan Anda sudah kami teruskan ke admin Diskominfo. " +
				"Mohon tunggu, admin akan membalas di ruang obrolan ini pada jam kerja " +
				"(Senin–Jumat, 07.30–15.30 WIB)."
		}

	case "navigasi":
		if strings.TrimSpace(isiBalasan) == "" {
			isiBalasan = "Silakan lanjutkan di halaman yang terbuka berikut ini."
		}

	case "unduh":
		if strings.TrimSpace(isiBalasan) == "" {
			isiBalasan = "Berkas sedang diunduh. Jika tidak terunduh otomatis, gunakan tautan pada tombol tadi."
		}
	}

	// Simpan balasan bot
	botMsg := models.ChatMessage{
		SessionID:   session.ID,
		SenderType:  "bot",
		Content:     isiBalasan,
		IsReadAdmin: true,
		IsReadUser:  false,
	}
	config.DB.Create(&botMsg)

	// Update sesi
	pembaruan := map[string]interface{}{"last_message_at": now}
	if butuhAdmin {
		pembaruan["unread_admin_count"] = gorm.Expr("unread_admin_count + 1")
	}
	config.DB.Model(&session).Updates(pembaruan)

	// Eskalasi: beri tahu admin dengan prioritas tinggi
	if butuhAdmin {
		sesiID := session.ID
		go services.KirimNotifikasiAdmin(
			"chat_baru",
			"Peserta meminta bantuan admin",
			fmt.Sprintf("Pintasan \"%s\" ditekan oleh peserta. Mohon segera dibalas.",
				potongTeks(faq.Question, 60)),
			"chat_sessions", &sesiID,
			fmt.Sprintf("/admin?chat=%d", sesiID),
			"tinggi", false,
		)
	}

	c.JSON(http.StatusCreated, gin.H{
		"success":       true,
		"user_msg":      userMsg,
		"bot_reply":     botMsg,
		"action_type":   tipeAksi,
		"action_target": faq.ActionTarget,
	})
}

// rakitJawabanStatus membangun balasan dinamis berdasarkan data pendaftaran.
// `pengantar` adalah teks Answer dari admin, dipakai sebagai kalimat pembuka.
func rakitJawabanStatus(status string, p *models.PendaftaranMagang, pengantar string) string {
	var b strings.Builder

	if teks := strings.TrimSpace(pengantar); teks != "" {
		b.WriteString(teks)
		b.WriteString("\n\n")
	}

	switch status {
	case "belum_daftar":
		b.WriteString("Anda belum mengisi formulir pendaftaran magang.\n\n")
		b.WriteString("Silakan buka menu Formulir Pendaftaran di dasbor untuk memulai. " +
			"Siapkan surat pengantar dari kampus/sekolah dalam format PDF (maksimal 2 MB).")

	case "menunggu":
		b.WriteString("Status pendaftaran Anda: MENUNGGU VERIFIKASI.\n\n")
		if p != nil {
			b.WriteString(fmt.Sprintf("Formulir diterima pada %s.\n",
				p.CreatedAt.Format("2 January 2006")))
		}
		b.WriteString("Berkas Anda sedang diperiksa admin. Proses verifikasi umumnya " +
			"memakan waktu 3–5 hari kerja. Anda akan menerima pemberitahuan lewat email " +
			"begitu ada perkembangan.")

	case "revisi":
		b.WriteString("Status pendaftaran Anda: PERLU REVISI.\n\n")
		b.WriteString("Ada berkas yang perlu Anda perbaiki. Silakan buka menu Revisi Dokumen " +
			"di dasbor untuk melihat catatan admin dan mengunggah ulang berkas yang diminta.")

	case "diterima":
		b.WriteString("Selamat! Status pendaftaran Anda: DITERIMA.\n\n")
		b.WriteString("Surat penerimaan dapat Anda unduh dari dasbor. " +
			"Akun peserta magang juga akan dibuatkan oleh admin agar Anda bisa " +
			"mengakses presensi harian.")

	case "ditolak":
		b.WriteString("Status pendaftaran Anda: BELUM DAPAT DITERIMA.\n\n")
		b.WriteString("Mohon maaf, pengajuan Anda belum dapat kami terima pada periode ini. " +
			"Alasan lengkapnya tercantum di dasbor. Anda dipersilakan mendaftar kembali " +
			"pada periode berikutnya.")

	default:
		b.WriteString("Status pendaftaran Anda belum dapat kami baca. " +
			"Silakan tekan tombol Hubungi Admin agar dibantu langsung.")
	}

	return b.String()
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
		config.DB.Where("session_id = ?", s.ID).
			Order("created_at desc").
			Limit(1).
			Find(&lastMsg)

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
// PESERTA: Buka jawaban dari chip saran
// POST /api/pendaftaran/chat/saran/:id
// ─────────────────────────────────────────────────────────────────────────────

// BukaSaranFAQ dipanggil ketika peserta menekan salah satu chip
// "Mungkin maksud Anda". Jawaban FAQ dikirim sebagai pesan bot sungguhan
// supaya tersimpan di riwayat percakapan.
func BukaSaranFAQ(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))
	faqID := c.Param("id")

	var faq models.FaqEntry
	if err := config.DB.Where("id = ? AND is_active = ?", faqID, true).First(&faq).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "FAQ tidak ditemukan"})
		return
	}

	var session models.ChatSession
	if err := config.DB.Where("user_pendaftaran_id = ? AND status = 'open'", userID).
		First(&session).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Sesi chat tidak ditemukan"})
		return
	}

	now := time.Now()

	// Pertanyaan ditampilkan sebagai ucapan peserta agar alurnya terbaca wajar
	pesanUser := models.ChatMessage{
		SessionID:   session.ID,
		SenderType:  "user",
		Content:     faq.Question,
		IsReadAdmin: false,
		IsReadUser:  true,
	}
	config.DB.Create(&pesanUser)

	balasan := models.ChatMessage{
		SessionID:   session.ID,
		SenderType:  "bot",
		Content:     faq.Answer,
		IsReadAdmin: true,
		IsReadUser:  false,
	}
	config.DB.Create(&balasan)

	config.DB.Model(&session).Updates(map[string]interface{}{
		"last_message_at":   now,
		"unread_user_count": session.UnreadUserCount + 1,
	})

	// Peserta menemukan jawabannya sendiri — tidak perlu merepotkan admin
	config.DB.Model(&faq).UpdateColumn("view_count", gorm.Expr("view_count + 1"))

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"user_msg":  pesanUser,
		"bot_reply": balasan,
		"faq_id":    faq.ID,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PESERTA: Nilai jawaban bot
// POST /api/pendaftaran/chat/faq/:id/feedback
// ─────────────────────────────────────────────────────────────────────────────

func KirimFeedbackFAQ(c *gin.Context) {
	userID := uint(c.GetFloat64("user_id"))
	faqID := c.Param("id")

	var body struct {
		Membantu  *bool  `json:"membantu" binding:"required"`
		MessageID *uint  `json:"message_id"`
		Catatan   string `json:"catatan"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format penilaian tidak valid"})
		return
	}

	var faq models.FaqEntry
	if err := config.DB.First(&faq, faqID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "FAQ tidak ditemukan"})
		return
	}

	catatan := strings.TrimSpace(body.Catatan)
	if len([]rune(catatan)) > 300 {
		catatan = string([]rune(catatan)[:300])
	}

	var sesiID *uint
	var session models.ChatSession
	if err := config.DB.Where("user_pendaftaran_id = ? AND status = 'open'", userID).
		First(&session).Error; err == nil {
		sesiID = &session.ID
	}

	// Cari penilaian sebelumnya untuk pesan yang sama
	var lama models.FaqFeedback
	kueri := config.DB.Where("faq_id = ? AND user_pendaftaran_id = ?", faq.ID, userID)
	if body.MessageID != nil {
		kueri = kueri.Where("message_id = ?", *body.MessageID)
	} else {
		kueri = kueri.Where("message_id IS NULL")
	}
	sudahAda := kueri.First(&lama).Error == nil

	if sudahAda {
		if lama.Membantu == *body.Membantu {
			// Menekan tombol yang sama dua kali — tidak ada yang berubah
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Terima kasih atas penilaian Anda",
				"ulangan": true,
			})
			return
		}

		// Berubah pikiran: pindahkan satu hitungan dari sisi lama ke sisi baru
		naik, turun := "helpful_count", "unhelpful_count"
		if !*body.Membantu {
			naik, turun = "unhelpful_count", "helpful_count"
		}
		config.DB.Model(&faq).UpdateColumns(map[string]interface{}{
			naik:  gorm.Expr(naik + " + 1"),
			turun: gorm.Expr("GREATEST(" + turun + " - 1, 0)"),
		})

		config.DB.Model(&lama).Updates(map[string]interface{}{
			"membantu": *body.Membantu,
			"catatan":  catatan,
		})

		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Penilaian diperbarui"})
		return
	}

	entri := models.FaqFeedback{
		FaqID:             faq.ID,
		SessionID:         sesiID,
		MessageID:         body.MessageID,
		UserPendaftaranID: &userID,
		Membantu:          *body.Membantu,
		Catatan:           catatan,
	}
	if err := config.DB.Create(&entri).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan penilaian"})
		return
	}

	kolom := "helpful_count"
	if !*body.Membantu {
		kolom = "unhelpful_count"
	}
	config.DB.Model(&faq).UpdateColumn(kolom, gorm.Expr(kolom+" + 1"))

	// Jawaban yang berulang kali dinilai buruk perlu perhatian admin.
	// Ambang 3 dipilih agar satu-dua peserta yang kebetulan tidak puas
	// tidak langsung memicu notifikasi.
	if !*body.Membantu {
		var burukTotal int64
		config.DB.Model(&models.FaqFeedback{}).
			Where("faq_id = ? AND membantu = ?", faq.ID, false).
			Count(&burukTotal)

		if burukTotal == 3 || burukTotal == 10 {
			refID := faq.ID
			go services.KirimNotifikasiAdmin(
				"faq_kurang_membantu",
				"Jawaban FAQ dinilai kurang membantu",
				fmt.Sprintf("\"%s\" sudah %d kali dinilai tidak membantu. Pertimbangkan memperbaiki jawabannya.",
					potongTeks(faq.Question, 60), burukTotal),
				"faq_entries", &refID,
				"/admin/faq",
				"normal", false,
			)
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Terima kasih atas penilaian Anda"})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: CRUD FAQ
// ─────────────────────────────────────────────────────────────────────────────

func AdminGetFAQ(c *gin.Context) {
	var entries []models.FaqEntry
	config.DB.Order("order_index asc, id asc").Find(&entries)

	if entries == nil {
		entries = []models.FaqEntry{}
	}

	// Hitung berapa quick action yang aktif, supaya UI admin bisa memberi peringatan
	var jumlahQuickAction int64
	config.DB.Model(&models.FaqEntry{}).
		Where("is_active = ? AND is_quick_action = ?", true, true).
		Count(&jumlahQuickAction)

	// Ringkasan untuk kartu statistik di panel admin
	var totalPenilaian int64
	config.DB.Model(&models.FaqFeedback{}).Count(&totalPenilaian)

	var totalMembantu int64
	config.DB.Model(&models.FaqFeedback{}).Where("membantu = ?", true).Count(&totalMembantu)

	// FAQ bermasalah: sudah dinilai minimal 3 kali dan mayoritas negatif
	var perluDiperbaiki int64
	config.DB.Model(&models.FaqEntry{}).
		Where("helpful_count + unhelpful_count >= 3 AND unhelpful_count > helpful_count").
		Count(&perluDiperbaiki)

	c.JSON(http.StatusOK, gin.H{
		"success":            true,
		"data":               entries,
		"quick_action_aktif": jumlahQuickAction,
		"quick_action_maks":  MaxQuickAction,
		"total_penilaian":    totalPenilaian,
		"total_membantu":     totalMembantu,
		"perlu_diperbaiki":   perluDiperbaiki,
	})
}

func AdminCreateFAQ(c *gin.Context) {
	adminID := uint(c.GetFloat64("user_id"))

	var body struct {
		Question         string `json:"question" binding:"required"`
		Answer           string `json:"answer" binding:"required"`
		Keywords         string `json:"keywords"`
		Category         string `json:"category"`
		QuickLabel       string `json:"quick_label"`
		OrderIndex       *int   `json:"order_index"`
		IsActive         *bool  `json:"is_active"`
		ShowOnLanding    *bool  `json:"show_on_landing"`
		IsQuickAction    *bool  `json:"is_quick_action"`
		ActionType       string `json:"action_type"`
		ActionTarget     string `json:"action_target"`
		QuickIcon        string `json:"quick_icon"`
		TampilSaatStatus string `json:"tampil_saat_status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Pertanyaan dan jawaban wajib diisi"})
		return
	}

	pertanyaan := strings.TrimSpace(body.Question)

	// Cegah pertanyaan duplikat
	var duplikat int64
	config.DB.Model(&models.FaqEntry{}).
		Where("LOWER(question) = ?", strings.ToLower(pertanyaan)).
		Count(&duplikat)
	if duplikat > 0 {
		c.JSON(http.StatusConflict, gin.H{"success": false, "message": "FAQ dengan pertanyaan yang sama sudah ada"})
		return
	}

	isActive := true
	if body.IsActive != nil {
		isActive = *body.IsActive
	}
	showOnLanding := true
	if body.ShowOnLanding != nil {
		showOnLanding = *body.ShowOnLanding
	}
	isQuickAction := body.IsQuickAction != nil && *body.IsQuickAction

	// Validasi batas quick action
	if isQuickAction && isActive {
		var aktif int64
		config.DB.Model(&models.FaqEntry{}).
			Where("is_active = ? AND is_quick_action = ?", true, true).
			Count(&aktif)
		if aktif >= MaxQuickAction {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": fmt.Sprintf("Quick action maksimal %d tombol. Nonaktifkan salah satu terlebih dahulu.", MaxQuickAction),
			})
			return
		}
	}

	kategori := strings.TrimSpace(body.Category)
	if kategori == "" {
		kategori = "Umum"
	}

	// ── Validasi perilaku quick action (Tahap 3) ──
	tipeAksi := strings.TrimSpace(body.ActionType)
	if tipeAksi == "" {
		tipeAksi = "jawaban"
	}
	if err := validasiAksi(tipeAksi, body.ActionTarget); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	// Tipe yang tidak memerlukan target: pastikan tidak menyimpan data sisa
	targetAksi := strings.TrimSpace(body.ActionTarget)
	if tipeAksi == "jawaban" || tipeAksi == "eskalasi" || tipeAksi == "status" {
		targetAksi = ""
	}

	filterStatus, err := validasiFilterStatus(body.TampilSaatStatus)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
		return
	}

	// Urutan default: paling bawah
	urutan := 0
	if body.OrderIndex != nil {
		urutan = *body.OrderIndex
	} else {
		var maks *int
		config.DB.Model(&models.FaqEntry{}).Select("MAX(order_index)").Scan(&maks)
		if maks != nil {
			urutan = *maks + 1
		}
	}

	entry := models.FaqEntry{
		Question:         pertanyaan,
		Answer:           strings.TrimSpace(body.Answer),
		Keywords:         strings.TrimSpace(body.Keywords),
		Category:         kategori,
		QuickLabel:       strings.TrimSpace(body.QuickLabel),
		ActionType:       tipeAksi,
		ActionTarget:     targetAksi,
		QuickIcon:        strings.TrimSpace(body.QuickIcon),
		TampilSaatStatus: filterStatus,
		OrderIndex:       urutan,
		IsActive:         isActive,
		ShowOnLanding:    showOnLanding,
		IsQuickAction:    isQuickAction,
		CreatedByID:      adminID,
	}
	if err := config.DB.Create(&entry).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan FAQ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": entry})
}

func AdminUpdateFAQ(c *gin.Context) {
	id := c.Param("id")
	var entry models.FaqEntry
	if err := config.DB.First(&entry, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "FAQ tidak ditemukan"})
		return
	}

	// Semua field pakai pointer: nil = tidak dikirim, "" = sengaja dikosongkan
	var body struct {
		Question         *string `json:"question"`
		Answer           *string `json:"answer"`
		Keywords         *string `json:"keywords"`
		Category         *string `json:"category"`
		QuickLabel       *string `json:"quick_label"`
		OrderIndex       *int    `json:"order_index"`
		IsActive         *bool   `json:"is_active"`
		ShowOnLanding    *bool   `json:"show_on_landing"`
		IsQuickAction    *bool   `json:"is_quick_action"`
		ActionType       *string `json:"action_type"`
		ActionTarget     *string `json:"action_target"`
		QuickIcon        *string `json:"quick_icon"`
		TampilSaatStatus *string `json:"tampil_saat_status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid"})
		return
	}

	updates := map[string]interface{}{}

	if body.Question != nil {
		q := strings.TrimSpace(*body.Question)
		if q == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Pertanyaan tidak boleh kosong"})
			return
		}
		var duplikat int64
		config.DB.Model(&models.FaqEntry{}).
			Where("LOWER(question) = ? AND id <> ?", strings.ToLower(q), entry.ID).
			Count(&duplikat)
		if duplikat > 0 {
			c.JSON(http.StatusConflict, gin.H{"success": false, "message": "FAQ dengan pertanyaan yang sama sudah ada"})
			return
		}
		updates["question"] = q
	}

	if body.Answer != nil {
		a := strings.TrimSpace(*body.Answer)
		if a == "" {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Jawaban tidak boleh kosong"})
			return
		}
		updates["answer"] = a
	}

	// Boleh dikosongkan — inilah perbaikan bug-nya
	if body.Keywords != nil {
		updates["keywords"] = strings.TrimSpace(*body.Keywords)
	}
	if body.QuickLabel != nil {
		updates["quick_label"] = strings.TrimSpace(*body.QuickLabel)
	}
	if body.Category != nil {
		kategori := strings.TrimSpace(*body.Category)
		if kategori == "" {
			kategori = "Umum"
		}
		updates["category"] = kategori
	}
	if body.OrderIndex != nil {
		updates["order_index"] = *body.OrderIndex
	}
	if body.IsActive != nil {
		updates["is_active"] = *body.IsActive
	}
	if body.ShowOnLanding != nil {
		updates["show_on_landing"] = *body.ShowOnLanding
	}

	if body.IsQuickAction != nil {
		// Validasi batas hanya saat MENGAKTIFKAN quick action baru
		menyalakan := *body.IsQuickAction && !entry.IsQuickAction
		tetapAktif := entry.IsActive
		if body.IsActive != nil {
			tetapAktif = *body.IsActive
		}
		if menyalakan && tetapAktif {
			var aktif int64
			config.DB.Model(&models.FaqEntry{}).
				Where("is_active = ? AND is_quick_action = ? AND id <> ?", true, true, entry.ID).
				Count(&aktif)
			if aktif >= MaxQuickAction {
				c.JSON(http.StatusBadRequest, gin.H{
					"success": false,
					"message": fmt.Sprintf("Quick action maksimal %d tombol. Nonaktifkan salah satu terlebih dahulu.", MaxQuickAction),
				})
				return
			}
		}
		updates["is_quick_action"] = *body.IsQuickAction
	}

	// ── Perilaku quick action (Tahap 3) ──
	// Tipe dan target divalidasi berpasangan: bila salah satu tidak dikirim,
	// nilai lama dipakai agar kombinasinya tetap sah.
	if body.ActionType != nil || body.ActionTarget != nil {
		tipeBaru := entry.ActionType
		if tipeBaru == "" {
			tipeBaru = "jawaban"
		}
		if body.ActionType != nil {
			tipeBaru = strings.TrimSpace(*body.ActionType)
		}

		targetBaru := entry.ActionTarget
		if body.ActionTarget != nil {
			targetBaru = strings.TrimSpace(*body.ActionTarget)
		}

		if err := validasiAksi(tipeBaru, targetBaru); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
			return
		}

		// Tipe yang tidak butuh target: bersihkan agar tidak menyisakan data usang
		if tipeBaru == "jawaban" || tipeBaru == "eskalasi" || tipeBaru == "status" {
			targetBaru = ""
		}

		updates["action_type"] = tipeBaru
		updates["action_target"] = targetBaru
	}

	if body.QuickIcon != nil {
		updates["quick_icon"] = strings.TrimSpace(*body.QuickIcon)
	}

	if body.TampilSaatStatus != nil {
		filterStatus, err := validasiFilterStatus(*body.TampilSaatStatus)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": err.Error()})
			return
		}
		updates["tampil_saat_status"] = filterStatus
	}

	if len(updates) == 0 {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": entry})
		return
	}

	if err := config.DB.Model(&entry).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal memperbarui FAQ"})
		return
	}
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

// ADMIN: Simpan ulang urutan FAQ (drag & drop)
// PUT /api/manajemen/admin/faq/urutan
func AdminReorderFAQ(c *gin.Context) {
	var body struct {
		Urutan []struct {
			ID         uint `json:"id"`
			OrderIndex int  `json:"order_index"`
		} `json:"urutan" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid"})
		return
	}

	tx := config.DB.Begin()
	for _, item := range body.Urutan {
		if err := tx.Model(&models.FaqEntry{}).
			Where("id = ?", item.ID).
			Update("order_index", item.OrderIndex).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan urutan"})
			return
		}
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Urutan FAQ berhasil disimpan"})
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIK: Daftar FAQ untuk landing page (TANPA autentikasi)
// GET /api/faq?kategori=&cari=
// ─────────────────────────────────────────────────────────────────────────────

type FaqPublikResp struct {
	ID         uint   `json:"id"`
	Question   string `json:"question"`
	Answer     string `json:"answer"`
	Category   string `json:"category"`
	OrderIndex int    `json:"order_index"`
}

func GetFaqPublik(c *gin.Context) {
	q := config.DB.Model(&models.FaqEntry{}).
		Where("is_active = ? AND show_on_landing = ?", true, true)

	if kategori := strings.TrimSpace(c.Query("kategori")); kategori != "" && kategori != "Semua" {
		q = q.Where("category = ?", kategori)
	}
	if cari := strings.TrimSpace(c.Query("cari")); cari != "" {
		like := "%" + strings.ToLower(cari) + "%"
		q = q.Where(
			"LOWER(question) LIKE ? OR LOWER(answer) LIKE ? OR LOWER(keywords) LIKE ?",
			like, like, like,
		)
	}

	var entries []FaqPublikResp
	q.Select("id, question, answer, category, order_index").
		Order("order_index asc, id asc").
		Scan(&entries)

	if entries == nil {
		entries = []FaqPublikResp{}
	}

	// Daftar kategori unik (untuk tab filter di frontend)
	var kategoriList []string
	config.DB.Model(&models.FaqEntry{}).
		Where("is_active = ? AND show_on_landing = ? AND category <> ''", true, true).
		Distinct().
		Order("category asc").
		Pluck("category", &kategoriList)

	if kategoriList == nil {
		kategoriList = []string{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":  true,
		"data":     entries,
		"kategori": kategoriList,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Catat pertanyaan yang belum terjawab, gabungkan bila serupa
// ─────────────────────────────────────────────────────────────────────────────

const ambangSerupa = 0.65 // dianggap pertanyaan yang sama

func catatPertanyaanTakTerjawab(nama, email, pertanyaan, sumber string, sessionID *uint, ip string) *models.FaqPertanyaan {
	pertanyaan = strings.TrimSpace(pertanyaan)
	if pertanyaan == "" {
		return nil
	}

	// Cari pertanyaan serupa yang masih berstatus baru/diproses
	var kandidat []models.FaqPertanyaan
	config.DB.Where("status IN ('baru','diproses')").
		Order("created_at desc").
		Limit(200).
		Find(&kandidat)

	for i := range kandidat {
		if jaccardFuzzySimilarity(pertanyaan, kandidat[i].Pertanyaan) >= ambangSerupa {
			config.DB.Model(&kandidat[i]).
				Update("jumlah_serupa", kandidat[i].JumlahSerupa+1)
			return &kandidat[i]
		}
	}

	entri := models.FaqPertanyaan{
		Nama:          nama,
		Email:         email,
		Pertanyaan:    pertanyaan,
		Sumber:        sumber,
		Status:        "baru",
		JumlahSerupa:  1,
		SkorTertinggi: skorTertinggi(pertanyaan),
		SessionID:     sessionID,
		IPAddress:     ip,
	}
	if err := config.DB.Create(&entri).Error; err != nil {
		return nil
	}
	return &entri
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIK: Saran FAQ saat pengguna mengetik pertanyaan (tanpa autentikasi)
// POST /api/faq/saran
// ─────────────────────────────────────────────────────────────────────────────

func SaranFaqPublik(c *gin.Context) {
	var body struct {
		Pertanyaan string `json:"pertanyaan"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": []KandidatFAQ{}})
		return
	}

	teks := strings.TrimSpace(body.Pertanyaan)
	if len([]rune(teks)) < 4 {
		c.JSON(http.StatusOK, gin.H{"success": true, "data": []KandidatFAQ{}})
		return
	}

	kandidat := cariKandidatFAQ(teks, 3)

	// Hanya tampilkan yang cukup relevan
	saran := make([]KandidatFAQ, 0, 3)
	for _, k := range kandidat {
		if k.Skor >= 0.25 {
			saran = append(saran, k)
		}
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": saran})
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIK: Kirim pertanyaan dari halaman FAQ (tanpa autentikasi)
// POST /api/faq/ask
// ─────────────────────────────────────────────────────────────────────────────

// Pembatas laju sederhana berbasis memori: 1 kiriman / 60 detik per IP
var (
	kirimTerakhir   = map[string]time.Time{}
	kirimTerakhirMu sync.Mutex
)

func bolehKirim(ip string) bool {
	kirimTerakhirMu.Lock()
	defer kirimTerakhirMu.Unlock()

	// Bersihkan entri lama sekalian agar map tidak tumbuh terus
	for k, v := range kirimTerakhir {
		if time.Since(v) > 10*time.Minute {
			delete(kirimTerakhir, k)
		}
	}

	if t, ada := kirimTerakhir[ip]; ada && time.Since(t) < 60*time.Second {
		return false
	}
	kirimTerakhir[ip] = time.Now()
	return true
}

func KirimPertanyaanPublik(c *gin.Context) {
	var body struct {
		Nama       string `json:"nama"       binding:"required"`
		Email      string `json:"email"      binding:"required,email"`
		Pertanyaan string `json:"pertanyaan" binding:"required"`
		Website    string `json:"website"` // honeypot: harus kosong
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Nama, email yang valid, dan pertanyaan wajib diisi",
		})
		return
	}

	// Honeypot terisi = bot, balas seolah sukses tanpa menyimpan apa pun
	if strings.TrimSpace(body.Website) != "" {
		c.JSON(http.StatusCreated, gin.H{"success": true, "tiket": "-"})
		return
	}

	nama := strings.TrimSpace(body.Nama)
	email := strings.ToLower(strings.TrimSpace(body.Email))
	pertanyaan := strings.TrimSpace(body.Pertanyaan)

	if len([]rune(pertanyaan)) < 10 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Mohon tuliskan pertanyaan Anda lebih lengkap (minimal 10 karakter)",
		})
		return
	}
	if len([]rune(pertanyaan)) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Pertanyaan terlalu panjang (maksimal 1000 karakter)",
		})
		return
	}

	ip := c.ClientIP()
	if !bolehKirim(ip) {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"success": false,
			"message": "Mohon tunggu sebentar sebelum mengirim pertanyaan berikutnya.",
		})
		return
	}

	// Maksimal 5 pertanyaan per email dalam 24 jam
	var jumlahHariIni int64
	config.DB.Model(&models.FaqPertanyaan{}).
		Where("email = ? AND created_at >= ?", email, time.Now().Add(-24*time.Hour)).
		Count(&jumlahHariIni)
	if jumlahHariIni >= 5 {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"success": false,
			"message": "Anda sudah mengirim banyak pertanyaan hari ini. Silakan tunggu balasan kami terlebih dahulu.",
		})
		return
	}

	entri := catatPertanyaanTakTerjawab(nama, email, pertanyaan, "form_publik", nil, ip)
	if entri == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Gagal menyimpan pertanyaan. Silakan coba beberapa saat lagi.",
		})
		return
	}

	// Notifikasi lonceng admin (digabung per tipe agar tidak membanjiri)
	refID := entri.ID
	go services.KirimNotifikasiAdmin(
		"pertanyaan_faq",
		"Pertanyaan baru dari calon peserta",
		fmt.Sprintf("%s (%s): \"%s\"", nama, email, potongTeks(pertanyaan, 80)),
		"faq_pertanyaan", &refID,
		"/admin/pertanyaan",
		"normal", true,
	)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Pertanyaan Anda berhasil dikirim",
		"tiket":   fmt.Sprintf("TQ-%06d", entri.ID),
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Daftar pertanyaan masuk / belum terjawab
// GET /api/manajemen/admin/pertanyaan-faq?status=baru&sumber=
// ─────────────────────────────────────────────────────────────────────────────

func AdminGetPertanyaanFaq(c *gin.Context) {
	q := config.DB.Model(&models.FaqPertanyaan{})

	if status := strings.TrimSpace(c.Query("status")); status != "" && status != "semua" {
		q = q.Where("status = ?", status)
	}
	if sumber := strings.TrimSpace(c.Query("sumber")); sumber != "" && sumber != "semua" {
		q = q.Where("sumber = ?", sumber)
	}

	var data []models.FaqPertanyaan
	q.Order("status = 'baru' DESC, jumlah_serupa DESC, created_at DESC").
		Limit(300).
		Find(&data)

	if data == nil {
		data = []models.FaqPertanyaan{}
	}

	var jumlahBaru int64
	config.DB.Model(&models.FaqPertanyaan{}).Where("status = 'baru'").Count(&jumlahBaru)

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"data":        data,
		"jumlah_baru": jumlahBaru,
	})
}

// ADMIN: Ubah status / catatan pertanyaan
// PUT /api/manajemen/admin/pertanyaan-faq/:id
func AdminUpdatePertanyaanFaq(c *gin.Context) {
	adminID := uint(c.GetFloat64("user_id"))
	id := c.Param("id")

	var entri models.FaqPertanyaan
	if err := config.DB.First(&entri, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Pertanyaan tidak ditemukan"})
		return
	}

	var body struct {
		Status       *string `json:"status"`
		CatatanAdmin *string `json:"catatan_admin"`
		FaqTerkaitID *uint   `json:"faq_terkait_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Format data tidak valid"})
		return
	}

	updates := map[string]interface{}{}
	if body.Status != nil {
		s := strings.TrimSpace(*body.Status)
		sah := map[string]bool{"baru": true, "diproses": true, "selesai": true, "diabaikan": true}
		if !sah[s] {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Status tidak dikenal"})
			return
		}
		now := time.Now()
		updates["status"] = s
		updates["diproses_oleh"] = adminID
		updates["diproses_pada"] = &now
	}
	if body.CatatanAdmin != nil {
		updates["catatan_admin"] = strings.TrimSpace(*body.CatatanAdmin)
	}
	if body.FaqTerkaitID != nil {
		updates["faq_terkait_id"] = *body.FaqTerkaitID
	}

	if len(updates) > 0 {
		config.DB.Model(&entri).Updates(updates)
	}
	config.DB.First(&entri, id)

	c.JSON(http.StatusOK, gin.H{"success": true, "data": entri})
}

// ADMIN: Hapus pertanyaan
// DELETE /api/manajemen/admin/pertanyaan-faq/:id
func AdminDeletePertanyaanFaq(c *gin.Context) {
	if err := config.DB.Delete(&models.FaqPertanyaan{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menghapus pertanyaan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Pertanyaan berhasil dihapus"})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Pratinjau quick action untuk status pendaftaran tertentu
// GET /api/manajemen/admin/faq/pratinjau?status=revisi
// ─────────────────────────────────────────────────────────────────────────────

func AdminPratinjauQuickAction(c *gin.Context) {
	status := strings.TrimSpace(c.DefaultQuery("status", "menunggu"))
	if !statusPendaftaranSah[status] {
		status = "menunggu"
	}

	var entries []models.FaqEntry
	config.DB.Where("is_active = ? AND is_quick_action = ?", true, true).
		Order("order_index asc, id asc").
		Find(&entries)

	data := make([]QuickActionResp, 0, MaxQuickAction)
	tersembunyi := 0

	for _, e := range entries {
		if !cocokStatus(e.TampilSaatStatus, status) {
			tersembunyi++
			continue
		}
		if len(data) >= MaxQuickAction {
			tersembunyi++
			continue
		}

		label := strings.TrimSpace(e.QuickLabel)
		if label == "" {
			label = e.Question
		}
		tipe := e.ActionType
		if tipe == "" {
			tipe = "jawaban"
		}

		data = append(data, QuickActionResp{
			ID: e.ID, Question: e.Question, Answer: e.Answer, Label: label,
			ActionType: tipe, ActionTarget: e.ActionTarget, Icon: e.QuickIcon,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"status":      status,
		"data":        data,
		"tersembunyi": tersembunyi,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Papan analitik FAQ
// GET /api/manajemen/admin/faq/analitik
// ─────────────────────────────────────────────────────────────────────────────

// barisAnalitik dipakai untuk daftar peringkat: terpopuler dan bermasalah.
type barisAnalitik struct {
	ID             uint   `json:"id"`
	Question       string `json:"question"`
	Category       string `json:"category"`
	ViewCount      int    `json:"view_count"`
	HelpfulCount   int    `json:"helpful_count"`
	UnhelpfulCount int    `json:"unhelpful_count"`
}

// barisKategori merangkum sebaran FAQ per kategori.
type barisKategori struct {
	Category  string `json:"category"`
	Jumlah    int    `json:"jumlah"`
	TotalView int    `json:"total_view"`
}

// barisTren adalah satu titik pada grafik harian.
type barisTren struct {
	Tanggal string `json:"tanggal"` // format YYYY-MM-DD
	Jumlah  int    `json:"jumlah"`
}

// barisCelah adalah pertanyaan yang belum terjawab bot — bahan FAQ baru.
type barisCelah struct {
	ID            uint      `json:"id"`
	Pertanyaan    string    `json:"pertanyaan"`
	JumlahSerupa  int       `json:"jumlah_serupa"`
	SkorTertinggi float64   `json:"skor_tertinggi"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

// lengkapiHari mengisi tanggal yang tidak punya data dengan angka nol,
// supaya grafik memiliki jarak antar-titik yang konsisten.
func lengkapiHari(data []barisTren, jumlahHari int) []barisTren {
	peta := make(map[string]int, len(data))
	for _, d := range data {
		peta[d.Tanggal] = d.Jumlah
	}

	hasil := make([]barisTren, 0, jumlahHari)
	// SekarangWIB dipakai, bukan time.Now, agar tanggal pada sumbu grafik
	// mengikuti hari kerja Indonesia meskipun server berjalan di UTC.
	mulai := utils.SekarangWIB().AddDate(0, 0, -(jumlahHari - 1))

	for i := 0; i < jumlahHari; i++ {
		tgl := mulai.AddDate(0, 0, i).Format("2006-01-02")
		hasil = append(hasil, barisTren{Tanggal: tgl, Jumlah: peta[tgl]})
	}
	return hasil
}

func AdminAnalitikFaq(c *gin.Context) {
	// Rentang grafik dipilih admin lewat ?hari=. Hanya nilai pada daftar
	// putih ini yang diterima; nilai lain jatuh ke 30 hari. Daftar putih
	// mencegah permintaan seperti ?hari=99999 membebani lengkapiHari.
	jumlahHari := 30
	switch c.Query("hari") {
	case "7":
		jumlahHari = 7
	case "14":
		jumlahHari = 14
	case "30":
		jumlahHari = 30
	case "90":
		jumlahHari = 90
	}

	// ── Ringkasan angka besar ──
	var totalFaq, faqAktif, faqQuick int64
	config.DB.Model(&models.FaqEntry{}).Count(&totalFaq)
	config.DB.Model(&models.FaqEntry{}).Where("is_active = ?", true).Count(&faqAktif)
	config.DB.Model(&models.FaqEntry{}).
		Where("is_active = ? AND is_quick_action = ?", true, true).
		Count(&faqQuick)

	// COALESCE dipakai karena SUM atas tabel kosong menghasilkan NULL,
	// yang akan gagal di-scan ke int64.
	var totalTayang int64
	config.DB.Model(&models.FaqEntry{}).
		Select("COALESCE(SUM(view_count), 0)").
		Scan(&totalTayang)

	var totalPenilaian, totalMembantu int64
	config.DB.Model(&models.FaqFeedback{}).Count(&totalPenilaian)
	config.DB.Model(&models.FaqFeedback{}).Where("membantu = ?", true).Count(&totalMembantu)

	var totalPertanyaan, pertanyaanBaru int64
	config.DB.Model(&models.FaqPertanyaan{}).Count(&totalPertanyaan)
	config.DB.Model(&models.FaqPertanyaan{}).Where("status = ?", "baru").Count(&pertanyaanBaru)

	rasioMembantu := 0.0
	if totalPenilaian > 0 {
		rasioMembantu = float64(totalMembantu) / float64(totalPenilaian) * 100
	}

	// ── Sepuluh FAQ paling sering tampil ──
	// make() dipakai, bukan var, karena slice nil akan dikirim sebagai null
	// oleh encoding/json dan membuat .map() di sisi React gagal.
	terpopuler := make([]barisAnalitik, 0)
	config.DB.Model(&models.FaqEntry{}).
		Select("id, question, category, view_count, helpful_count, unhelpful_count").
		Where("view_count > 0").
		Order("view_count desc, id asc").
		Limit(10).
		Scan(&terpopuler)

	// ── FAQ yang jawabannya dinilai buruk ──
	bermasalah := make([]barisAnalitik, 0)
	config.DB.Model(&models.FaqEntry{}).
		Select("id, question, category, view_count, helpful_count, unhelpful_count").
		Where("helpful_count + unhelpful_count >= 3 AND unhelpful_count > helpful_count").
		Order("unhelpful_count desc, id asc").
		Limit(10).
		Scan(&bermasalah)

	// ── FAQ yang tidak pernah muncul sama sekali ──
	// Berguna untuk membersihkan entri usang yang hanya menambah kebisingan.
	tidakTerpakai := make([]barisAnalitik, 0)
	config.DB.Model(&models.FaqEntry{}).
		Select("id, question, category, view_count, helpful_count, unhelpful_count").
		Where("view_count = 0 AND is_active = ?", true).
		Order("id asc").
		Limit(10).
		Scan(&tidakTerpakai)

	// ── Celah pengetahuan: pertanyaan yang bot tidak bisa jawab ──
	celah := make([]barisCelah, 0)
	config.DB.Model(&models.FaqPertanyaan{}).
		Select("id, pertanyaan, jumlah_serupa, skor_tertinggi, status, created_at").
		Where("status IN ?", []string{"baru", "diproses"}).
		Order("jumlah_serupa desc, created_at desc").
		Limit(10).
		Scan(&celah)

	// ── Sebaran kategori ──
	kategori := make([]barisKategori, 0)
	config.DB.Model(&models.FaqEntry{}).
		Select("category, COUNT(*) AS jumlah, COALESCE(SUM(view_count), 0) AS total_view").
		Group("category").
		Order("jumlah desc").
		Scan(&kategori)

	// ── Tren harian ──
	batas := utils.SekarangWIB().AddDate(0, 0, -(jumlahHari - 1)).Format("2006-01-02")

	// DATE_FORMAT dipakai, bukan DATE(), agar hasilnya pasti berupa string
	// dan tidak bergantung pada pengaturan parseTime pada koneksi.
	var trenPertanyaan []barisTren
	config.DB.Model(&models.FaqPertanyaan{}).
		Select("DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal, COUNT(*) AS jumlah").
		Where("created_at >= ?", batas).
		Group("tanggal").
		Order("tanggal asc").
		Scan(&trenPertanyaan)

	var trenPenilaian []barisTren
	config.DB.Model(&models.FaqFeedback{}).
		Select("DATE_FORMAT(created_at, '%Y-%m-%d') AS tanggal, COUNT(*) AS jumlah").
		Where("created_at >= ? AND membantu = ?", batas, false).
		Group("tanggal").
		Order("tanggal asc").
		Scan(&trenPenilaian)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"ringkasan": gin.H{
			"total_faq":        totalFaq,
			"faq_aktif":        faqAktif,
			"faq_quick_action": faqQuick,
			"total_tayang":     totalTayang,
			"total_penilaian":  totalPenilaian,
			"total_membantu":   totalMembantu,
			"rasio_membantu":   rasioMembantu,
			"total_pertanyaan": totalPertanyaan,
			"pertanyaan_baru":  pertanyaanBaru,
		},
			"jumlah_hari":     jumlahHari,
			"terpopuler":      terpopuler,
			"bermasalah":      bermasalah,
			"tidak_terpakai":  tidakTerpakai,
			"celah":           celah,
			"kategori":        kategori,
			"tren_pertanyaan": lengkapiHari(trenPertanyaan, jumlahHari),
			"tren_negatif":    lengkapiHari(trenPenilaian, jumlahHari),
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: Aksi massal pada banyak FAQ sekaligus
// POST /api/manajemen/admin/faq/massal
// ─────────────────────────────────────────────────────────────────────────────

const maksBarisMassal = 200

func AdminAksiMassalFAQ(c *gin.Context) {
	var body struct {
		IDs   []uint `json:"ids" binding:"required"`
		Aksi  string `json:"aksi" binding:"required"`
		Nilai string `json:"nilai"` // dipakai oleh aksi ubah_kategori
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Data tidak valid: " + err.Error()})
		return
	}

	if len(body.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Tidak ada FAQ yang dipilih"})
		return
	}
	if len(body.IDs) > maksBarisMassal {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": fmt.Sprintf("Maksimal %d FAQ dalam satu aksi", maksBarisMassal),
		})
		return
	}

	// Buang id ganda agar hitungan "terpengaruh" jujur
	unik := make([]uint, 0, len(body.IDs))
	terlihat := make(map[uint]bool, len(body.IDs))
	for _, id := range body.IDs {
		if id != 0 && !terlihat[id] {
			terlihat[id] = true
			unik = append(unik, id)
		}
	}

	aksi := strings.ToLower(strings.TrimSpace(body.Aksi))
	tx := config.DB.Begin()

	var terpengaruh int64
	var pesan string

	switch aksi {
	case "aktifkan":
		res := tx.Model(&models.FaqEntry{}).Where("id IN ?", unik).
			Update("is_active", true)
		terpengaruh, pesan = res.RowsAffected, "FAQ diaktifkan"

	case "nonaktifkan":
		// FAQ yang dimatikan juga harus lepas dari quick action, kalau tidak
		// slot akan terkunci oleh baris yang tidak pernah tampil.
		res := tx.Model(&models.FaqEntry{}).Where("id IN ?", unik).
			Updates(map[string]interface{}{"is_active": false, "is_quick_action": false})
		terpengaruh, pesan = res.RowsAffected, "FAQ dinonaktifkan"

	case "tampilkan_landing":
		res := tx.Model(&models.FaqEntry{}).Where("id IN ?", unik).
			Update("show_on_landing", true)
		terpengaruh, pesan = res.RowsAffected, "FAQ ditampilkan di halaman depan"

	case "sembunyikan_landing":
		res := tx.Model(&models.FaqEntry{}).Where("id IN ?", unik).
			Update("show_on_landing", false)
		terpengaruh, pesan = res.RowsAffected, "FAQ disembunyikan dari halaman depan"

	case "lepas_quick_action":
		res := tx.Model(&models.FaqEntry{}).Where("id IN ?", unik).
			Update("is_quick_action", false)
		terpengaruh, pesan = res.RowsAffected, "FAQ dilepas dari Quick Action"

	case "ubah_kategori":
		kategori := strings.TrimSpace(body.Nilai)
		if kategori == "" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Nama kategori wajib diisi"})
			return
		}
		if len([]rune(kategori)) > 60 {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Nama kategori maksimal 60 karakter"})
			return
		}
		res := tx.Model(&models.FaqEntry{}).Where("id IN ?", unik).
			Update("category", kategori)
		terpengaruh, pesan = res.RowsAffected, "Kategori diubah menjadi "+kategori

	case "hapus":
		// Penilaian ikut dibuang, kalau tidak tabel feedback akan menyimpan
		// baris yatim yang menunjuk FAQ yang sudah tiada.
		if err := tx.Where("faq_id IN ?", unik).Delete(&models.FaqFeedback{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal membersihkan penilaian"})
			return
		}
		// Putuskan kaitan dari pertanyaan masuk, jangan sampai ikut terhapus
		tx.Model(&models.FaqPertanyaan{}).Where("faq_terkait_id IN ?", unik).
			Update("faq_terkait_id", nil)

		res := tx.Where("id IN ?", unik).Delete(&models.FaqEntry{})
		terpengaruh, pesan = res.RowsAffected, "FAQ dihapus"

	default:
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Aksi tidak dikenal: " + aksi,
		})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan perubahan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"message":     fmt.Sprintf("%s — %d FAQ terpengaruh", pesan, terpengaruh),
		"terpengaruh": terpengaruh,
	})
}

// deteksiPemisah menebak pemisah kolom dari baris pertama. Excel berbahasa
// Indonesia menyimpan CSV dengan titik koma, sedangkan Google Sheets dan
// kebanyakan alat lain memakai koma. Menebak membuat keduanya bisa diterima.
func deteksiPemisah(data []byte) rune {
	baris := data
	if i := bytes.IndexByte(data, '\n'); i >= 0 {
		baris = data[:i]
	}
	if bytes.Count(baris, []byte(";")) > bytes.Count(baris, []byte(",")) {
		return ';'
	}
	return ','
}

// normalisasiHeader menyeragamkan nama kolom agar "Show On Landing",
// "show-on-landing", dan "show_on_landing" dianggap sama.
func normalisasiHeader(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "_")
	s = strings.ReplaceAll(s, "-", "_")
	return s
}

// kolomCSV mengambil satu sel dengan aman, mengembalikan string kosong bila
// kolomnya tidak ada pada berkas yang diunggah.
func kolomCSV(indeks map[string]int, baris []string, nama string) string {
	i, ada := indeks[nama]
	if !ada || i >= len(baris) {
		return ""
	}
	return strings.TrimSpace(baris[i])
}

// boolCSV menerima berbagai penulisan yang lazim diketik admin.
func boolCSV(teks string, bawaan bool) bool {
	switch strings.ToLower(strings.TrimSpace(teks)) {
	case "1", "true", "ya", "y", "yes", "aktif", "tampil":
		return true
	case "0", "false", "tidak", "t", "no", "nonaktif", "sembunyi":
		return false
	}
	return bawaan
}

// GET /api/manajemen/admin/faq/ekspor
func AdminEksporFaqCSV(c *gin.Context) {
	var entries []models.FaqEntry
	config.DB.Order("order_index asc, id asc").Find(&entries)

	var buf bytes.Buffer

	// Tanda BOM UTF-8. Tanpa ini Excel di Windows menampilkan huruf beraksen
	// dan tanda kutip melengkung sebagai karakter kacau.
	buf.Write([]byte{0xEF, 0xBB, 0xBF})

	w := csv.NewWriter(&buf)
	w.Comma = ';' // cocok dengan Excel berlokal Indonesia

	if err := w.Write(kolomCSVFaq); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyusun berkas"})
		return
	}

	for i := range entries {
		e := &entries[i]
		baris := []string{
			strconv.FormatUint(uint64(e.ID), 10),
			e.Question,
			e.Answer,
			e.Keywords,
			e.Category,
			strconv.FormatBool(e.IsActive),
			strconv.FormatBool(e.ShowOnLanding),
			strconv.FormatBool(e.IsQuickAction),
			e.QuickLabel,
			e.ActionType,
			e.ActionTarget,
			e.QuickIcon,
			e.TampilSaatStatus,
			strconv.Itoa(e.OrderIndex),
			strconv.Itoa(e.ViewCount),
			strconv.Itoa(e.HelpfulCount),
			strconv.Itoa(e.UnhelpfulCount),
		}
		if err := w.Write(baris); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menulis baris FAQ"})
			return
		}
	}

	w.Flush()
	if err := w.Error(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyelesaikan berkas"})
		return
	}

	namaBerkas := fmt.Sprintf("faq-diskominfo-%s.csv", time.Now().Format("2006-01-02"))

	c.Header("Content-Disposition", `attachment; filename="`+namaBerkas+`"`)
	// Tanpa baris ini, JavaScript di sisi admin tidak bisa membaca nama berkas
	// karena browser menyembunyikan header yang tidak diizinkan secara eksplisit.
	c.Header("Access-Control-Expose-Headers", "Content-Disposition")
	c.Data(http.StatusOK, "text/csv; charset=utf-8", buf.Bytes())
}

const (
	maksBarisImpor = 500
	maksUkuranCSV  = 2 << 20 // 2 MB
)

// rencanaImpor adalah satu keputusan untuk satu baris CSV. Field `entri`
// sengaja tidak diekspor agar pratinjau di layar admin tetap ringkas.
type rencanaImpor struct {
	Baris    int    `json:"baris"`
	Aksi     string `json:"aksi"` // baru | perbarui | lewati
	Alasan   string `json:"alasan,omitempty"`
	Question string `json:"question"`
	IDLama   uint   `json:"id_lama,omitempty"`

	entri models.FaqEntry
}

// POST /api/manajemen/admin/faq/impor
//
// Form-data:
//   file : berkas CSV
//   mode : "pratinjau" (bawaan) atau "terapkan"
func AdminImporFaqCSV(c *gin.Context) {
	mode := strings.ToLower(strings.TrimSpace(c.PostForm("mode")))
	if mode == "" {
		mode = "pratinjau"
	}
	if mode != "pratinjau" && mode != "terapkan" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Mode harus 'pratinjau' atau 'terapkan'"})
		return
	}

	berkas, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Berkas CSV belum dipilih"})
		return
	}
	if berkas.Size > maksUkuranCSV {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Ukuran berkas maksimal 2 MB"})
		return
	}
	if !strings.HasSuffix(strings.ToLower(berkas.Filename), ".csv") {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Berkas harus berekstensi .csv"})
		return
	}

	f, err := berkas.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Berkas tidak dapat dibuka"})
		return
	}
	defer f.Close()

	data, err := io.ReadAll(io.LimitReader(f, maksUkuranCSV+1))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Berkas gagal dibaca"})
		return
	}
	data = bytes.TrimPrefix(data, []byte{0xEF, 0xBB, 0xBF})

	r := csv.NewReader(bytes.NewReader(data))
	r.Comma = deteksiPemisah(data)
	r.FieldsPerRecord = -1 // baris pendek tidak langsung dianggap rusak
	r.LazyQuotes = true    // tanda kutip nyasar di dalam jawaban tidak menggagalkan semuanya

	semua, err := r.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Format CSV tidak terbaca: " + err.Error(),
		})
		return
	}
	if len(semua) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "Berkas hanya berisi baris judul atau kosong"})
		return
	}
	if len(semua)-1 > maksBarisImpor {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": fmt.Sprintf("Maksimal %d baris per impor, berkas Anda berisi %d", maksBarisImpor, len(semua)-1),
		})
		return
	}

	// Petakan nama kolom -> posisi
	indeks := make(map[string]int, len(semua[0]))
	for i, nama := range semua[0] {
		indeks[normalisasiHeader(nama)] = i
	}
	if _, ada := indeks["question"]; !ada {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Kolom 'question' wajib ada pada baris judul",
		})
		return
	}
	if _, ada := indeks["answer"]; !ada {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Kolom 'answer' wajib ada pada baris judul",
		})
		return
	}

	// Muat FAQ yang sudah ada, dikunci berdasarkan pertanyaan huruf kecil.
	// Pencocokan lewat teks pertanyaan, bukan id, supaya admin bisa menyunting
	// di spreadsheet tanpa takut kolom id tergeser atau terhapus.
	var lama []models.FaqEntry
	config.DB.Find(&lama)

	petaLama := make(map[string]*models.FaqEntry, len(lama))
	quickTerpakai := 0
	for i := range lama {
		kunci := strings.ToLower(strings.TrimSpace(lama[i].Question))
		petaLama[kunci] = &lama[i]
		if lama[i].IsActive && lama[i].IsQuickAction {
			quickTerpakai++
		}
	}

	rencana := make([]rencanaImpor, 0, len(semua)-1)
	peringatan := make([]string, 0, 8)
	sudahDilihat := make(map[string]bool, len(semua)-1)

	var jumlahBaru, jumlahPerbarui, jumlahLewati int

	for i := 1; i < len(semua); i++ {
		nomorBaris := i + 1 // nomor sebagaimana terlihat di spreadsheet
		baris := semua[i]

		pertanyaan := kolomCSV(indeks, baris, "question")
		jawaban := kolomCSV(indeks, baris, "answer")

		if pertanyaan == "" && jawaban == "" {
			continue // baris kosong di akhir berkas, abaikan diam-diam
		}
		if pertanyaan == "" || jawaban == "" {
			jumlahLewati++
			rencana = append(rencana, rencanaImpor{
				Baris: nomorBaris, Aksi: "lewati", Question: pertanyaan,
				Alasan: "Pertanyaan atau jawaban kosong",
			})
			continue
		}
		if len([]rune(pertanyaan)) > 255 {
			jumlahLewati++
			rencana = append(rencana, rencanaImpor{
				Baris: nomorBaris, Aksi: "lewati", Question: pertanyaan,
				Alasan: "Pertanyaan melebihi 255 karakter",
			})
			continue
		}

		kunci := strings.ToLower(pertanyaan)
		if sudahDilihat[kunci] {
			jumlahLewati++
			rencana = append(rencana, rencanaImpor{
				Baris: nomorBaris, Aksi: "lewati", Question: pertanyaan,
				Alasan: "Pertanyaan kembar di dalam berkas ini",
			})
			continue
		}
		sudahDilihat[kunci] = true

		sebelumnya := petaLama[kunci]

		kategori := kolomCSV(indeks, baris, "category")
		if kategori == "" {
			kategori = "Umum"
		}

		tipeAksi := strings.ToLower(kolomCSV(indeks, baris, "action_type"))
		if tipeAksi == "" {
			tipeAksi = "jawaban"
		}
		targetAksi := kolomCSV(indeks, baris, "action_target")

		if err := validasiAksi(tipeAksi, targetAksi); err != nil {
			jumlahLewati++
			rencana = append(rencana, rencanaImpor{
				Baris: nomorBaris, Aksi: "lewati", Question: pertanyaan,
				Alasan: err.Error(),
			})
			continue
		}

		filterStatus, err := validasiFilterStatus(kolomCSV(indeks, baris, "tampil_saat_status"))
		if err != nil {
			jumlahLewati++
			rencana = append(rencana, rencanaImpor{
				Baris: nomorBaris, Aksi: "lewati", Question: pertanyaan,
				Alasan: err.Error(),
			})
			continue
		}

		aktif := boolCSV(kolomCSV(indeks, baris, "is_active"), true)
		tampilLanding := boolCSV(kolomCSV(indeks, baris, "show_on_landing"), true)
		quick := boolCSV(kolomCSV(indeks, baris, "is_quick_action"), false)

		// Jaga kuota. Baris yang sudah menjadi quick action sebelumnya tidak
		// dihitung ulang, karena ia tidak menambah pemakaian slot.
		sudahQuick := sebelumnya != nil && sebelumnya.IsActive && sebelumnya.IsQuickAction
		if quick && aktif && !sudahQuick {
			if quickTerpakai >= MaxQuickAction {
				quick = false
				if len(peringatan) < 8 {
					peringatan = append(peringatan, fmt.Sprintf(
						"Baris %d: Quick Action dimatikan karena kuota %d slot sudah penuh",
						nomorBaris, MaxQuickAction))
				}
			} else {
				quickTerpakai++
			}
		}
		if !aktif {
			quick = false
		}

		urutan := 0
		if teks := kolomCSV(indeks, baris, "order_index"); teks != "" {
			if n, err := strconv.Atoi(teks); err == nil {
				urutan = n
			}
		}

		entri := models.FaqEntry{
			Question:         pertanyaan,
			Answer:           jawaban,
			Keywords:         kolomCSV(indeks, baris, "keywords"),
			Category:         kategori,
			IsActive:         aktif,
			ShowOnLanding:    tampilLanding,
			IsQuickAction:    quick,
			QuickLabel:       kolomCSV(indeks, baris, "quick_label"),
			ActionType:       tipeAksi,
			ActionTarget:     targetAksi,
			QuickIcon:        kolomCSV(indeks, baris, "quick_icon"),
			TampilSaatStatus: filterStatus,
			OrderIndex:       urutan,
		}

		if sebelumnya != nil {
			jumlahPerbarui++
			rencana = append(rencana, rencanaImpor{
				Baris: nomorBaris, Aksi: "perbarui", Question: pertanyaan,
				IDLama: sebelumnya.ID, entri: entri,
			})
		} else {
			jumlahBaru++
			rencana = append(rencana, rencanaImpor{
				Baris: nomorBaris, Aksi: "baru", Question: pertanyaan, entri: entri,
			})
		}
	}

	ringkasan := gin.H{
		"baru":      jumlahBaru,
		"perbarui":  jumlahPerbarui,
		"lewati":    jumlahLewati,
		"total":     len(rencana),
		"pemisah":   string(r.Comma),
	}

	// ── Langkah satu: hanya melapor ──
	if mode == "pratinjau" {
		contoh := rencana
		if len(contoh) > 50 {
			contoh = contoh[:50]
		}
		c.JSON(http.StatusOK, gin.H{
			"success":    true,
			"mode":       "pratinjau",
			"message":    "Pratinjau siap. Belum ada data yang diubah.",
			"ringkasan":  ringkasan,
			"rincian":    contoh,
			"peringatan": peringatan,
		})
		return
	}

	// ── Langkah dua: terapkan dalam satu transaksi ──
	if jumlahBaru == 0 && jumlahPerbarui == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success":   false,
			"message":   "Tidak ada baris yang bisa diterapkan",
			"ringkasan": ringkasan,
		})
		return
	}

	tx := config.DB.Begin()

	for i := range rencana {
		rc := &rencana[i]

		switch rc.Aksi {
		case "baru":
			if err := tx.Create(&rc.entri).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": fmt.Sprintf("Gagal menyimpan baris %d: %v", rc.Baris, err),
				})
				return
			}

		case "perbarui":
			// Sengaja memakai peta kolom, bukan struct, agar penghitung
			// view_count dan penilaian yang sudah terkumpul tidak tertimpa nol.
			ubah := map[string]interface{}{
				"answer":             rc.entri.Answer,
				"keywords":           rc.entri.Keywords,
				"category":           rc.entri.Category,
				"is_active":          rc.entri.IsActive,
				"show_on_landing":    rc.entri.ShowOnLanding,
				"is_quick_action":    rc.entri.IsQuickAction,
				"quick_label":        rc.entri.QuickLabel,
				"action_type":        rc.entri.ActionType,
				"action_target":      rc.entri.ActionTarget,
				"quick_icon":         rc.entri.QuickIcon,
				"tampil_saat_status": rc.entri.TampilSaatStatus,
				"order_index":        rc.entri.OrderIndex,
			}
			if err := tx.Model(&models.FaqEntry{}).Where("id = ?", rc.IDLama).Updates(ubah).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{
					"success": false,
					"message": fmt.Sprintf("Gagal memperbarui baris %d: %v", rc.Baris, err),
				})
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "message": "Gagal menyimpan hasil impor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"mode":    "terapkan",
		"message": fmt.Sprintf("Impor selesai — %d FAQ baru, %d diperbarui, %d dilewati",
			jumlahBaru, jumlahPerbarui, jumlahLewati),
		"ringkasan":  ringkasan,
		"peringatan": peringatan,
	})
}

// GET /api/manajemen/admin/faq/contoh-impor
func AdminContohImporCSV(c *gin.Context) {
	var buf bytes.Buffer
	buf.Write([]byte{0xEF, 0xBB, 0xBF})

	w := csv.NewWriter(&buf)
	w.Comma = ';'

	_ = w.Write(kolomCSVFaq)
	_ = w.Write([]string{
		"", "Apa syarat mengikuti magang?",
		"Pendaftar harus mahasiswa aktif minimal semester 5 dan membawa surat pengantar kampus.",
		"syarat, persyaratan, ketentuan", "Pendaftaran",
		"true", "true", "false", "", "jawaban", "", "", "", "1", "0", "0", "0",
	})
	_ = w.Write([]string{
		"", "Bagaimana cara mengunduh sertifikat?",
		"Sertifikat dapat diunduh melalui dasbor peserta setelah masa magang selesai.",
		"sertifikat, unduh", "Sertifikat",
		"true", "true", "true", "Unduh Sertifikat", "navigasi", "/dashboard?tab=sertifikat",
		"Award", "diterima", "2", "0", "0", "0",
	})

	w.Flush()

	c.Header("Content-Disposition", `attachment; filename="contoh-impor-faq.csv"`)
	c.Header("Access-Control-Expose-Headers", "Content-Disposition")
	c.Data(http.StatusOK, "text/csv; charset=utf-8", buf.Bytes())
}