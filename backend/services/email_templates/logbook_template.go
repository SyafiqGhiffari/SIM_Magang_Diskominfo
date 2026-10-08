package emailtemplates

import "fmt"

func TemplateLogbookDikonfirmasi(namaPeserta string, tanggal string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Logbook Harian Dikonfirmasi</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>
			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>
				<p>Logbook harian Anda pada tanggal <b>%s</b> telah dikonfirmasi oleh mentor.</p>
				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/presensi" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Lihat Detail Logbook
					</a>
				</div>
			</div>
			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, tanggal)
}

// TemplatePengingatLogbook menghasilkan email pengingat pengisian catatan kegiatan harian
func TemplatePengingatLogbook(namaPeserta string, tanggal string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #0284c7; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pengingat Pengisian Logbook Harian</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Sistem mencatat Anda telah melakukan presensi pada hari ini (<b>%s</b>), namun catatan aktivitas atau deskripsi <b>Logbook Harian</b> Anda masih kosong.
				</p>

				<div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 13px; color: #0369a1;">
						<b>Penting:</b> Kelengkapan pengisian logbook harian dihitung secara otomatis oleh sistem sebagai salah satu pilar nilai administratif kelulusan magang.
					</p>
				</div>

				<p>
					Segera isi ringkasan pekerjaan atau pembelajaran yang Anda selesaikan hari ini sebelum hari berganti.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/presensi" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Isi Logbook Hari Ini
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, tanggal)
}