package controllers

import (
	"net/http"
	"time"

	"sim-magang-backend/config"
	"sim-magang-backend/models"
	"sim-magang-backend/utils"

	"github.com/gin-gonic/gin"
)

// ── Struktur baris hasil query ──

type barisAngka struct {
	Label  string `json:"label"`
	Jumlah int    `json:"jumlah"`
}

type barisKuotaBidang struct {
	Nama   string `json:"nama"`
	Kuota  int    `json:"kuota"`
	Terisi int    `json:"terisi"`
}

type barisBebanMentor struct {
	ID         uint   `json:"id"`
	Nama       string `json:"nama"`
	Bidang     string `json:"bidang"`
	FotoProfil string `json:"foto_profil"`
	Kapasitas  int    `json:"kapasitas"`
	Bimbingan  int    `json:"bimbingan"`
}

type barisPesertaBermasalah struct {
	PesertaID  uint   `json:"peserta_id"`
	Nama       string `json:"nama"`
	Bidang     string `json:"bidang"`
	FotoProfil string `json:"foto_profil"`
	Hadir      int    `json:"hadir"`
	Total      int    `json:"total"`
	Persen     int    `json:"persen"`
}

type barisAkanSelesai struct {
	PesertaID      uint   `json:"peserta_id"`
	Nama           string `json:"nama"`
	Bidang         string `json:"bidang"`
	TanggalSelesai string `json:"tanggal_selesai"`
	SisaHari       int    `json:"sisa_hari"`
}

type barisTrenBulan struct {
	Bulan  string `json:"bulan"`
	Status string `json:"status"`
	Jumlah int    `json:"jumlah"`
}

var namaBulanSingkat = []string{
	"Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
	"Jul", "Agu", "Sep", "Okt", "Nov", "Des",
}

// GetRingkasanDashboardAdmin mengembalikan seluruh angka ringkasan dashboard
// admin dalam SATU response, sehingga frontend tidak perlu menarik seluruh
// tabel pendaftaran dan akun lalu menghitungnya sendiri di browser.
//
// Empat kelompok data:
//  1. antrean       — pekerjaan yang menunggu tindakan admin
//  2. presensi      — kondisi kehadiran peserta hari ini
//  3. program       — kuota bidang, beban mentor, peserta yang akan selesai
//  4. tren          — pendaftaran 6 bulan & rekap kehadiran 30 hari
func GetRingkasanDashboardAdmin(c *gin.Context) {
	db := config.DB
	if db == nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Koneksi basis data belum siap")
		return
	}

	sekarang := utils.SekarangWIB()
	hariIni := utils.TanggalHariIni()
	batasTertunda := sekarang.AddDate(0, 0, -3)

	// Rentang grafik tren pendaftaran — hanya nilai yang diizinkan yang diterima,
	// supaya query tidak bisa dipaksa memindai puluhan tahun ke belakang.
	jumlahBulan := 6
	switch c.Query("bulan") {
	case "3":
		jumlahBulan = 3
	case "12":
		jumlahBulan = 12
	}

	// ─────────────────────────────────────────────────────────────
	// LAPIS 1 — Antrean pekerjaan
	// ─────────────────────────────────────────────────────────────
	hitungPendaftaran := func(kondisi string, args ...interface{}) int {
		var n int64
		db.Model(&models.PendaftaranMagang{}).Where(kondisi, args...).Count(&n)
		return int(n)
	}

	menungguVerifikasi := hitungPendaftaran("status_pendaftaran = ?", "menunggu")
	menungguLebih3Hari := hitungPendaftaran("status_pendaftaran = ? AND created_at < ?", "menunggu", batasTertunda)
	perluRevisi := hitungPendaftaran("status_pendaftaran = ?", "revisi")
	suratBelumTerbit := hitungPendaftaran("status_pendaftaran = ? AND surat_penerimaan_id IS NULL", "diterima")
	akunBelumDibuat := hitungPendaftaran("status_pendaftaran = ? AND akun_peserta_id IS NULL", "diterima")
	belumPunyaMentor := hitungPendaftaran(
		"akun_peserta_id IS NOT NULL AND mentor_id IS NULL AND tanggal_selesai >= ?", hariIni)
	sertifikatTertunda := hitungPendaftaran(
		"akun_peserta_id IS NOT NULL AND tanggal_selesai < ? "+
			"AND akun_peserta_id NOT IN (SELECT akun_peserta_id FROM sertifikats)", hariIni)

	var chatBelumDibalas int64
	db.Table("chat_sessions").
		Where("status = ? AND unread_admin_count > 0", "open").
		Count(&chatBelumDibalas)

	var pertanyaanBaru int64
	db.Table("faq_pertanyaan").Where("status = ?", "baru").Count(&pertanyaanBaru)

	totalTindakan := menungguVerifikasi + suratBelumTerbit + akunBelumDibuat +
		belumPunyaMentor + sertifikatTertunda + int(chatBelumDibalas) + int(pertanyaanBaru)

	// ─────────────────────────────────────────────────────────────
	// LAPIS 2 — Presensi hari ini
	// ─────────────────────────────────────────────────────────────
	hariKerja := false
	alasanHari := ""
	if kal, err := utils.MuatKalenderKerja(db); err == nil {
		info := kal.CekHari(hariIni)
		hariKerja = info.HariKerja
		alasanHari = info.Alasan
	}

	pesertaWajib, _ := utils.AmbilPesertaPresensi(db)
	wajibHariIni := 0
	if hariKerja {
		for _, p := range pesertaWajib {
			if p.WajibPresensiPada(hariIni) {
				wajibHariIni++
			}
		}
	}

	var barisHariIni []barisAngka
	db.Table("presensis").
		Select("status AS label, COUNT(*) AS jumlah").
		Where("tanggal = ?", hariIni).
		Group("status").
		Scan(&barisHariIni)

	presensi := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	sudahPresensi := 0
	for _, b := range barisHariIni {
		presensi[b.Label] = b.Jumlah
		sudahPresensi += b.Jumlah
	}
	belumPresensi := wajibHariIni - sudahPresensi
	if belumPresensi < 0 {
		belumPresensi = 0
	}

	// ─────────────────────────────────────────────────────────────
	// LAPIS 3 — Kesehatan program
	// ─────────────────────────────────────────────────────────────
	var kuotaBidang []barisKuotaBidang
	db.Raw(`
		SELECT b.nama                 AS nama,
		       b.kuota                AS kuota,
		       COALESCE(t.terisi, 0)  AS terisi
		FROM bidang_magangs b
		LEFT JOIN (
			SELECT posisi_bidang, COUNT(*) AS terisi
			FROM pendaftaran_magangs
			WHERE status_pendaftaran = 'diterima' AND tanggal_selesai >= ?
			GROUP BY posisi_bidang
		) t ON t.posisi_bidang = b.nama
		WHERE b.is_active = 1
		ORDER BY b.nama ASC
	`, hariIni).Scan(&kuotaBidang)

	var bebanMentor []barisBebanMentor
	db.Raw(`
		SELECT u.id                        AS id,
		       u.nama                      AS nama,
		       COALESCE(b.nama, '')        AS bidang,
		       COALESCE(u.foto_profil, '') AS foto_profil,
		       u.kapasitas_bimbingan       AS kapasitas,
		       COALESCE(m.jumlah, 0)       AS bimbingan
		FROM user_manajemens u
		LEFT JOIN bidang_magangs b ON b.id = u.bidang_id
		LEFT JOIN (
			SELECT mentor_id, COUNT(*) AS jumlah
			FROM pendaftaran_magangs
			WHERE mentor_id IS NOT NULL AND tanggal_selesai >= ?
			GROUP BY mentor_id
		) m ON m.mentor_id = u.id
		WHERE u.role = 'mentor' AND u.status_akun = 'aktif'
		ORDER BY bimbingan DESC, u.nama ASC
	`, hariIni).Scan(&bebanMentor)

	batas30Hari := sekarang.AddDate(0, 0, 30).Format("2006-01-02")
	var akanSelesai []barisAkanSelesai
	db.Raw(`
		SELECT p.akun_peserta_id                          AS peserta_id,
		       p.nama_lengkap                             AS nama,
		       p.posisi_bidang                            AS bidang,
		       DATE_FORMAT(p.tanggal_selesai, '%Y-%m-%d') AS tanggal_selesai,
		       DATEDIFF(p.tanggal_selesai, ?)             AS sisa_hari
		FROM pendaftaran_magangs p
		WHERE p.akun_peserta_id IS NOT NULL
		  AND p.tanggal_selesai >= ?
		  AND p.tanggal_selesai <= ?
		ORDER BY p.tanggal_selesai ASC
		LIMIT 8
	`, hariIni, hariIni, batas30Hari).Scan(&akanSelesai)

	// Peserta dengan kehadiran rendah dalam 30 hari terakhir.
	// Ambang 75% disamakan dengan halaman Rekap & Laporan agar tidak
	// membingungkan. "Hadir" mencakup terlambat, karena yang bersangkutan
	// tetap masuk — keterlambatan dinilai terpisah.
	awal30Presensi := sekarang.AddDate(0, 0, -29).Format("2006-01-02")
	var pesertaBermasalah []barisPesertaBermasalah
	db.Raw(`
		SELECT u.id                        AS peserta_id,
		       u.nama                      AS nama,
		       COALESCE(p.posisi_bidang, '') AS bidang,
		       COALESCE(NULLIF(u.foto_profil, ''), p.file_pas_foto, '') AS foto_profil,
		       SUM(pr.status IN ('hadir','terlambat')) AS hadir,
		       COUNT(pr.id)                            AS total,
		       ROUND(SUM(pr.status IN ('hadir','terlambat')) * 100 / COUNT(pr.id)) AS persen
		FROM user_manajemens u
		JOIN presensis pr ON pr.peserta_id = u.id
		LEFT JOIN pendaftaran_magangs p ON p.akun_peserta_id = u.id
		WHERE u.role = 'peserta'
		  AND u.status_akun = 'aktif'
		  AND u.status_magang = 'aktif'
		  AND pr.tanggal >= ? AND pr.tanggal <= ?
		GROUP BY u.id, u.nama, p.posisi_bidang, u.foto_profil, p.file_pas_foto
		HAVING COUNT(pr.id) > 0
		   AND SUM(pr.status IN ('hadir','terlambat')) * 100 / COUNT(pr.id) < 75
		ORDER BY persen ASC
		LIMIT 6
	`, awal30Presensi, hariIni).Scan(&pesertaBermasalah)

	var pesertaAktif, pesertaAlumni, jumlahMentor int64
	db.Model(&models.UserManajemen{}).
		Where("role = ? AND status_magang = ?", "peserta", "aktif").Count(&pesertaAktif)
	db.Model(&models.UserManajemen{}).
		Where("role = ? AND status_magang = ?", "peserta", "selesai").Count(&pesertaAlumni)
	db.Model(&models.UserManajemen{}).
		Where("role = ? AND status_akun = ?", "mentor", "aktif").Count(&jumlahMentor)

	// ─────────────────────────────────────────────────────────────
	// LAPIS 4 — Tren
	// ─────────────────────────────────────────────────────────────
	awalTren := time.Date(sekarang.Year(), sekarang.Month(), 1, 0, 0, 0, 0, utils.WIB()).
		AddDate(0, -(jumlahBulan - 1), 0)

	// Dikelompokkan per bulan DAN per status sekaligus. Pengelompokan memakai
	// created_at, sehingga satu batang berarti "dari sekian formulir yang masuk
	// bulan ini, sekian diterima dan sekian ditolak" — bukan kapan admin
	// memprosesnya. Dengan begitu totalnya selalu konsisten.
	var trenMentah []barisTrenBulan
	db.Raw(`
		SELECT DATE_FORMAT(created_at, '%Y-%m') AS bulan,
		       status_pendaftaran               AS status,
		       COUNT(*)                         AS jumlah
		FROM pendaftaran_magangs
		WHERE created_at >= ?
		GROUP BY bulan, status
		ORDER BY bulan ASC
	`, awalTren).Scan(&trenMentah)

	// petaTren["2026-08"]["diterima"] = 3
	petaTren := make(map[string]map[string]int)
	for _, b := range trenMentah {
		if petaTren[b.Bulan] == nil {
			petaTren[b.Bulan] = make(map[string]int, 4)
		}
		petaTren[b.Bulan][b.Status] = b.Jumlah
	}

	// Bulan tanpa pendaftaran tetap ditampilkan sebagai 0 agar grafiknya utuh.
	trenPendaftaran := make([]gin.H, 0, jumlahBulan)
	totalDiterima, totalDitolak, totalDiproses := 0, 0, 0

	for i := 0; i < jumlahBulan; i++ {
		t := awalTren.AddDate(0, i, 0)
		s := petaTren[t.Format("2006-01")]

		diterima := s["diterima"]
		ditolak := s["ditolak"]
		diproses := s["menunggu"] + s["revisi"]

		totalDiterima += diterima
		totalDitolak += ditolak
		totalDiproses += diproses

		trenPendaftaran = append(trenPendaftaran, gin.H{
			"bulan":    namaBulanSingkat[int(t.Month())-1] + " " + t.Format("06"),
			"jumlah":   diterima + ditolak + diproses,
			"diterima": diterima,
			"ditolak":  ditolak,
			"diproses": diproses,
		})
	}

	// Tingkat penerimaan dihitung hanya dari pendaftaran yang SUDAH diputuskan,
	// supaya berkas yang masih diverifikasi tidak menekan angkanya ke bawah.
	totalDiputuskan := totalDiterima + totalDitolak
	persenDiterima := 0
	if totalDiputuskan > 0 {
		persenDiterima = totalDiterima * 100 / totalDiputuskan
	}

	awal30Hari := sekarang.AddDate(0, 0, -29).Format("2006-01-02")
	var baris30Hari []barisAngka
	db.Table("presensis").
		Select("status AS label, COUNT(*) AS jumlah").
		Where("tanggal >= ? AND tanggal <= ?", awal30Hari, hariIni).
		Group("status").
		Scan(&baris30Hari)

	rekap30 := map[string]int{"hadir": 0, "terlambat": 0, "izin": 0, "sakit": 0, "alfa": 0}
	total30 := 0
	for _, b := range baris30Hari {
		rekap30[b.Label] = b.Jumlah
		total30 += b.Jumlah
	}
	persenKehadiran := 0
	if total30 > 0 {
		persenKehadiran = (rekap30["hadir"] + rekap30["terlambat"]) * 100 / total30
	}

	// ─────────────────────────────────────────────────────────────
	utils.SuccessResponse(c, http.StatusOK, "Ringkasan dashboard berhasil diambil", gin.H{
		"tanggal": hariIni,

		"antrean": gin.H{
			"total":                 totalTindakan,
			"menunggu_verifikasi":   menungguVerifikasi,
			"menunggu_lebih_3_hari": menungguLebih3Hari,
			"perlu_revisi":          perluRevisi,
			"surat_belum_terbit":    suratBelumTerbit,
			"akun_belum_dibuat":     akunBelumDibuat,
			"belum_punya_mentor":    belumPunyaMentor,
			"sertifikat_tertunda":   sertifikatTertunda,
			"chat_belum_dibalas":    int(chatBelumDibalas),
			"pertanyaan_baru":       int(pertanyaanBaru),
		},

		"presensi": gin.H{
			"hari_kerja":     hariKerja,
			"alasan":         alasanHari,
			"wajib_presensi": wajibHariIni,
			"sudah_presensi": sudahPresensi,
			"belum_presensi": belumPresensi,
			"hadir":          presensi["hadir"],
			"terlambat":      presensi["terlambat"],
			"izin":           presensi["izin"],
			"sakit":          presensi["sakit"],
			"alfa":           presensi["alfa"],
		},

		"program": gin.H{
			"peserta_aktif":  int(pesertaAktif),
			"peserta_alumni": int(pesertaAlumni),
			"jumlah_mentor":  int(jumlahMentor),
			"kuota_bidang":   kuotaBidang,
			"beban_mentor":       bebanMentor,
			"peserta_bermasalah": pesertaBermasalah,
			"akan_selesai":       akanSelesai,
		},

		"tren": gin.H{
			"jumlah_bulan":     jumlahBulan,
			"pendaftaran":      trenPendaftaran,
			"total_diterima":   totalDiterima,
			"total_ditolak":    totalDitolak,
			"total_diproses":   totalDiproses,
			"persen_diterima":  persenDiterima,
			"persen_kehadiran": persenKehadiran,
			"total_presensi":   total30,
			"rekap_30_hari":    rekap30,
		},
	})
}