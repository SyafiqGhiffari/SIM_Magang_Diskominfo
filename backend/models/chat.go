package models

import "time"

// ChatSession mewakili satu sesi percakapan antara satu peserta dengan admin
type ChatSession struct {
	ID                  uint       `gorm:"primaryKey" json:"id"`
	UserPendaftaranID   uint       `gorm:"not null;index" json:"user_pendaftaran_id"`
	UserPendaftaran     UserPendaftaran `gorm:"foreignKey:UserPendaftaranID" json:"-"`
	Status              string     `gorm:"type:enum('open','closed');default:'open'" json:"status"`
	LastMessageAt       *time.Time `json:"last_message_at"`
	UnreadAdminCount    int        `gorm:"default:0" json:"unread_admin_count"`   // pesan peserta belum dibaca admin
	UnreadUserCount     int        `gorm:"default:0" json:"unread_user_count"`    // pesan admin belum dibaca peserta
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

func (ChatSession) TableName() string {
	return "chat_sessions"
}

// ChatMessage mewakili satu pesan dalam sesi chat
type ChatMessage struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	SessionID   uint      `gorm:"not null;index" json:"session_id"`
	SenderType  string    `gorm:"type:enum('user','admin','bot');not null" json:"sender_type"`
	Content     string    `gorm:"type:text;not null" json:"content"`
	IsReadAdmin bool      `gorm:"default:false" json:"is_read_admin"`
	IsReadUser  bool      `gorm:"default:false" json:"is_read_user"`
	CreatedAt   time.Time `json:"created_at"`
}

func (ChatMessage) TableName() string {
	return "chat_messages"
}

// FaqEntry mewakili satu entri FAQ yang bisa dijawab otomatis oleh bot,
// sekaligus menjadi sumber data tunggal untuk halaman FAQ publik.
type FaqEntry struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Question string `gorm:"type:varchar(300);not null" json:"question"`
	Answer   string `gorm:"type:text;not null" json:"answer"`
	Keywords string `gorm:"type:varchar(500);default:''" json:"keywords"` // opsional, dipisah koma

	// ── Pengelompokan & urutan tampil ──
	Category   string `gorm:"type:varchar(60);default:'Umum';index" json:"category"`
	OrderIndex int    `gorm:"default:0;index" json:"order_index"` // makin kecil makin atas

	// ── Kontrol penayangan ──
	IsActive      bool `gorm:"default:true" json:"is_active"`             // dipakai bot & semua kanal
	ShowOnLanding bool `gorm:"default:true" json:"show_on_landing"`       // tampil di halaman FAQ publik
	IsQuickAction bool `gorm:"default:false" json:"is_quick_action"`      // tampil sbg tombol di chat widget

	// Label pendek untuk tombol quick action (jika kosong, pakai Question)
	QuickLabel string `gorm:"type:varchar(60);default:''" json:"quick_label"`

	// ── Perilaku tombol quick action ──
	// jawaban  = kirim Answer apa adanya
	// navigasi = arahkan pengguna ke halaman tertentu (ActionTarget)
	// unduh    = buka/unduh berkas (ActionTarget)
	// eskalasi = teruskan langsung ke admin manusia
	// status   = jawaban dirakit dari data pendaftaran pengguna
	ActionType   string `gorm:"type:enum('jawaban','navigasi','unduh','eskalasi','status');default:'jawaban'" json:"action_type"`
	ActionTarget string `gorm:"type:varchar(255);default:''" json:"action_target"`

	// Nama ikon lucide-react untuk tombol, mis. "FileText" (kosong = titik warna)
	QuickIcon string `gorm:"type:varchar(40);default:''" json:"quick_icon"`

	// Batasi tombol hanya untuk status pendaftaran tertentu.
	// Kosong = tampil untuk semua. Contoh: "menunggu,revisi"
	TampilSaatStatus string `gorm:"type:varchar(120);default:''" json:"tampil_saat_status"`

	// ── Statistik pemakaian ──
	// Disimpan sebagai penghitung agar panel admin tidak perlu
	// menghitung ulang seluruh tabel umpan balik setiap kali dibuka.
	ViewCount      int `gorm:"default:0" json:"view_count"`      // berapa kali jawaban ini ditampilkan
	HelpfulCount   int `gorm:"default:0" json:"helpful_count"`   // jempol naik
	UnhelpfulCount int `gorm:"default:0" json:"unhelpful_count"` // jempol turun

	CreatedByID uint      `json:"created_by_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (FaqEntry) TableName() string {
	return "faq_entries"
}
