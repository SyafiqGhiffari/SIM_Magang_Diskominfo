package utils

import (
	"bytes"
	"errors"
	"io"
	"mime/multipart"
	"strings"
)

// Daftar tipe berkas yang diizinkan beserta signature biner (magic bytes)
type FileTypeSignature struct {
	Ext       string
	MimeTypes []string
	Check     func(header []byte) bool
}

var supportedSignatures = []FileTypeSignature{
	{
		Ext: ".pdf",
		MimeTypes: []string{"application/pdf"},
		Check: func(h []byte) bool {
			return len(h) >= 4 && bytes.HasPrefix(h, []byte("%PDF"))
		},
	},
	{
		Ext: ".png",
		MimeTypes: []string{"image/png"},
		Check: func(h []byte) bool {
			return len(h) >= 8 && bytes.HasPrefix(h, []byte{0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})
		},
	},
	{
		Ext: ".jpg",
		MimeTypes: []string{"image/jpeg", "image/jpg"},
		Check: func(h []byte) bool {
			return len(h) >= 3 && h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF
		},
	},
	{
		Ext: ".jpeg",
		MimeTypes: []string{"image/jpeg"},
		Check: func(h []byte) bool {
			return len(h) >= 3 && h[0] == 0xFF && h[1] == 0xD8 && h[2] == 0xFF
		},
	},
	{
		Ext: ".webp",
		MimeTypes: []string{"image/webp"},
		Check: func(h []byte) bool {
			return len(h) >= 12 && string(h[0:4]) == "RIFF" && string(h[8:12]) == "WEBP"
		},
	},
	{
		Ext: ".mp4",
		MimeTypes: []string{"video/mp4"},
		Check: func(h []byte) bool {
			return len(h) >= 12 && string(h[4:8]) == "ftyp"
		},
	},
	{
		Ext: ".docx",
		MimeTypes: []string{"application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip"},
		Check: func(h []byte) bool {
			return len(h) >= 4 && bytes.HasPrefix(h, []byte{0x50, 0x4B, 0x03, 0x04})
		},
	},
	{
		Ext: ".doc",
		MimeTypes: []string{"application/msword"},
		Check: func(h []byte) bool {
			return len(h) >= 8 && bytes.HasPrefix(h, []byte{0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1})
		},
	},
}

// ValidateFileMagicBytes memeriksa apakah isi biner berkas sesuai dengan ekstensi yang diklaim.
// Mengembalikan error jika berkas disamarkan (misalnya file .exe yang dinamai .pdf).
func ValidateFileMagicBytes(fileHeader *multipart.FileHeader, allowedExtensions []string) error {
	file, err := fileHeader.Open()
	if err != nil {
		return errors.New("gagal membaca berkas yang diunggah")
	}
	defer file.Close()

	// Baca 512 byte pertama untuk identifikasi signature
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return errors.New("gagal memverifikasi signature biner berkas")
	}
	headerBytes := buffer[:n]

	// Dapatkan ekstensi dari nama berkas
	namaFile := strings.ToLower(fileHeader.Filename)

	// Periksa apakah ekstensi berkas ada di daftar signature yang didukung
	var matchedSignature *FileTypeSignature
	for _, sig := range supportedSignatures {
		if strings.HasSuffix(namaFile, sig.Ext) {
			matchedSignature = &sig
			break
		}
	}

	// Jika tipe berkas memiliki aturan signature, validasi magic bytes-nya
	if matchedSignature != nil {
		if !matchedSignature.Check(headerBytes) {
			return errors.New("berkas terdeteksi tidak valid atau telah dimodifikasi secara tidak sah")
		}
	}

	return nil
}
