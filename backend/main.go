package main

import (
	"os"
	"net/http"

	"sim-magang-backend/config"
	"sim-magang-backend/middlewares"
	"sim-magang-backend/routes"
	"sim-magang-backend/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		panic("File .env tidak ditemukan")
	}

	config.ConnectDatabase()

	// Penjadwal presensi: menutup hari yang sudah lewat & membuat status alfa
	// otomatis bagi peserta yang tidak presensi.
	services.MulaiPenjadwalPresensi(config.DB)

	// Penjadwal status magang: menandai peserta yang sudah selesai magang
	// menjadi read-only, tanpa memblokir loginnya.
	services.JalankanSchedulerStatusMagang()

	router := gin.Default()

	// Batas maksimal ukuran total form-data (6 file x 10MB + field lain)
	router.MaxMultipartMemory = 90 << 20

	router.Use(func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 90<<20)
		c.Next()
	})

	// Register CORS Middleware
	router.Use(middlewares.CORSMiddleware())

	// Static file untuk menyajikan file yang diunggah
	router.Static("/uploads", "./uploads")

	// Endpoint root untuk pengecekan server
	router.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Backend Sistem Informasi Manajemen Magang berjalan",
		})
	})

	routes.SetupRoutes(router)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8000"
	}

	router.Run(":" + port)
}