package utils

import (
	"errors"
	"regexp"
)

// ValidatePasswordStrength memvalidasi kata sandi baru sesuai standar keamanan siber Diskominfo:
// 1. Minimal 8 karakter
// 2. Kombinasi huruf besar (A-Z) dan huruf kecil (a-z)
// 3. Mengandung minimal 1 angka (0-9)
// 4. Mengandung minimal 1 simbol / karakter khusus (!@#$%^&* dll)
func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return errors.New("Kata sandi baru minimal 8 karakter")
	}

	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	if !hasUpper || !hasLower {
		return errors.New("Kata sandi baru harus memadukan kombinasi huruf besar dan kecil")
	}

	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	if !hasNumber {
		return errors.New("Kata sandi baru harus mengandung minimal 1 angka (0-9)")
	}

	hasSpecial := regexp.MustCompile(`[^A-Za-z0-9]`).MatchString(password)
	if !hasSpecial {
		return errors.New("Kata sandi baru harus mengandung minimal 1 simbol khusus (!@#$%^&*)")
	}

	return nil
}
