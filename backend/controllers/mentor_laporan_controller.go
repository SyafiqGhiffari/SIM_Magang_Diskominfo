package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// ItemLaporanPesertaResp merepresentasikan data laporan akhir satu peserta untuk mentor
type ItemLaporanPesertaResp struct {
	ID                   uint       `json:"id"`
	PendaftaranID        uint       `json:"pendaftaran_id"`
	AkunPesertaID        *uint      `json:"akun_peserta_id"`
	NamaLengkap          string     `json:"nama_lengkap"`
	Email                string     `json:"email"`
	NomorHP              string     `json:"nomor_hp"`
	KategoriPendaftar    string     `json:"kategori_pendaftar"`
	NimNisn              string     `json:"nim_nisn"`
	Institusi            string     `json:"institusi"`
	Fakultas             string     `json:"fakultas"`
	Jurusan              string     `json:"jurusan"`
	PosisiBidang         string     `json:"posisi_bidang"`
	TanggalMulai         string     `json:"tanggal_mulai"`
	TanggalSelesai       string     `json:"tanggal_selesai"`
	FotoProfil           string     `json:"foto_profil"`
	StatusMagang         string     `json:"status_magang"`
	FileLaporanAkhir     string     `json:"file_laporan_akhir"`
	JudulLaporanAkhir    string     `json:"judul_laporan_akhir"`
	LinkProyek           string     `json:"link_proyek"`
	CatatanLaporanAkhir  string     `json:"catatan_laporan_akhir"`
	CatatanMentorLaporan string     `json:"catatan_mentor_laporan"`
	TanggalUploadLaporan *time.Time `json:"tanggal_upload_laporan"`
	StatusLaporan        string     `json:"status_laporan"` // "belum_mengunggah", "menunggu_review", "revisi", "disetujui"
	LaporanAkhirDisetujui bool      `json:"laporan_akhir_disetujui"`
	NilaiAkhirAngka      *float64   `json:"nilai_akhir_angka"`
	IndeksNilaiAkhir     *string    `json:"indeks_nilai_akhir"`
	StatusPenilaian      string     `json:"status_penilaian"`
}

// GetLaporanAkhirMentor mengambil daftar laporan akhir peserta bimbingan untuk mentor
func GetLaporanAkhirMentor(c *gin.Context) {
	mentorID, ok := getUserIDFromContext(c)
	if !ok || mentorID == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

	var pendaftaranList []models.PendaftaranMagang
	if err := config.DB.Preload("AkunPeserta").
		Where("mentor_id = ? AND status_pendaftaran = 'diterima'", mentorID).
		Order("id DESC").
		Find(&pendaftaranList).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data laporan akhir peserta bimbingan")
		return
	}

	items := make([]ItemLaporanPesertaResp, 0, len(pendaftaranList))

	totalPeserta := len(pendaftaranList)
	menungguReview := 0
	disetujuiCount := 0
	revisiCount := 0
	belumMengunggahCount := 0

	for _, p := range pendaftaranList {
		institusi := p.AsalSekolah
		jurusan := p.JurusanSekolah
		nimNisn := p.Nisn
		if p.KategoriPendaftar == "mahasiswa" {
			institusi = p.AsalKampus
			jurusan = p.ProgramStudi
			nimNisn = p.NpmNim
		}

		foto := p.FilePasFoto
		statusMagang := "aktif"
		email := p.Email
		hp := p.NomorHP

		if p.AkunPeserta != nil {
			if p.AkunPeserta.FotoProfil != "" {
				foto = p.AkunPeserta.FotoProfil
			}
			if p.AkunPeserta.StatusMagang != "" {
				statusMagang = p.AkunPeserta.StatusMagang
			}
			if p.AkunPeserta.Email != "" {
				email = p.AkunPeserta.Email
			}
			if p.AkunPeserta.NoHp != "" {
				hp = p.AkunPeserta.NoHp
			}
		}

		// Ambil status penilaian & persetujuan laporan akhir
		var pen models.PenilaianMagang
		var laporanDisetujui bool
		var nilaiAngka *float64
		var indeks *string
		statusPenilaian := "belum_dinilai"

		if p.AkunPesertaID != nil {
			if errPen := config.DB.Where("peserta_id = ?", *p.AkunPesertaID).First(&pen).Error; errPen == nil {
				laporanDisetujui = pen.LaporanAkhirDisetujui
				nilaiAngka = &pen.NilaiAkhirAngka
				indeks = &pen.IndeksNilaiAkhir
				statusPenilaian = pen.StatusPenilaian
			}
		}

		// Tentukan status laporan:
		// 1. Jika belum ada file laporan -> "belum_mengunggah"
		// 2. Jika laporan_akhir_disetujui == true atau StatusLaporanAkhir == "disetujui" -> "disetujui"
		// 3. Jika StatusLaporanAkhir == "revisi" -> "revisi"
		// 4. Default jika sudah unggah dan belum disetujui -> "menunggu_review"
		statusLaporan := "belum_mengunggah"
		hasFile := strings.TrimSpace(p.FileLaporanAkhir) != ""

		catatanMentor := p.CatatanMentorLaporan
		if catatanMentor == "" && pen.CatatanMentor != "" {
			catatanMentor = pen.CatatanMentor
		}

		if !hasFile {
			statusLaporan = "belum_mengunggah"
			belumMengunggahCount++
		} else if laporanDisetujui || p.StatusLaporanAkhir == "disetujui" {
			statusLaporan = "disetujui"
			disetujuiCount++
		} else if p.StatusLaporanAkhir == "revisi" || p.StatusLaporanAkhir == "perlu_revisi" {
			statusLaporan = "revisi"
			revisiCount++
		} else {
			statusLaporan = "menunggu_review"
			menungguReview++
		}

		item := ItemLaporanPesertaResp{
			ID:                    p.ID,
			PendaftaranID:         p.ID,
			AkunPesertaID:         p.AkunPesertaID,
			NamaLengkap:           p.NamaLengkap,
			Email:                 email,
			NomorHP:               hp,
			KategoriPendaftar:     p.KategoriPendaftar,
			NimNisn:               nimNisn,
			Institusi:             institusi,
			Fakultas:              p.Fakultas,
			Jurusan:               jurusan,
			PosisiBidang:          p.PosisiBidang,
			TanggalMulai:          p.TanggalMulai,
			TanggalSelesai:        p.TanggalSelesai,
			FotoProfil:            foto,
			StatusMagang:          statusMagang,
			FileLaporanAkhir:      p.FileLaporanAkhir,
			JudulLaporanAkhir:     p.JudulLaporanAkhir,
			LinkProyek:            p.LinkProyek,
			CatatanLaporanAkhir:   p.CatatanLaporanAkhir,
			CatatanMentorLaporan:  catatanMentor,
			TanggalUploadLaporan:  p.TanggalUploadLaporan,
			StatusLaporan:         statusLaporan,
			LaporanAkhirDisetujui: laporanDisetujui,
			NilaiAkhirAngka:       nilaiAngka,
			IndeksNilaiAkhir:      indeks,
			StatusPenilaian:       statusPenilaian,
		}

		items = append(items, item)
	}

	utils.SuccessResponse(c, http.StatusOK, "Data laporan akhir peserta berhasil dimuat", gin.H{
		"laporan": items,
		"statistik": gin.H{
			"total_peserta":    totalPeserta,
			"menunggu_review":  menungguReview,
			"disetujui":        disetujuiCount,
			"revisi":           revisiCount,
			"belum_mengunggah": belumMengunggahCount,
		},
	})
}

// VerifikasiLaporanAkhirMentor memproses persetujuan atau permintaan revisi laporan akhir
func VerifikasiLaporanAkhirMentor(c *gin.Context) {
	mentorID, ok := getUserIDFromContext(c)
	if !ok || mentorID == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

	pendaftaranIDStr := c.Param("pendaftaran_id")
	pendaftaranID, err := strconv.ParseUint(pendaftaranIDStr, 10, 64)
	if err != nil || pendaftaranID == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID Pendaftaran tidak valid")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Preload("AkunPeserta").First(&pendaftaran, pendaftaranID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran peserta tidak ditemukan")
		return
	}

	if pendaftaran.MentorID == nil || *pendaftaran.MentorID != mentorID {
		utils.ErrorResponse(c, http.StatusForbidden, "Anda tidak memiliki wewenang memverifikasi laporan peserta ini")
		return
	}

	if strings.TrimSpace(pendaftaran.FileLaporanAkhir) == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Peserta belum mengunggah naskah laporan akhir")
		return
	}

	var input struct {
		Status  string `json:"status"`  // "disetujui" atau "revisi"
		Catatan string `json:"catatan"` // Catatan dari mentor
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid: "+err.Error())
		return
	}

	statusReq := strings.ToLower(strings.TrimSpace(input.Status))
	catatanReq := strings.TrimSpace(input.Catatan)

	if statusReq != "disetujui" && statusReq != "revisi" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Status harus 'disetujui' atau 'revisi'")
		return
	}

	if statusReq == "revisi" && catatanReq == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Catatan revisi wajib diisi agar peserta mengetahui perbaikan yang diperlukan")
		return
	}

	// 1. Simpan status verifikasi laporan dan catatan mentor di pendaftaran_magangs
	pendaftaran.StatusLaporanAkhir = statusReq
	pendaftaran.CatatanMentorLaporan = catatanReq
	if err := config.DB.Save(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui data pendaftaran magang")
		return
	}

	// 2. Sinkronkan dengan penilaian_magangs jika peserta memiliki akun
	laporanDisetujui := (statusReq == "disetujui")
	if pendaftaran.AkunPesertaID != nil {
		pesertaID := *pendaftaran.AkunPesertaID
		var pen models.PenilaianMagang
		errPen := config.DB.Where("peserta_id = ?", pesertaID).First(&pen).Error

		if errPen == nil {
			// Perbarui penilaian yang ada
			pen.LaporanAkhirDisetujui = laporanDisetujui
			if catatanReq != "" {
				pen.CatatanMentor = catatanReq
			}
			// Hitung ulang nilai administratif otomatis
			_, _, _, _, rataAdmin := HitungSkorAdministratifOtomatis(config.DB, pesertaID, laporanDisetujui)
			pen.NilaiAdministratif = rataAdmin

			// Hitung ulang nilai akhir
			setting, _ := GetOrCreatePengaturanPenilaian(config.DB)
			nilaiAkhir := (pen.NilaiProfesional*setting.BobotProfesional +
				pen.NilaiPersonal*setting.BobotPersonal +
				pen.NilaiSosial*setting.BobotSosial +
				pen.NilaiAdministratif*setting.BobotAdministratif) / 100.0
			pen.NilaiAkhirAngka = nilaiAkhir
			pen.IndeksNilaiAkhir, pen.PredikatAkhir = HitungIndeksDanPredikat(nilaiAkhir)

			_ = config.DB.Save(&pen)
		} else {
			// Jika belum ada row penilaian, buatkan draf dengan laporan_akhir_disetujui
			setting, _ := GetOrCreatePengaturanPenilaian(config.DB)
			_, _, _, _, rataAdmin := HitungSkorAdministratifOtomatis(config.DB, pesertaID, laporanDisetujui)
			indeks, predikat := HitungIndeksDanPredikat(rataAdmin)

			pen = models.PenilaianMagang{
				PesertaID:             pesertaID,
				MentorID:              mentorID,
				BobotProfesional:      setting.BobotProfesional,
				BobotPersonal:         setting.BobotPersonal,
				BobotSosial:           setting.BobotSosial,
				BobotAdministratif:    setting.BobotAdministratif,
				NilaiAdministratif:    rataAdmin,
				LaporanAkhirDisetujui: laporanDisetujui,
				StatusPenilaian:       "belum_dinilai",
				CatatanMentor:         catatanReq,
				IndeksNilaiAkhir:      indeks,
				PredikatAkhir:         predikat,
			}
			_ = config.DB.Create(&pen)
		}

		// 3. Kirim notifikasi in-app ke peserta
		tipeNotif := "laporan_akhir"
		var judulNotif, pesanNotif string

		if laporanDisetujui {
			judulNotif = "Laporan Akhir Disahkan"
			if catatanReq != "" {
				pesanNotif = fmt.Sprintf("Selamat! Naskah laporan akhir Anda telah diverifikasi dan disetujui oleh mentor pembimbing. Catatan mentor: %s", catatanReq)
			} else {
				pesanNotif = "Selamat! Naskah laporan akhir Anda telah diverifikasi dan disahkan oleh mentor pembimbing. Nilai laporan akhir magang telah disinkronkan."
			}
		} else {
			judulNotif = "Revisi Laporan Akhir"
			pesanNotif = fmt.Sprintf("Mentor pembimbing meminta revisi pada naskah laporan akhir Anda: \"%s\". Silakan perbaiki naskah dan unggah kembali.", catatanReq)
		}

		notif := models.Notifikasi{
			TargetRole:   "peserta",
			TargetUserID: &pesertaID,
			Tipe:         tipeNotif,
			Prioritas:    "tinggi",
			Judul:        judulNotif,
			Pesan:        pesanNotif,
			RefTabel:     "pendaftaran_magangs",
			RefID:        &pendaftaran.ID,
			UrlTujuan:    "/peserta/penilaian/laporan",
		}
		_ = config.DB.Create(&notif)
	}

	pesanSukses := "Naskah laporan akhir berhasil disahkan"
	if !laporanDisetujui {
		pesanSukses = "Catatan revisi laporan akhir berhasil dikirimkan ke peserta"
	}

	utils.SuccessResponse(c, http.StatusOK, pesanSukses, gin.H{
		"pendaftaran_id":          pendaftaran.ID,
		"status":                  statusReq,
		"catatan":                 catatanReq,
		"laporan_akhir_disetujui": laporanDisetujui,
	})
}

// KirimPengingatLaporanMentor mengirimkan notifikasi pengingat kepada peserta bimbingan yang belum mengumpulkan laporan
func KirimPengingatLaporanMentor(c *gin.Context) {
	mentorID, ok := getUserIDFromContext(c)
	if !ok || mentorID == 0 {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

	pendaftaranIDStr := c.Param("pendaftaran_id")
	pendaftaranID, err := strconv.ParseUint(pendaftaranIDStr, 10, 64)
	if err != nil || pendaftaranID == 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID Pendaftaran tidak valid")
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Preload("AkunPeserta").First(&pendaftaran, pendaftaranID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran peserta tidak ditemukan")
		return
	}

	if pendaftaran.MentorID == nil || *pendaftaran.MentorID != mentorID {
		utils.ErrorResponse(c, http.StatusForbidden, "Anda tidak memiliki wewenang untuk peserta ini")
		return
	}

	if pendaftaran.AkunPesertaID == nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Peserta belum memiliki akun aktif")
		return
	}

	pesertaID := *pendaftaran.AkunPesertaID

	notif := models.Notifikasi{
		TargetRole:   "peserta",
		TargetUserID: &pesertaID,
		Tipe:         "laporan_akhir",
		Prioritas:    "tinggi",
		Judul:        "Pengingat Unggah Laporan Akhir Magang",
		Pesan:        "Mentor pembimbing Anda mengingatkan untuk segera menyusun dan mengunggah naskah Laporan Akhir serta luaran proyek magang ke sistem.",
		RefTabel:     "pendaftaran_magangs",
		RefID:        &pendaftaran.ID,
		UrlTujuan:    "/peserta/penilaian/laporan",
	}

	if err := config.DB.Create(&notif).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengirimkan pengingat: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengingat pengumpulan laporan berhasil dikirim ke peserta", gin.H{
		"peserta_id": pesertaID,
	})
}
