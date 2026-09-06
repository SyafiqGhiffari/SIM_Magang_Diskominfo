package models

import "time"

type UserPendaftaran struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	Nama              string     `gorm:"type:varchar(100);not null" json:"nama"`
	Email             string     `gorm:"type:varchar(100);unique;not null" json:"email"`
	Password          string     `gorm:"type:varchar(255);not null" json:"-"`
	NoHP              string     `gorm:"type:varchar(20)" json:"no_hp"`
	Institusi         string     `gorm:"type:varchar(150)" json:"institusi"`
	StatusAkun        string     `gorm:"type:enum('aktif','nonaktif');default:'aktif'" json:"status_akun"`
	FotoProfil        string     `gorm:"type:varchar(255)" json:"foto_profil"`
	CurrentSessionID string      `gorm:"type:varchar(64)" json:"-"`
	SessionIssuedAt  *time.Time  `json:"-"`
	LastActivityAt   *time.Time  `gorm:"index" json:"last_activity_at,omitempty"`
	LastLoginAt      *time.Time  `json:"last_login_at,omitempty"`
	LastLoginIP      string      `gorm:"type:varchar(45)" json:"last_login_ip,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	
	// Field baru untuk menyimpan email baru sementara saat proses ganti email
	EmailBaru         string     `gorm:"type:varchar(100)" json:"-"`
	OtpEmail          string     `gorm:"type:varchar(6)" json:"-"`
	OtpEmailExpiredAt *time.Time `json:"-"`
	OtpRequestedAt    *time.Time `json:"-"`
	OtpAttemptCount  int        `gorm:"default:0" json:"-"`

	// Field untuk reset password
	ResetPasswordToken     string     `gorm:"type:varchar(255)" json:"-"`
	ResetPasswordExpiredAt *time.Time `json:"-"`
	ResetPasswordAttempt   int        `gorm:"default:0" json:"-"`
	ResetPasswordRequestedAt *time.Time `json:"-"`

	// Diperbarui berkala selama peserta membuka dasbor. Dipakai untuk
	// menentukan status online dan "terakhir dilihat".
	LastActiveAt *time.Time `gorm:"index" json:"last_active_at"`
}

func (UserPendaftaran) TableName() string {
	return "user_pendaftarans"
}