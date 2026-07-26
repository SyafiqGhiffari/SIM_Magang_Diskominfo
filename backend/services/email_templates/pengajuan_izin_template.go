package emailtemplates

import (
	"fmt"
	"strings"
)

// kerangkaPresensi adalah wadah HTML bersama untuk semua email presensi & izin.
func kerangkaPresensi(judul, isi string) string {
	return fmt.Sprintf(`
	<table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
		<tr>
			<td align="center" style="padding:24px 16px;">
				<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,20,66,0.08);">

					<tr>
						<td bgcolor="#0B1442" style="background-color:#0B1442;background-image:linear-gradient(135deg,#0B1442,#1E3A8A,#00A5EC);padding:26px 28px;">
							<h2 style="margin:0;color:#ffffff;font-size:17px;font-weight:800;">%s</h2>
							<p style="margin:6px 0 0;color:rgba(255,255,255,0.65);font-size:12px;">SIM Magang Diskominfo</p>
						</td>
					</tr>

					<tr>
						<td style="padding:26px 28px;color:#334155;font-size:13px;line-height:1.7;">%s</td>
					</tr>

					<tr>
						<td bgcolor="#f8fafc" style="background-color:#f8fafc;padding:16px 28px;color:#94a3b8;font-size:11px;">
							Email ini dikirim otomatis oleh sistem, mohon tidak membalas email ini.
						</td>
					</tr>

				</table>
			</td>
		</tr>
	</table>`, judul, isi)
}

// ── Email ke MENTOR: ada pengajuan izin/sakit baru ────────────────────────────

func SubjectPengajuanIzinBaru(jenis, namaPeserta string) string {
	return "Pengajuan " + strings.Title(jenis) + " Baru dari " + namaPeserta
}

func TemplatePengajuanIzinBaru(namaMentor, namaPeserta, jenis, tanggalMulai, tanggalSelesai, alasan string) string {
	isi := fmt.Sprintf(`
		<p>Halo <b>%s</b>,</p>
		<p>Peserta bimbingan Anda mengajukan <b style="text-transform:capitalize;">%s</b> dan menunggu verifikasi:</p>

		<table width="100%%" cellpadding="0" cellspacing="0" style="font-size:13px;margin-top:8px;">
			<tr><td style="padding:6px 0;color:#64748b;width:120px;">Peserta</td><td style="padding:6px 0;font-weight:700;">%s</td></tr>
			<tr><td style="padding:6px 0;color:#64748b;">Jenis</td><td style="padding:6px 0;font-weight:700;text-transform:capitalize;">%s</td></tr>
			<tr><td style="padding:6px 0;color:#64748b;">Tanggal</td><td style="padding:6px 0;font-weight:700;">%s s.d. %s</td></tr>
			<tr><td style="padding:6px 0;color:#64748b;vertical-align:top;">Alasan</td><td style="padding:6px 0;">%s</td></tr>
		</table>

		<p style="margin-top:18px;">
			Silakan buka menu <b>Verifikasi Izin</b> pada dashboard mentor untuk menyetujui atau menolak pengajuan ini.
		</p>`,
		namaMentor, jenis, namaPeserta, jenis, tanggalMulai, tanggalSelesai, alasan)

	return kerangkaPresensi("Pengajuan Izin Baru", isi)
}

// ── Email ke PESERTA: hasil verifikasi pengajuan ──────────────────────────────

func SubjectHasilPengajuanIzin(jenis, status string) string {
	return "Pengajuan " + strings.Title(jenis) + " Anda " + strings.Title(status)
}

func TemplateHasilPengajuanIzin(namaPeserta, jenis, tanggalMulai, tanggalSelesai, status, catatanMentor string) string {
	warna := "#059669"
	label := "DISETUJUI"
	if status == "ditolak" {
		warna = "#e11d48"
		label = "DITOLAK"
	}

	if strings.TrimSpace(catatanMentor) == "" {
		catatanMentor = "-"
	}

	penutup := fmt.Sprintf(
		`Presensi Anda pada setiap hari kerja dalam rentang tanggal tersebut otomatis tercatat sebagai <b style="text-transform:capitalize;">%s</b>.`,
		jenis)
	if status == "ditolak" {
		penutup = "Karena pengajuan ditolak, Anda tetap wajib melakukan presensi pada tanggal tersebut agar tidak tercatat alfa."
	}

	isi := fmt.Sprintf(`
		<p>Halo <b>%s</b>,</p>
		<p>Pengajuan <b style="text-transform:capitalize;">%s</b> Anda untuk tanggal <b>%s s.d. %s</b> telah diproses oleh mentor:</p>

		<p style="margin:16px 0;">
			<span style="display:inline-block;background-color:%s;color:#ffffff;padding:9px 18px;border-radius:999px;font-size:12px;font-weight:800;letter-spacing:0.5px;">%s</span>
		</p>

		<p style="margin:0 0 6px;color:#64748b;">Catatan mentor:</p>
		<table width="100%%" cellpadding="0" cellspacing="0">
			<tr><td bgcolor="#f8fafc" style="background-color:#f8fafc;border-radius:12px;padding:12px 14px;">%s</td></tr>
		</table>

		<p style="margin-top:18px;">%s</p>`,
		namaPeserta, jenis, tanggalMulai, tanggalSelesai, warna, label, catatanMentor, penutup)

	return kerangkaPresensi("Hasil Verifikasi Pengajuan", isi)
}