// ==============================================================================
// CONTROLLER: LAPORAN AKHIR CONTROLLER
// DESKRIPSI : Pengelolaan naskah laporan akhir magang dan tautan luaran proyek.
//             Mencakup pengunggahan & pemantauan oleh peserta magang, serta
//             verifikasi, revisi, sinkronisasi nilai akhir, dan pengingat oleh mentor.
// ROLE TERKAIT: [ROLE: MENTOR], [ROLE: PESERTA]
// ==============================================================================

package controllers

import (
	"errors"
	"fmt"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	emailtemplates "sim-magang-backend/services/email_templates"
	"sim-magang-backend/utils"
)

// ItemLaporanPesertaResp merepresentasikan data laporan akhir satu peserta untuk mentor
type ItemLaporanPesertaResp struct {
	ID                    uint       `json:"id"`
	PendaftaranID         uint       `json:"pendaftaran_id"`
	AkunPesertaID         *uint      `json:"akun_peserta_id"`
	NamaLengkap           string     `json:"nama_lengkap"`
	Email                 string     `json:"email"`
	NomorHP               string     `json:"nomor_hp"`
	KategoriPendaftar     string     `json:"kategori_pendaftar"`
	NimNisn               string     `json:"nim_nisn"`
	Institusi             string     `json:"institusi"`
	Fakultas              string     `json:"fakultas"`
	Jurusan               string     `json:"jurusan"`
	PosisiBidang          string     `json:"posisi_bidang"`
	TanggalMulai          string     `json:"tanggal_mulai"`
	TanggalSelesai        string     `json:"tanggal_selesai"`
	FotoProfil            string     `json:"foto_profil"`
	StatusMagang          string     `json:"status_magang"`
	FileLaporanAkhir      string     `json:"file_laporan_akhir"`
	JudulLaporanAkhir     string     `json:"judul_laporan_akhir"`
	LinkProyek            string     `json:"link_proyek"`
	CatatanLaporanAkhir   string     `json:"catatan_laporan_akhir"`
	CatatanMentorLaporan  string     `json:"catatan_mentor_laporan"`
	TanggalUploadLaporan  *time.Time `json:"tanggal_upload_laporan"`
	StatusLaporan         string     `json:"status_laporan"` // "belum_mengunggah", "menunggu_review", "revisi", "disetujui"
	LaporanAkhirDisetujui bool       `json:"laporan_akhir_disetujui"`
	NilaiAkhirAngka       *float64   `json:"nilai_akhir_angka"`
	IndeksNilaiAkhir      *string    `json:"indeks_nilai_akhir"`
	StatusPenilaian       string     `json:"status_penilaian"`
}

// ==============================================================================
// ── BAGIAN MENTOR: LAPORAN AKHIR PESERTA BIMBINGAN ─────────────────────────────
// ==============================================================================

// [ROLE: MENTOR]
// GetLaporanAkhirMentor mengambil daftar status laporan akhir magang seluruh peserta bimbingan yang dimentori oleh mentor yang sedang login.
// Endpoint: GET /api/manajemen/mentor/laporan-akhir
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

// [ROLE: MENTOR]
// VerifikasiLaporanAkhirMentor memproses verifikasi pengesahan ("disetujui") atau permintaan revisi ("revisi") beserta catatan pembimbing untuk naskah laporan akhir peserta bimbingan, sekaligus memperbarui nilai administratif dan nilai akhir magang.
// Endpoint: POST /api/manajemen/mentor/laporan-akhir/:pendaftaran_id/verifikasi
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
			// Perbarui status laporan pada penilaian yang ada
			pen.LaporanAkhirDisetujui = laporanDisetujui
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
				CatatanMentor:         "",
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

		// 4. Kirim email notifikasi resmi ke peserta
		var namaMentor string
		var mUser models.UserManajemen
		if errM := config.DB.Select("nama").First(&mUser, mentorID).Error; errM == nil {
			namaMentor = mUser.Nama
		}
		if namaMentor == "" {
			namaMentor = "Mentor Pembimbing"
		}

		targetEmail := utils.EmailAktifPeserta(config.DB, pesertaID)
		if targetEmail == "" {
			targetEmail = pendaftaran.Email
		}

		go func(toEmail, nmPeserta, nmMentor, ctt string, disetujui bool) {
			if toEmail == "" {
				return
			}
			if disetujui {
				body := emailtemplates.TemplateLaporanAkhirDisetujui(nmPeserta, nmMentor, ctt)
				_ = services.SendEmail(toEmail, "Laporan Akhir Magang Disahkan (ACC)", body)
			} else {
				body := emailtemplates.TemplateLaporanAkhirRevisi(nmPeserta, nmMentor, ctt)
				_ = services.SendEmail(toEmail, "Permintaan Revisi Laporan Akhir Magang", body)
			}
		}(targetEmail, pendaftaran.NamaLengkap, namaMentor, catatanReq, laporanDisetujui)
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

// [ROLE: MENTOR]
// KirimPengingatLaporanMentor mengirimkan notifikasi in-app dan email pengingat kepada peserta bimbingan yang belum mengunggah naskah laporan akhir magang.
// Endpoint: POST /api/manajemen/mentor/laporan-akhir/:pendaftaran_id/pengingat
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

	// Kirim notifikasi email ke peserta secara asinkron
	var mentor models.UserManajemen
	config.DB.Select("id, nama").First(&mentor, mentorID)

	if pendaftaran.Email != "" {
		go func(email, namaPeserta, namaMentor string) {
			subject := "Pengingat Unggah Laporan Akhir Magang — SIM Magang Diskominfo"
			body := emailtemplates.TemplatePengingatLaporanMentor(namaPeserta, namaMentor)
			_ = services.SendEmail(email, subject, body)
		}(pendaftaran.Email, pendaftaran.NamaLengkap, mentor.Nama)
	}

	utils.SuccessResponse(c, http.StatusOK, "Pengingat pengumpulan laporan berhasil dikirim ke peserta", gin.H{
		"peserta_id": pesertaID,
	})
}

// ==============================================================================
// ── BAGIAN PESERTA: UNGGAH & STATUS LAPORAN AKHIR ──────────────────────────────
// ==============================================================================

// [ROLE: PESERTA]
// GetLaporanAkhirPeserta mengambil data status laporan akhir magang, berkas yang diunggah, catatan revisi mentor, timeline durasi magang, dan profil mentor pembimbing untuk peserta yang sedang login.
// Endpoint: GET /api/manajemen/peserta/laporan-akhir
func GetLaporanAkhirPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran magang tidak ditemukan")
		return
	}

	var mentorData gin.H = nil
	if pendaftaran.MentorID != nil {
		var mentor models.UserManajemen
		if config.DB.First(&mentor, *pendaftaran.MentorID).Error == nil {
			mentorData = gin.H{
				"id":          mentor.ID,
				"nama":        mentor.Nama,
				"nip":         mentor.Nip,
				"foto_profil": mentor.FotoProfil,
				"jabatan":     mentor.Jabatan,
				"email":       mentor.Email,
				"no_hp":       mentor.NoHp,
			}
		}
	}

	hariIniStr := utils.TanggalHariIni()
	hariIniTime, _ := time.Parse("2006-01-02", hariIniStr)
	totalHari := 0
	hariKe := 0
	sisaHari := 0
	progresPersen := 0.0
	statusTimeline := "belum_mulai"

	if pendaftaran.TanggalMulai != "" && pendaftaran.TanggalSelesai != "" {
		tMulai, errMulai := time.Parse("2006-01-02", pendaftaran.TanggalMulai)
		tSelesai, errSelesai := time.Parse("2006-01-02", pendaftaran.TanggalSelesai)
		if errMulai == nil && errSelesai == nil {
			totalHari = int(tSelesai.Sub(tMulai).Hours()/24) + 1
			if totalHari < 1 {
				totalHari = 1
			}
			if hariIniTime.Before(tMulai) {
				statusTimeline = "belum_mulai"
				sisaHari = totalHari
			} else if hariIniTime.After(tSelesai) {
				statusTimeline = "selesai"
				hariKe = totalHari
				sisaHari = 0
				progresPersen = 100.0
			} else {
				statusTimeline = "berjalan"
				hariKe = int(hariIniTime.Sub(tMulai).Hours()/24) + 1
				if hariKe > totalHari {
					hariKe = totalHari
				}
				sisaHari = totalHari - hariKe
				if sisaHari < 0 {
					sisaHari = 0
				}
				progresPersen = math.Round((float64(hariKe)/float64(totalHari)*100)*10) / 10
			}
		}
	}

	var penilaian models.PenilaianMagang
	adaPenilaian := config.DB.Where("peserta_id = ?", pesertaID).First(&penilaian).Error == nil

	laporanDisetujui := (adaPenilaian && penilaian.LaporanAkhirDisetujui) || pendaftaran.StatusLaporanAkhir == "disetujui"
	statusLaporan := "belum_unggah"
	catatanMentorLaporan := pendaftaran.CatatanMentorLaporan
	if catatanMentorLaporan == "" && adaPenilaian {
		catatanMentorLaporan = penilaian.CatatanMentor
	}

	if strings.TrimSpace(pendaftaran.FileLaporanAkhir) != "" {
		if laporanDisetujui {
			statusLaporan = "disetujui"
		} else if pendaftaran.StatusLaporanAkhir == "revisi" || pendaftaran.StatusLaporanAkhir == "perlu_revisi" {
			statusLaporan = "perlu_revisi"
		} else {
			statusLaporan = "menunggu_review"
		}
	}

	institusi := pendaftaran.AsalSekolah
	jurusan := pendaftaran.JurusanSekolah
	nimNisn := pendaftaran.Nisn
	if pendaftaran.KategoriPendaftar == "mahasiswa" {
		institusi = pendaftaran.AsalKampus
		jurusan = pendaftaran.ProgramStudi
		nimNisn = pendaftaran.NpmNim
	}

	utils.SuccessResponse(c, http.StatusOK, "Data laporan akhir peserta berhasil dimuat", gin.H{
		"pendaftaran": gin.H{
			"id":                     pendaftaran.ID,
			"posisi_bidang":          pendaftaran.PosisiBidang,
			"institusi":              institusi,
			"jurusan_prodi":          jurusan,
			"nomor_identitas":        nimNisn,
			"kategori_pendaftar":     pendaftaran.KategoriPendaftar,
			"tanggal_mulai":          pendaftaran.TanggalMulai,
			"tanggal_selesai":        pendaftaran.TanggalSelesai,
			"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
			"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
			"link_proyek":            pendaftaran.LinkProyek,
			"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
			"catatan_mentor":         catatanMentorLaporan,
			"catatan_mentor_laporan": catatanMentorLaporan,
			"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
		},
		"laporan_akhir": gin.H{
			"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
			"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
			"link_proyek":            pendaftaran.LinkProyek,
			"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
			"catatan_mentor":         catatanMentorLaporan,
			"catatan_mentor_laporan": catatanMentorLaporan,
			"status":                 statusLaporan,
			"status_laporan":         statusLaporan,
			"disetujui":              laporanDisetujui,
			"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
			"sisa_hari":              sisaHari,
		},
		"timeline": gin.H{
			"status":         statusTimeline,
			"total_hari":     totalHari,
			"hari_ke":        hariKe,
			"sisa_hari":      sisaHari,
			"progres_persen": progresPersen,
		},
		"mentor": mentorData,
	})
}

// simpanFileLaporan menyimpan file PDF laporan akhir magang ke uploads/laporan-magang/YYYY-MM
func simpanFileLaporan(c *gin.Context, file *multipart.FileHeader, pesertaID uint) (string, error) {
	if file == nil {
		return "", nil
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" {
		return "", errors.New("hanya berkas dengan format PDF yang diperbolehkan")
	}

	// Maksimal 20 MB
	if file.Size > 20*1024*1024 {
		return "", errors.New("ukuran berkas laporan maksimal 20 MB")
	}

	uploadDir := filepath.Join("uploads", "laporan-magang", utils.SekarangWIB().Format("2006-01"))
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return "", errors.New("gagal membuat folder penyimpanan laporan magang")
	}

	fileName := fmt.Sprintf("laporan_peserta_%d_%d%s", pesertaID, time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, fileName)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		return "", errors.New("gagal menyimpan berkas laporan magang")
	}
	return strings.ReplaceAll(filePath, "\\", "/"), nil
}

// [ROLE: PESERTA]
// UploadLaporanAkhirPeserta menangani pengunggahan berkas PDF naskah laporan akhir magang (maksimal 20 MB) serta pembaruan judul laporan, link luaran proyek, dan catatan pengantar dari peserta.
// Endpoint: POST /api/manajemen/peserta/laporan-akhir
func UploadLaporanAkhirPeserta(c *gin.Context) {
	pesertaID, ok := pesertaIDDariToken(c)
	if !ok {
		return
	}

	var pendaftaran models.PendaftaranMagang
	if err := config.DB.Where("akun_peserta_id = ?", pesertaID).Order("id desc").First(&pendaftaran).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data pendaftaran magang tidak ditemukan")
		return
	}

	judul := strings.TrimSpace(c.PostForm("judul_laporan_akhir"))
	if judul == "" {
		judul = strings.TrimSpace(c.PostForm("judul"))
	}
	linkProyek := strings.TrimSpace(c.PostForm("link_proyek"))
	catatan := strings.TrimSpace(c.PostForm("catatan_laporan_akhir"))
	if catatan == "" {
		catatan = strings.TrimSpace(c.PostForm("catatan"))
	}

	fileLaporan, errFile := c.FormFile("file_laporan")
	if errFile != nil {
		fileLaporan, _ = c.FormFile("file")
	}
	var fileLaporanPath string
	if fileLaporan != nil {
		path, err := simpanFileLaporan(c, fileLaporan, pesertaID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
			return
		}
		fileLaporanPath = path
	}

	if judul != "" {
		pendaftaran.JudulLaporanAkhir = judul
	}
	if linkProyek != "" {
		pendaftaran.LinkProyek = linkProyek
	}
	pendaftaran.CatatanLaporanAkhir = catatan
	pendaftaran.StatusLaporanAkhir = "menunggu_review"

	now := time.Now()
	var oldLaporan string
	if fileLaporanPath != "" {
		oldLaporan = pendaftaran.FileLaporanAkhir
		pendaftaran.FileLaporanAkhir = fileLaporanPath
		pendaftaran.TanggalUploadLaporan = &now
	} else if pendaftaran.TanggalUploadLaporan == nil && pendaftaran.FileLaporanAkhir != "" {
		pendaftaran.TanggalUploadLaporan = &now
	}

	if err := config.DB.Save(&pendaftaran).Error; err != nil {
		if fileLaporanPath != "" {
			_ = os.Remove(fileLaporanPath)
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menyimpan data laporan akhir")
		return
	}

	// Hapus file laporan lama dari server jika berkas diperbarui
	if oldLaporan != "" && oldLaporan != fileLaporanPath {
		cleanOld := strings.TrimPrefix(strings.ReplaceAll(oldLaporan, "\\", "/"), "/")
		if strings.HasPrefix(cleanOld, "uploads/") && !strings.Contains(cleanOld, "..") {
			_ = os.Remove(cleanOld)
		}
	}

	// Sinkronkan status persetujuan pada penilaian magang jika ada (kembali menjadi menunggu review)
	if pendaftaran.AkunPesertaID != nil {
		var pen models.PenilaianMagang
		if errPen := config.DB.Where("peserta_id = ?", *pendaftaran.AkunPesertaID).First(&pen).Error; errPen == nil {
			if pen.LaporanAkhirDisetujui {
				pen.LaporanAkhirDisetujui = false
				_, _, _, _, rataAdmin := HitungSkorAdministratifOtomatis(config.DB, *pendaftaran.AkunPesertaID, false)
				pen.NilaiAdministratif = rataAdmin
				setting, _ := GetOrCreatePengaturanPenilaian(config.DB)
				nilaiAkhir := (pen.NilaiProfesional*setting.BobotProfesional +
					pen.NilaiPersonal*setting.BobotPersonal +
					pen.NilaiSosial*setting.BobotSosial +
					pen.NilaiAdministratif*setting.BobotAdministratif) / 100.0
				pen.NilaiAkhirAngka = nilaiAkhir
				pen.IndeksNilaiAkhir, pen.PredikatAkhir = HitungIndeksDanPredikat(nilaiAkhir)
				_ = config.DB.Save(&pen)
			}
		}
	}

	// Tandai notifikasi pengingat peserta sebagai sudah dibaca
	config.DB.Model(&models.Notifikasi{}).
		Where("target_role = 'peserta' AND target_user_id = ? AND tipe = 'laporan_akhir' AND judul LIKE 'Pengingat%' AND dibaca_pada IS NULL", pesertaID).
		Update("dibaca_pada", time.Now())

	// Kirim notifikasi ke mentor pembimbing jika ada
	if pendaftaran.MentorID != nil {
		mentorID := *pendaftaran.MentorID
		go services.KirimNotifikasi(services.NotifikasiInput{
			TargetRole:   "mentor",
			TargetUserID: &mentorID,
			Tipe:         "laporan_akhir",
			Prioritas:    "tinggi",
			Judul:        "Laporan Akhir Magang Diserahkan",
			Pesan:        fmt.Sprintf("Peserta %s telah mengunggah Laporan Akhir Magang (%s). Silakan tinjau.", pendaftaran.NamaLengkap, pendaftaran.JudulLaporanAkhir),
			RefTabel:     "pendaftaran_magangs",
			RefID:        &pendaftaran.ID,
			UrlTujuan:    "/mentor/laporan-akhir",
			Gabungkan:    false,
		})

		go func(mID uint, nmPeserta, jdl, link, ctt string) {
			var mentor models.UserManajemen
			if err := config.DB.Select("id, nama, email").First(&mentor, mID).Error; err == nil && mentor.Email != "" {
				body := emailtemplates.TemplateLaporanAkhirMasukMentor(mentor.Nama, nmPeserta, jdl, link, ctt)
				_ = services.SendEmail(mentor.Email, "Laporan Akhir Magang Diserahkan: "+nmPeserta, body)
			}
		}(mentorID, pendaftaran.NamaLengkap, pendaftaran.JudulLaporanAkhir, pendaftaran.LinkProyek, pendaftaran.CatatanLaporanAkhir)
	}

	utils.SuccessResponse(c, http.StatusOK, "Laporan akhir magang berhasil disimpan", gin.H{
		"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
		"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
		"link_proyek":            pendaftaran.LinkProyek,
		"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
		"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
	})
}
