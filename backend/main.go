package main

import (
	"os"
	"net/http"

	"sim-magang-backend/config"
	"sim-magang-backend/middlewares"
	"sim-magang-backend/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		panic("File .env tidak ditemukan")
	}

	config.ConnectDatabase()

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