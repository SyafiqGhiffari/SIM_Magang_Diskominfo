package emailtemplates

import (
	"fmt"
)

// TemplatePenugasanMentorBaru menghasilkan email resmi ke mentor saat ditugaskan peserta magang baru
func TemplatePenugasanMentorBaru(namaMentor, namaPeserta, institusi, jurusan, posisiBidang, tglMulai, tglSelesai string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Penugasan Peserta Bimbingan Baru</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo <b>%s</b>,</p>

				<p>
					Admin SIM Magang telah menetapkan Anda sebagai <b>Mentor Pembimbing</b> untuk peserta magang baru berikut:
				</p>

				<div style="background-color: #f8fafc; border-left: 4px solid #004F9F; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<table style="width: 100%%; font-size: 13px; border-collapse: collapse;">
						<tr>
							<td style="padding: 5px 0; color: #64748b; width: 140px;"><b>Nama Peserta:</b></td>
							<td style="padding: 5px 0; font-weight: bold; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Asal Institusi:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Jurusan / Prodi:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Posisi Bidang:</b></td>
							<td style="padding: 5px 0; font-weight: bold; color: #0284c7;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Periode Magang:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s s.d. %s</td>
						</tr>
					</table>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Anda dapat mulai memantau kehadiran harian, membagikan materi pembelajaran, memberikan penugasan proyek, serta melakukan koordinasi bimbingan melalui portal manajemen magang.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/mentor/presensi" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Buka Dashboard Bimbingan
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaMentor, namaPeserta, institusi, jurusan, posisiBidang, tglMulai, tglSelesai)
}
