package config

import (
	"fmt"
	"log"
	"os"

	"sim-magang-backend/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	err := godotenv.Load()
	if err != nil {
		log.Println("File .env tidak ditemukan, menggunakan konfigurasi sistem")
	}

	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser,
		dbPassword,
		dbHost,
		dbPort,
		dbName,
	)

	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal koneksi ke database MySQL: ", err)
	}

	DB = database

	err = DB.AutoMigrate(
		&models.UserPendaftaran{},
		&models.UserManajemen{},
		&models.PendaftaranMagang{},
		&models.ChatSession{},
		&models.ChatMessage{},
		&models.FaqEntry{},
		&models.FaqPertanyaan{},
		&models.FaqFeedback{},
		&models.BidangMagang{},
		&models.PengaturanLandingPage{},
		&models.LandingHeroSlide{},
		&models.LandingKonten{},
		&models.LandingMenu{},
		&models.JamKerja{},
		&models.HariLibur{},
		&models.Sertifikat{},
		&models.TemplateSertifikat{},
		&models.Presensi{},
		&models.PenutupanPresensi{},
		&models.PengajuanIzin{},
		&models.Notifikasi{},
		&models.TemplateSurat{},
		&models.SuratPenerimaan{},
		&models.PengaturanPenilaian{},
		&models.PenilaianMagang{},
		&models.TemplateRapor{},
		&models.MateriPembelajaran{},
		&models.KategoriMateri{},
		&models.TugasMagang{},
		&models.PengumpulanTugas{},
		&models.UserLoginHistory{},
	)

	if err != nil {
		log.Fatal("Gagal melakukan migrasi database: ", err)
	}

	// Hapus kolom lupa_presensi dari tabel presensis jika masih ada di database
	if DB.Migrator().HasColumn("presensis", "lupa_presensi") {
		_ = DB.Migrator().DropColumn("presensis", "lupa_presensi")
	}

	// Sinkronisasi otomatis foto profil peserta manajemen dari berkas pas foto pendaftaran jika belum terisi
	_ = DB.Exec(`
		UPDATE user_manajemens u
		JOIN pendaftaran_magangs p ON p.akun_peserta_id = u.id
		SET u.foto_profil = p.file_pas_foto
		WHERE (u.foto_profil IS NULL OR u.foto_profil = '')
		  AND (p.file_pas_foto IS NOT NULL AND p.file_pas_foto != '')
	`).Error

	fmt.Println("Berhasil koneksi dan migrasi database MySQL")
}
