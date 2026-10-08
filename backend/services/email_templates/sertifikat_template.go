package emailtemplates

import (
	"fmt"
)

// TemplateSertifikatTerbit menghasilkan isi email saat sertifikat kelulusan magang diterbitkan
func TemplateSertifikatTerbit(namaPeserta string, nomorSertifikat string, tanggalTerbit string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #059669; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Sertifikat Magang Telah Diterbitkan</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Selamat, <b>%s</b>!</p>

				<p>
					Sertifikat resmi kelulusan Program Praktik Kerja Lapangan / Magang Anda di Dinas Komunikasi dan Informatika Kabupaten Ponorogo telah selesai diproses dan resmi diterbitkan.
				</p>

				<div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0 0 6px 0; font-size: 13px; color: #065f46;">
						<b>Nomor Sertifikat:</b> <span style="font-family: monospace; font-size: 14px; font-weight: bold;">%s</span>
					</p>
					<p style="margin: 0; font-size: 13px; color: #065f46;">
						<b>Tanggal Terbit:</b> %s
					</p>
				</div>

				<p>
					Anda kini dapat mengunduh dokumen sertifikat resmi beserta transkrip evaluasi magang langsung melalui portal SIM Magang Diskominfo.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/penilaian/sertifikat" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Unduh Sertifikat Magang
					</a>
				</div>

				<p style="font-size: 13px; color: #64748b; margin-top: 24px;">
					Terima kasih atas dedikasi dan kontribusi positif Anda selama melaksanakan kegiatan magang bersama Dinas Komunikasi dan Informatika Kabupaten Ponorogo. Sukses selalu untuk perjalanan akademik dan karir Anda ke depan!
				</p>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, nomorSertifikat, tanggalTerbit)
}
