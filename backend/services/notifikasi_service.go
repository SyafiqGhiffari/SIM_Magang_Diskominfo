package services

import (
	"fmt"
	"log"
	"time"

	"sim-magang-backend/models"

	"gorm.io/gorm"
)

// DB khusus service notifikasi, di-inject dari main.go supaya tidak ada
// ketergantungan melingkar antara package services dan config.
var notifDB *gorm.DB

func InitNotifikasi(db *gorm.DB) {
	notifDB = db
}

type NotifikasiInput struct {
	TargetRole   string // "admin" | "mentor" | "peserta"
	TargetUserID *uint  // nil = broadcast ke semua user dengan role tsb
	Tipe         string
	Prioritas    string // "tinggi" | "normal" | "rendah" (default: normal)
	Judul        string
	Pesan        string
	RefTabel     string
	RefID        *uint
	UrlTujuan    string

	// Gabungkan = true -> jika masih ada notifikasi BELUM DIBACA dengan
	// tipe + ref yang sama, baris lama diperbarui (bukan bikin baris baru).
	// Dipakai untuk chat & presensi agar bell tidak dibanjiri notifikasi.
	Gabungkan bool
}

// KirimNotifikasi menyimpan satu notifikasi in-app.
// Aman dipanggil di dalam goroutine: kegagalan hanya dicatat di log dan
// tidak pernah menggagalkan request utama.
func KirimNotifikasi(in NotifikasiInput) {
	if notifDB == nil {
		log.Println("Notifikasi dilewati: InitNotifikasi belum dipanggil")
		return
	}
	if in.Prioritas == "" {
		in.Prioritas = "normal"
	}
	if in.TargetRole == "" {
		in.TargetRole = "admin"
	}

	if in.Gabungkan {
		var lama models.Notifikasi
		q := notifDB.Where(
			"tipe = ? AND target_role = ? AND ref_tabel = ? AND dibaca_pada IS NULL",
			in.Tipe, in.TargetRole, in.RefTabel,
		)
		if in.RefID != nil {
			q = q.Where("ref_id = ?", *in.RefID)
		} else {
			q = q.Where("ref_id IS NULL")
		}
		// Limit(1).Find dipakai (bukan First) supaya kondisi "belum ada notifikasi
		// serupa" tidak dicatat GORM sebagai error 'record not found' di terminal.
		if err := q.Order("id DESC").Limit(1).Find(&lama).Error; err == nil && lama.ID != 0 {
			notifDB.Model(&lama).Updates(map[string]interface{}{
				"judul":      in.Judul,
				"pesan":      in.Pesan,
				"prioritas":  in.Prioritas,
				"url_tujuan": in.UrlTujuan,
				"created_at": time.Now(),
			})
			return
		}
	}

	notif := models.Notifikasi{
		TargetRole:   in.TargetRole,
		TargetUserID: in.TargetUserID,
		Tipe:         in.Tipe,
		Prioritas:    in.Prioritas,
		Judul:        in.Judul,
		Pesan:        in.Pesan,
		RefTabel:     in.RefTabel,
		RefID:        in.RefID,
		UrlTujuan:    in.UrlTujuan,
	}
	if err := notifDB.Create(&notif).Error; err != nil {
		log.Println("Gagal menyimpan notifikasi:", err)
	}
}

// Pintasan untuk notifikasi ke seluruh admin.
func KirimNotifikasiAdmin(tipe, judul, pesan, refTabel string, refID *uint, urlTujuan, prioritas string, gabungkan bool) {
	KirimNotifikasi(NotifikasiInput{
		TargetRole: "admin",
		Tipe:       tipe,
		Prioritas:  prioritas,
		Judul:      judul,
		Pesan:      pesan,
		RefTabel:   refTabel,
		RefID:      refID,
		UrlTujuan:  urlTujuan,
		Gabungkan:  gabungkan,
	})
}

// ─────────────────────────────────────────────────────────────────────────────
// PENGINGAT HARIAN (tanpa email) — dijalankan sekali sehari pukul 07.00
// ─────────────────────────────────────────────────────────────────────────────

func MulaiPengingatNotifikasiAdmin(db *gorm.DB) {
	notifDB = db

	// Sekali saat backend menyala (diberi jeda supaya migrasi & koneksi DB siap).
	// Tanpa ini, pekerjaan yang sudah menumpuk sebelum fitur notifikasi ada
	// tidak akan pernah muncul di lonceng sampai besok pukul 07.00.
	go func() {
		time.Sleep(15 * time.Second)
		JalankanPengingatAdmin()
	}()

	go func() {
		for {
			now := time.Now()
			next := time.Date(now.Year(), now.Month(), now.Day(), 7, 0, 0, 0, now.Location())
			if !next.After(now) {
				next = next.Add(24 * time.Hour)
			}
			time.Sleep(time.Until(next))
			JalankanPengingatAdmin()
		}
	}()
}

func JalankanPengingatAdmin() {
	if notifDB == nil {
		return
	}
	hariIni := time.Now().Format("2006-01-02")
	batas := time.Now().AddDate(0, 0, -3)

	// 1) Pendaftaran berstatus "menunggu" lebih dari 3 hari
	var tertunda int64
	notifDB.Model(&models.PendaftaranMagang{}).
		Where("status_pendaftaran = 'menunggu' AND created_at < ?", batas).
		Count(&tertunda)
	if tertunda > 0 {
		KirimNotifikasiAdmin(
			"pendaftaran_tertunda",
			"Pendaftaran menunggu verifikasi",
			fmt.Sprintf("%d pendaftaran sudah lebih dari 3 hari belum diverifikasi.", tertunda),
			"pendaftaran_magangs", nil, "/admin/pendaftaran", "tinggi", true,
		)
	}

	// 2) Sudah diterima tapi akun peserta belum dibuat
	var belumAkun int64
	notifDB.Model(&models.PendaftaranMagang{}).
		Where("status_pendaftaran = 'diterima' AND akun_peserta_id IS NULL").
		Count(&belumAkun)
	if belumAkun > 0 {
		KirimNotifikasiAdmin(
			"akun_belum_dibuat",
			"Akun peserta belum dibuat",
			fmt.Sprintf("%d pendaftar sudah diterima namun belum memiliki akun peserta.", belumAkun),
			"pendaftaran_magangs", nil, "/admin/peserta", "tinggi", true,
		)
	}

	// 3) Peserta aktif belum ditugaskan mentor
	var belumMentor int64
	notifDB.Model(&models.PendaftaranMagang{}).
		Where("akun_peserta_id IS NOT NULL AND mentor_id IS NULL AND tanggal_selesai >= ?", hariIni).
		Count(&belumMentor)
	if belumMentor > 0 {
		KirimNotifikasiAdmin(
			"mentor_belum_ditugaskan",
			"Peserta belum punya mentor",
			fmt.Sprintf("%d peserta aktif belum ditugaskan mentor pembimbing.", belumMentor),
			"pendaftaran_magangs", nil, "/admin/peserta", "tinggi", true,
		)
	}

	// 4) Masa magang sudah selesai tapi sertifikat belum diterbitkan
	var belumSertifikat int64
	notifDB.Model(&models.PendaftaranMagang{}).
		Where(`akun_peserta_id IS NOT NULL AND tanggal_selesai < ?
		       AND akun_peserta_id NOT IN (SELECT akun_peserta_id FROM sertifikats)`, hariIni).
		Count(&belumSertifikat)
	if belumSertifikat > 0 {
		KirimNotifikasiAdmin(
			"sertifikat_pending",
			"Sertifikat belum diterbitkan",
			fmt.Sprintf("%d peserta sudah menyelesaikan magang namun sertifikatnya belum dibuat.", belumSertifikat),
			"sertifikats", nil, "/admin/sertifikat", "normal", true,
		)
	}

	// 5) Sudah diterima tapi surat penerimaan belum diterbitkan.
	// Syaratnya dibuat sama persis dengan card peringatan di halaman Surat
	// Penerimaan supaya angka di lonceng dan di halaman tidak pernah berbeda.
	var suratBelumTerbit int64
	notifDB.Table("pendaftaran_magangs").
		Where("status_pendaftaran = ? AND surat_penerimaan_id IS NULL", "diterima").
		Count(&suratBelumTerbit)

	if suratBelumTerbit > 0 {
		KirimNotifikasiAdmin(
			"surat_belum_terbit",
			"Surat penerimaan belum diterbitkan",
			fmt.Sprintf("%d peserta sudah diterima tetapi surat penerimaannya belum dibuat.", suratBelumTerbit),
			"pendaftaran_magangs", nil,
			"/admin/surat-penerimaan",
			"tinggi", true,
		)
	} else {
		// Semua surat sudah terbit — bersihkan tagihan lama supaya lonceng tidak menipu.
		TandaiNotifikasiAdminSelesai("surat_belum_terbit", "pendaftaran_magangs", nil)
	}
}

// TandaiNotifikasiAdminSelesai menandai notifikasi admin bertipe tertentu sebagai
// sudah dibaca ketika pekerjaannya benar-benar selesai (misalnya surat sudah terbit).
// refID nil = notifikasi ringkasan (tanpa ref peserta tertentu).
func TandaiNotifikasiAdminSelesai(tipe, refTabel string, refID *uint) {
	if notifDB == nil {
		return
	}
	q := notifDB.Model(&models.Notifikasi{}).
		Where("tipe = ? AND target_role = ? AND dibaca_pada IS NULL", tipe, "admin")
	if refTabel != "" {
		q = q.Where("ref_tabel = ?", refTabel)
	}
	if refID != nil {
		q = q.Where("ref_id = ?", *refID)
	} else {
		q = q.Where("ref_id IS NULL")
	}
	if err := q.Update("dibaca_pada", time.Now()).Error; err != nil {
		log.Println("Gagal menandai notifikasi selesai:", err)
	}
}