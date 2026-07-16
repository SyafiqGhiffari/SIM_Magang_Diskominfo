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
		&models.BidangMagang{},
	)

	if err != nil {
		log.Fatal("Gagal melakukan migrasi database: ", err)
	}

	fmt.Println("Berhasil koneksi dan migrasi database MySQL")
}