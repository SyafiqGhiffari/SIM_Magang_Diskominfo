package controllers

import (
	"math"
	"net/http"
	"strings"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/services"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// GetDashboardPeserta mengembalikan seluruh data konsolidasi untuk halaman dashboard peserta
func GetDashboardPeserta(c *gin.Context) {
	pesertaID, ok := getUserIDFromContext(c)
	if !ok {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi tidak valid, silakan login ulang")
		return
	}

	// Pastikan status presensi hari-hari sebelumnya sudah dikunci otomatis
	_ = services.PastikanHariTerkunci(config.DB)

	// 1. Ambil User Peserta
	var user models.UserManajemen
	if err := config.DB.First(&user, pesertaID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data peserta tidak ditemukan")
		return
	}

	// 2. Ambil Pendaftaran Magang
	var pendaftaran models.PendaftaranMagang
	hasPendaftaran := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		Order("id desc").
		First(&pendaftaran).Error == nil

	// 3. Hitung Timeline & Durasi Magang
	hariIniStr := utils.TanggalHariIni()
	sekarang := utils.SekarangWIB()
	hariIniTime, _ := time.Parse("2006-01-02", hariIniStr)

	totalHari := 0
	hariKe := 0
	sisaHari := 0
	progresPersen := 0.0
	statusTimeline := "belum_mulai" // belum_mulai | berjalan | selesai

	if hasPendaftaran && pendaftaran.TanggalMulai != "" && pendaftaran.TanggalSelesai != "" {
		tMulai, errMulai := time.Parse("2006-01-02", pendaftaran.TanggalMulai)
		tSelesai, errSelesai := time.Parse("2006-01-02", pendaftaran.TanggalSelesai)

		if errMulai == nil && errSelesai == nil {
			totalHari = int(tSelesai.Sub(tMulai).Hours()/24) + 1
			if totalHari < 1 {
				totalHari = 1
			}

			if hariIniTime.Before(tMulai) {
				statusTimeline = "belum_mulai"
				hariKe = 0
				sisaHari = totalHari
				progresPersen = 0.0
			} else if hariIniTime.After(tSelesai) || user.StatusMagang == "selesai" {
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

	// 4. Data Mentor Pembimbing & Surat Penerimaan
	var mentorData gin.H = nil
	if hasPendaftaran && pendaftaran.MentorID != nil {
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

	var suratData gin.H = nil
	if hasPendaftaran && pendaftaran.SuratPenerimaanID != nil {
		var surat models.SuratPenerimaan
		if config.DB.First(&surat, *pendaftaran.SuratPenerimaanID).Error == nil {
			suratData = gin.H{
				"id":             surat.ID,
				"nomor_surat":    surat.NomorSurat,
				"tanggal_terbit": surat.TanggalTerbit,
				"file_surat":     surat.FileSurat,
			}
		}
	}

	// 5. Status Presensi Hari Ini
	kal, _ := utils.MuatKalenderKerja(config.DB)
	infoHari := kal.CekHari(hariIniStr)

	var presensiHariIni models.Presensi
	adaPresensiHariIni := config.DB.
		Where("peserta_id = ? AND tanggal = ?", pesertaID, hariIniStr).
		First(&presensiHariIni).Error == nil

	izinHariIni := izinDisetujuiPada(pesertaID, hariIniStr)

	sudahMasuk := adaPresensiHariIni && presensiHariIni.JamMasuk != nil && *presensiHariIni.JamMasuk != ""
	sudahPulang := adaPresensiHariIni && presensiHariIni.JamPulang != nil && *presensiHariIni.JamPulang != ""

	statusPresensiHariIni := "belum_masuk"
	if !infoHari.HariKerja {
		statusPresensiHariIni = "libur"
	} else if izinHariIni != nil {
		statusPresensiHariIni = izinHariIni.Jenis // "izin" | "sakit"
	} else if sudahPulang {
		statusPresensiHariIni = "selesai"
	} else if sudahMasuk {
		statusPresensiHariIni = "sudah_masuk"
	}

	// 6. Rekap Statistik Kehadiran (Sepanjang Masa Magang)
	type statRow struct {
		Status string
		Total  int
	}
	var statRows []statRow
	config.DB.Model(&models.Presensi{}).
		Select("status, COUNT(*) as total").
		Where("peserta_id = ?", pesertaID).
		Group("status").
		Scan(&statRows)

	statMap := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	totalPresensi := 0
	for _, r := range statRows {
		statMap[r.Status] = r.Total
		totalPresensi += r.Total
	}

	totalHadirEfektif := statMap["hadir"] + statMap["terlambat"]
	persentaseKehadiran := 100.0
	if totalPresensi > 0 {
		persentaseKehadiran = math.Round((float64(totalHadirEfektif)/float64(totalPresensi)*100)*10) / 10
	}

	// 7. Pengajuan Izin Terkini (3 terakhir)
	var pengajuanIzinList []models.PengajuanIzin
	config.DB.
		Where("peserta_id = ?", pesertaID).
		Order("id desc").
		Limit(3).
		Find(&pengajuanIzinList)

	// 8. Evaluasi & Transkrip Nilai (jika ada)
	var nilai models.PenilaianMagang
	adaNilai := config.DB.
		Where("peserta_id = ?", pesertaID).
		First(&nilai).Error == nil

	var nilaiData gin.H = nil
	if adaNilai {
		nilaiData = gin.H{
			"status_penilaian":   nilai.StatusPenilaian,
			"nilai_akhir_angka":  nilai.NilaiAkhirAngka,
			"indeks_nilai_akhir": nilai.IndeksNilaiAkhir,
			"predikat_akhir":     nilai.PredikatAkhir,
			"tanggal_penilaian":  nilai.TanggalPenilaian,
		}
	}

	// 9. Status Sertifikat
	var sertifikat models.Sertifikat
	adaSertifikat := config.DB.
		Where("akun_peserta_id = ?", pesertaID).
		First(&sertifikat).Error == nil

	var sertifikatData gin.H = nil
	if adaSertifikat {
		sertifikatData = gin.H{
			"id":            sertifikat.ID,
			"no_sertifikat": sertifikat.NomorSertifikat,
			"status":        sertifikat.Status,
		}
	}

	// 10. Status Laporan Akhir Magang
	laporanDisetujui := (adaNilai && nilai.LaporanAkhirDisetujui) || pendaftaran.StatusLaporanAkhir == "disetujui"
	statusLaporan := "belum_unggah"
	catatanMentorLaporan := pendaftaran.CatatanMentorLaporan
	if catatanMentorLaporan == "" && adaNilai {
		catatanMentorLaporan = nilai.CatatanMentor
	}

	if hasPendaftaran && strings.TrimSpace(pendaftaran.FileLaporanAkhir) != "" {
		if laporanDisetujui {
			statusLaporan = "disetujui"
		} else if pendaftaran.StatusLaporanAkhir == "revisi" || pendaftaran.StatusLaporanAkhir == "perlu_revisi" {
			statusLaporan = "perlu_revisi"
		} else {
			statusLaporan = "menunggu_review"
		}
	}

	var laporanData gin.H = nil
	if hasPendaftaran {
		laporanData = gin.H{
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
		}
	}

	coalesceStr := func(a, b string) string {
		if a != "" {
			return a
		}
		return b
	}

	// Bentuk respons utuh
	dashboardData := gin.H{
		"peserta": gin.H{
			"id":            user.ID,
			"nama":          user.Nama,
			"email":         user.Email,
			"no_hp":         user.NoHp,
			"foto_profil":   user.FotoProfil,
			"status_akun":   user.StatusAkun,
			"status_magang": user.StatusMagang,
		},
		"pendaftaran": gin.H{
			"id":                     pendaftaran.ID,
			"ada":                    hasPendaftaran,
			"posisi_bidang":          pendaftaran.PosisiBidang,
			"institusi":              coalesceStr(pendaftaran.AsalKampus, pendaftaran.AsalSekolah),
			"jurusan_prodi":          coalesceStr(pendaftaran.ProgramStudi, pendaftaran.JurusanSekolah),
			"nomor_identitas":        coalesceStr(pendaftaran.NpmNim, pendaftaran.Nisn),
			"kategori_pendaftar":     pendaftaran.KategoriPendaftar,
			"tanggal_mulai":          pendaftaran.TanggalMulai,
			"tanggal_selesai":        pendaftaran.TanggalSelesai,
			"file_pas_foto":          pendaftaran.FilePasFoto,
			"surat_penerimaan":       suratData,
			"file_laporan_akhir":     pendaftaran.FileLaporanAkhir,
			"judul_laporan_akhir":    pendaftaran.JudulLaporanAkhir,
			"link_proyek":            pendaftaran.LinkProyek,
			"catatan_laporan_akhir":  pendaftaran.CatatanLaporanAkhir,
			"catatan_mentor":         catatanMentorLaporan,
			"catatan_mentor_laporan": catatanMentorLaporan,
			"tanggal_upload_laporan": pendaftaran.TanggalUploadLaporan,
		},
		"timeline": gin.H{
			"status":         statusTimeline,
			"total_hari":     totalHari,
			"hari_ke":        hariKe,
			"sisa_hari":      sisaHari,
			"progres_persen": progresPersen,
		},
		"mentor": mentorData,
		"presensi_hari_ini": gin.H{
			"tanggal":      hariIniStr,
			"hari":         infoHari.Hari,
			"hari_kerja":   infoHari.HariKerja,
			"alasan_libur": infoHari.Alasan,
			"jam_sekarang": utils.JamSekarang(),
			"jam_kerja": gin.H{
				"jam_masuk":           infoHari.JamKerja.JamMasuk,
				"jam_pulang":          infoHari.JamKerja.JamPulang,
				"toleransi_terlambat": infoHari.JamKerja.ToleransiTerlambat,
			},
			"status":      statusPresensiHariIni,
			"sudah_masuk": sudahMasuk,
			"sudah_pulang": sudahPulang,
			"jam_masuk_aktual": func() *string {
				if adaPresensiHariIni {
					return presensiHariIni.JamMasuk
				}
				return nil
			}(),
			"jam_pulang_aktual": func() *string {
				if adaPresensiHariIni {
					return presensiHariIni.JamPulang
				}
				return nil
			}(),
			"foto_masuk": func() string {
				if adaPresensiHariIni {
					return presensiHariIni.FotoMasuk
				}
				return ""
			}(),
			"foto_pulang": func() string {
				if adaPresensiHariIni {
					return presensiHariIni.FotoPulang
				}
				return ""
			}(),
			"izin_hari_ini": izinHariIni,
		},
		"statistik_kehadiran": gin.H{
			"total_presensi":       totalPresensi,
			"hadir":                statMap["hadir"],
			"terlambat":            statMap["terlambat"],
			"izin":                 statMap["izin"],
			"sakit":                statMap["sakit"],
			"alfa":                 statMap["alfa"],
			"persentase_kehadiran": persentaseKehadiran,
		},
		"pengajuan_izin_terkini": pengajuanIzinList,
		"penilaian":              nilaiData,
		"sertifikat":             sertifikatData,
		"laporan_akhir":          laporanData,
		"server_time":            sekarang.Format(time.RFC3339),
	}

	utils.SuccessResponse(c, http.StatusOK, "Data dashboard peserta berhasil dimuat", dashboardData)
}
