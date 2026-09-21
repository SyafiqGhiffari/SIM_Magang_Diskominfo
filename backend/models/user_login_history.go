package models

import "time"

type UserLoginHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"user_id"`
	UserType  string    `gorm:"type:varchar(20);default:'pendaftaran'" json:"user_type"` // "pendaftaran" | "manajemen"
	SessionID string    `gorm:"type:varchar(64)" json:"session_id"`
	IPAddress string    `gorm:"type:varchar(45)" json:"ip_address"`
	UserAgent string    `gorm:"type:text" json:"user_agent"`
	Device    string    `gorm:"type:varchar(100)" json:"device"`
	Browser   string    `gorm:"type:varchar(100)" json:"browser"`
	IsMobile  bool      `json:"is_mobile"`
	CreatedAt time.Time `gorm:"index" json:"created_at"`
}

func (UserLoginHistory) TableName() string {
	return "user_login_histories"
}
