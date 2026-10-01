package controllers

import (
	"net/http"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

type AssignBidangMentorInput struct {
	BidangID *uint `json:"bidang_id"`
}

// AssignBidangMentor — menetapkan atau melepas bidang tempat mentor ini ditugaskan.
// Sumber kebenaran sekarang ada di UserManajemen.BidangID (bukan lagi di BidangMagang),
// sehingga satu bidang bisa memiliki banyak mentor sekaligus.
func AssignBidangMentor(c *gin.Context) {
	id := c.Param("id")

	var user models.UserManajemen
	if err := config.DB.First(&user, id).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Akun tidak ditemukan")
		return
	}
	if user.Role != "mentor" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Hanya akun mentor yang dapat ditugaskan ke bidang")
		return
	}

	var input AssignBidangMentorInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid")
		return
	}

	user.BidangID = input.BidangID
	if err := config.DB.Save(&user).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui penugasan bidang")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Penugasan bidang berhasil diperbarui", nil)
}

// CekMentorMasihDipakai — dipakai DeleteUserManajemen & CekUserBisaDihapus untuk
// memvalidasi mentor sebelum dihapus (cek apakah masih membimbing peserta tertentu).
func CekMentorMasihDipakai(userID uint) (int64, []string) {
	var pendaftaranList []models.PendaftaranMagang
	config.DB.Where("mentor_id = ?", userID).Find(&pendaftaranList)

	namaPeserta := make([]string, 0, len(pendaftaranList))
	for _, p := range pendaftaranList {
		namaPeserta = append(namaPeserta, p.NamaLengkap)
	}
	return int64(len(pendaftaranList)), namaPeserta
}

// GetPesertaBimbinganMentor — daftar peserta yang dibimbing oleh mentor tertentu,
// untuk ditampilkan di modal "Peserta Bimbingan" pada halaman Kelola Mentor.
func GetPesertaBimbinganMentor(c *gin.Context) {
	mentorID := c.Param("id")

	var mentor models.UserManajemen
	if err := config.DB.First(&mentor, mentorID).Error; err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Mentor tidak ditemukan")
		return
	}
	if mentor.Role != "mentor" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Akun ini bukan akun mentor")
		return
	}

	var pendaftaranList []models.PendaftaranMagang
	if err := config.DB.Preload("AkunPeserta").Where("mentor_id = ?", mentor.ID).Find(&pendaftaranList).Error; err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data peserta bimbingan")
		return
	}

	type PesertaBimbinganResp struct {
		ID             uint   `json:"id"`
		NamaLengkap    string `json:"nama_lengkap"`
		Institusi      string `json:"institusi"`
		PosisiBidang   string `json:"posisi_bidang"`
		TanggalMulai   string `json:"tanggal_mulai"`
		TanggalSelesai string `json:"tanggal_selesai"`
		StatusAkun     string `json:"status_akun"`
		FotoProfil     string `json:"foto_profil"`
	}

	result := make([]PesertaBimbinganResp, 0, len(pendaftaranList))
	for _, p := range pendaftaranList {
		institusi := p.AsalSekolah
		if p.KategoriPendaftar == "mahasiswa" {
			institusi = p.AsalKampus
		}

		resp := PesertaBimbinganResp{
			ID:             p.ID,
			NamaLengkap:    p.NamaLengkap,
			Institusi:      institusi,
			PosisiBidang:   p.PosisiBidang,
			TanggalMulai:   p.TanggalMulai,
			TanggalSelesai: p.TanggalSelesai,
		}
		if p.AkunPeserta != nil {
			resp.StatusAkun = p.AkunPeserta.StatusAkun
			resp.FotoProfil = p.AkunPeserta.FotoProfil
		}
		result = append(result, resp)
	}

	utils.SuccessResponse(c, http.StatusOK, "Data peserta bimbingan berhasil diambil", result)
}

// GetPesertaBimbinganSaya — daftar peserta bimbingan untuk mentor yang sedang login
func GetPesertaBimbinganSaya(c *gin.Context) {
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
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data peserta bimbingan")
		return
	}

	type PresensiStats struct {
		TotalHadir     int `json:"total_hadir"`
		TotalTerlambat int `json:"total_terlambat"`
		TotalIzin      int `json:"total_izin"`
		TotalSakit     int `json:"total_sakit"`
		TotalAlfa      int `json:"total_alfa"`
		TotalHari      int `json:"total_hari"`
	}

	type TugasTerakhirInfo struct {
		JudulTugas    string   `json:"judul_tugas"`
		StatusTugas   string   `json:"status_tugas"` // "belum_ada", "belum_dikumpulkan", "menunggu", "revisi", "dinilai"
		NilaiTugas    *float64 `json:"nilai_tugas"`
		TenggatWaktu  string   `json:"tenggat_waktu"`
	}

	type PesertaBimbinganDetailResp struct {
		ID                  uint               `json:"id"`
		AkunPesertaID       *uint              `json:"akun_peserta_id"`
		NamaLengkap         string             `json:"nama_lengkap"`
		Email               string             `json:"email"`
		NomorHP             string             `json:"nomor_hp"`
		KategoriPendaftar   string             `json:"kategori_pendaftar"`
		NimNisn             string             `json:"nim_nisn"`
		Institusi           string             `json:"institusi"`
		Fakultas            string             `json:"fakultas"`
		Jurusan             string             `json:"jurusan"`
		KelasSemester       string             `json:"kelas_semester"`
		PosisiBidang        string             `json:"posisi_bidang"`
		TanggalMulai        string             `json:"tanggal_mulai"`
		TanggalSelesai      string             `json:"tanggal_selesai"`
		AlamatLengkap       string             `json:"alamat_lengkap"`
		JenisKelamin        string             `json:"jenis_kelamin"`
		TempatLahir         string             `json:"tempat_lahir"`
		TanggalLahir        string             `json:"tanggal_lahir"`
		FotoProfil          string             `json:"foto_profil"`
		StatusAkun          string             `json:"status_akun"`
		StatusMagang        string             `json:"status_magang"`
		FileLaporanAkhir    string             `json:"file_laporan_akhir"`
		JudulLaporanAkhir   string             `json:"judul_laporan_akhir"`
		LinkProyek          string             `json:"link_proyek"`
		PresensiStats       PresensiStats      `json:"presensi_stats"`
		PersentaseKehadiran float64            `json:"persentase_kehadiran"`
		NilaiAkhirAngka     *float64           `json:"nilai_akhir_angka"`
		IndeksNilaiAkhir    *string            `json:"indeks_nilai_akhir"`
		PredikatAkhir       *string            `json:"predikat_akhir"`
		NilaiProfesional    *float64           `json:"nilai_profesional"`
		NilaiPersonal       *float64           `json:"nilai_personal"`
		NilaiSosial         *float64           `json:"nilai_sosial"`
		NilaiAdministratif  *float64           `json:"nilai_administratif"`
		CatatanMentor       *string            `json:"catatan_mentor"`
		TanggalPenilaian    *string            `json:"tanggal_penilaian"`
		StatusPenilaian     string             `json:"status_penilaian"`
		TugasTerakhir       *TugasTerakhirInfo `json:"tugas_terakhir"`
	}

	result := make([]PesertaBimbinganDetailResp, 0, len(pendaftaranList))

	for _, p := range pendaftaranList {
		institusi := p.AsalSekolah
		jurusan := p.JurusanSekolah
		kelasSem := p.Kelas
		nimNisn := p.Nisn
		if p.KategoriPendaftar == "mahasiswa" {
			institusi = p.AsalKampus
			jurusan = p.ProgramStudi
			kelasSem = p.Semester
			nimNisn = p.NpmNim
		}

		resp := PesertaBimbinganDetailResp{
			ID:                p.ID,
			AkunPesertaID:     p.AkunPesertaID,
			NamaLengkap:       p.NamaLengkap,
			Email:             p.Email,
			NomorHP:           p.NomorHP,
			KategoriPendaftar: p.KategoriPendaftar,
			NimNisn:           nimNisn,
			Institusi:         institusi,
			Fakultas:          p.Fakultas,
			Jurusan:           jurusan,
			KelasSemester:     kelasSem,
			PosisiBidang:      p.PosisiBidang,
			TanggalMulai:      p.TanggalMulai,
			TanggalSelesai:    p.TanggalSelesai,
			AlamatLengkap:     p.AlamatLengkap,
			JenisKelamin:      p.JenisKelamin,
			TempatLahir:       p.TempatLahir,
			TanggalLahir:      p.TanggalLahir,
			FileLaporanAkhir:  p.FileLaporanAkhir,
			JudulLaporanAkhir: p.JudulLaporanAkhir,
			LinkProyek:        p.LinkProyek,
			StatusAkun:        "aktif",
			StatusMagang:      "aktif",
			StatusPenilaian:   "belum_dinilai",
		}

		if p.AkunPeserta != nil {
			resp.StatusAkun = p.AkunPeserta.StatusAkun
			resp.StatusMagang = p.AkunPeserta.StatusMagang
			resp.FotoProfil = p.AkunPeserta.FotoProfil
			if resp.FotoProfil == "" {
				resp.FotoProfil = p.FilePasFoto
			}
			if p.AkunPeserta.Email != "" {
				resp.Email = p.AkunPeserta.Email
			}
			if p.AkunPeserta.NoHp != "" {
				resp.NomorHP = p.AkunPeserta.NoHp
			}

			// Hitung Presensi Stats
			var presensiList []models.Presensi
			config.DB.Where("peserta_id = ?", p.AkunPeserta.ID).Find(&presensiList)
			stats := PresensiStats{TotalHari: len(presensiList)}
			for _, pr := range presensiList {
				switch pr.Status {
				case "hadir":
					stats.TotalHadir++
				case "terlambat":
					stats.TotalTerlambat++
				case "izin":
					stats.TotalIzin++
				case "sakit":
					stats.TotalSakit++
				case "alfa":
					stats.TotalAlfa++
				}
			}
			resp.PresensiStats = stats
			if stats.TotalHari > 0 {
				totalMasuk := float64(stats.TotalHadir + stats.TotalTerlambat)
				resp.PersentaseKehadiran = (totalMasuk / float64(stats.TotalHari)) * 100
			}

			// Ambil Data Penilaian
			var pen models.PenilaianMagang
			if err := config.DB.Where("peserta_id = ?", p.AkunPeserta.ID).First(&pen).Error; err == nil {
				valAngka := pen.NilaiAkhirAngka
				valIndeks := pen.IndeksNilaiAkhir
				valPredikat := pen.PredikatAkhir
				valProf := pen.NilaiProfesional
				valPers := pen.NilaiPersonal
				valSos := pen.NilaiSosial
				valAdm := pen.NilaiAdministratif
				valCatatan := pen.CatatanMentor

				resp.NilaiAkhirAngka = &valAngka
				resp.IndeksNilaiAkhir = &valIndeks
				resp.PredikatAkhir = &valPredikat
				resp.NilaiProfesional = &valProf
				resp.NilaiPersonal = &valPers
				resp.NilaiSosial = &valSos
				resp.NilaiAdministratif = &valAdm
				resp.CatatanMentor = &valCatatan
				resp.StatusPenilaian = pen.StatusPenilaian
				if pen.TanggalPenilaian != nil {
					tglStr := pen.TanggalPenilaian.Format("2006-01-02 15:04")
					resp.TanggalPenilaian = &tglStr
				}
			}

			// Ambil Data Tugas Terakhir
			var latestTugas []models.TugasMagang
			if errT := config.DB.Where("(mentor_id = ? AND (peserta_id = ? OR peserta_id IS NULL))", mentorID, p.AkunPeserta.ID).
				Order("id DESC").
				Limit(1).
				Find(&latestTugas).Error; errT == nil && len(latestTugas) > 0 {
				t := latestTugas[0]
				deadlineStr := ""
				if t.TenggatWaktu != nil {
					deadlineStr = t.TenggatWaktu.Format("2006-01-02 15:04:05")
				}
				info := TugasTerakhirInfo{
					JudulTugas:   t.Judul,
					StatusTugas:  "belum_dikumpulkan",
					TenggatWaktu: deadlineStr,
				}
				var pengumpulan models.PengumpulanTugas
				if errP := config.DB.Where("tugas_id = ? AND peserta_id = ?", t.ID, p.AkunPeserta.ID).First(&pengumpulan).Error; errP == nil {
					info.StatusTugas = pengumpulan.Status
					info.NilaiTugas = pengumpulan.Nilai
				}
				resp.TugasTerakhir = &info
			}
		} else {
			resp.FotoProfil = p.FilePasFoto
		}

		result = append(result, resp)
	}

	utils.SuccessResponse(c, http.StatusOK, "Daftar peserta bimbingan berhasil dimuat", result)
}