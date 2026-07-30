package services

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"gopkg.in/gomail.v2"
)

func SendEmail(to string, subject string, body string) error {
	return SendEmailWithAttachment(to, subject, body)
}

// SendEmailWithAttachment mengirim email HTML beserta berkas lampiran
// (opsional). Dipakai antara lain untuk melampirkan PDF surat penerimaan.
// Lampiran yang path-nya kosong atau tidak ditemukan akan dilewati, supaya
// email tetap terkirim walau berkasnya bermasalah.
func SendEmailWithAttachment(to string, subject string, body string, lampiran ...string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	fromName := os.Getenv("SMTP_FROM_NAME")

	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return fmt.Errorf("SMTP_PORT tidak valid")
	}

	mailer := gomail.NewMessage()

	mailer.SetHeader("From", fmt.Sprintf("%s <%s>", fromName, smtpEmail))
	mailer.SetHeader("To", to)
	mailer.SetHeader("Subject", subject)
	mailer.SetBody("text/html", body)

	for _, berkas := range lampiran {
		berkas = strings.TrimSpace(berkas)
		if berkas == "" {
			continue
		}
		if _, err := os.Stat(berkas); err != nil {
			continue
		}
		mailer.Attach(berkas, gomail.Rename(filepath.Base(berkas)))
	}

	dialer := gomail.NewDialer(smtpHost, smtpPort, smtpEmail, smtpPassword)

	if err := dialer.DialAndSend(mailer); err != nil {
		return err
	}

	return nil
}

// SendEmailInline mengirim email HTML dengan berkas ditanam sebagai bagian isi
// email (Content-Disposition: inline), bukan lampiran terpisah, sehingga berkas
// tampil menyatu dengan badan email.
func SendEmailInline(to string, subject string, body string, berkasInline ...string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	fromName := os.Getenv("SMTP_FROM_NAME")

	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		return fmt.Errorf("SMTP_PORT tidak valid")
	}

	mailer := gomail.NewMessage()
	mailer.SetHeader("From", fmt.Sprintf("%s <%s>", fromName, smtpEmail))
	mailer.SetHeader("To", to)
	mailer.SetHeader("Subject", subject)
	mailer.SetBody("text/html", body)

	for _, berkas := range berkasInline {
		berkas = strings.TrimSpace(berkas)
		if berkas == "" {
			continue
		}
		if _, err := os.Stat(berkas); err != nil {
			continue
		}
		// Embed => inline, jadi tidak muncul sebagai blok lampiran di bawah.
		mailer.Embed(berkas, gomail.Rename(filepath.Base(berkas)))
	}

	dialer := gomail.NewDialer(smtpHost, smtpPort, smtpEmail, smtpPassword)
	return dialer.DialAndSend(mailer)
}