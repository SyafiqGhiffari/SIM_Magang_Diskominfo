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

// FaqEntry mewakili satu entri FAQ yang bisa dijawab otomatis oleh bot
type FaqEntry struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Question      string    `gorm:"type:varchar(300);not null" json:"question"`
	Answer        string    `gorm:"type:text;not null" json:"answer"`
	Keywords      string    `gorm:"type:varchar(500);default:''" json:"keywords"` // opsional, dipisah koma, boleh kosong
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	IsQuickAction bool      `gorm:"default:false" json:"is_quick_action"` // jika true, tampil sebagai tombol quick action di chat widget
	CreatedByID   uint      `json:"created_by_id"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (FaqEntry) TableName() string {
	return "faq_entries"
}
