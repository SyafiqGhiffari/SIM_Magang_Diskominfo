package emailtemplates

import "fmt"

// TemplatePengingatPresensiMasuk menghasilkan email pengingat untuk presensi masuk pagi hari
func TemplatePengingatPresensiMasuk(namaPeserta string, tanggal string, jamMasuk string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pengingat Presensi Masuk Harian</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Hari ini adalah hari kerja (<b>%s</b>). Jam kerja operasional dimulai pukul <b>%s WIB</b>.
				</p>

				<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 13px; color: #166534;">
						<b>Ketentuan:</b> Pastikan Anda melakukan presensi masuk dengan swafoto dan GPS akurat sebelum batas toleransi keterlambatan berakhir.
					</p>
				</div>

				<p>
					Silakan buka aplikasi SIM Magang untuk melakukan presensi masuk sekarang.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/presensi" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Presensi Masuk Sekarang
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, tanggal, jamMasuk)
}

// TemplatePeringatanBelumPresensi menghasilkan email peringatan darurat bagi peserta yang belum presensi sampai sore/malam
func TemplatePeringatanBelumPresensi(namaPeserta string, tanggal string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #dc2626; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Peringatan: Belum Melakukan Presensi</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Sistem mendeteksi bahwa hingga saat ini Anda <b>belum melakukan presensi masuk</b> untuk tanggal <b>%s</b>.
				</p>

				<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 13px; color: #991b1b;">
						<b>Peringatan Kritis:</b> Jika Anda tidak melakukan presensi sebelum pergantian hari (pukul 23:59 WIB), sistem akan secara otomatis mencatat kehadiran Anda sebagai <b>ALPA (Tidak Hadir Tanpa Keterangan)</b>. Data alpa akan memengaruhi rapor evaluasi akhir magang.
					</p>
				</div>

				<p>
					Apabila Anda sedang berhalangan hadir (sakit atau memiliki urusan dinas/izin), segera ajukan surat izin melalui menu Pengajuan Izin di SIM Magang.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/presensi" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Buka Presensi SIM Magang
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, tanggal)
}

// TemplatePengingatPresensiPulang menghasilkan email pengingat untuk presensi pulang & logbook sore hari
func TemplatePengingatPresensiPulang(namaPeserta string, tanggal string, jamPulang string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #0284c7; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pengingat Presensi Pulang &amp; Logbook</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Jam kerja hari ini (<b>%s</b>) telah berakhir (pukul <b>%s WIB</b>).
				</p>

				<div style="background-color: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 13px; color: #0369a1;">
						<b>Catatan:</b> Jangan lupa melakukan presensi pulang dengan swafoto dan mencatat ringkasan capaian logbook harian kegiatan yang Anda selesaikan hari ini.
					</p>
				</div>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/presensi" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Presensi Pulang &amp; Isi Logbook
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, tanggal, jamPulang)
}

// TemplatePresensiAlfa menghasilkan email pemberitahuan saat sistem menutup hari dan peserta tercatat alpa
func TemplatePresensiAlfa(namaPeserta string, tanggal string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #991b1b; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pemberitahuan: Tercatat Alpa (Tidak Hadir)</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Hari kerja pada tanggal <b>%s</b> telah ditutup oleh sistem dan Anda tercatat <b>ALPA (Tidak Hadir)</b> karena tidak melakukan presensi hingga batas waktu yang ditentukan.
				</p>

				<div style="background-color: #fef2f2; border-left: 4px solid #991b1b; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 13px; color: #991b1b;">
						Status alpa telah terekam dalam rekapitulasi kehadiran magang Anda. Jika hal ini terjadi karena kendala jaringan atau alasan mendesak lainnya, segera komunikasikan dengan mentor pembimbing Anda.
					</p>
				</div>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/riwayat-aktivitas" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Lihat Riwayat Presensi
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, tanggal)
}

// TemplatePengingatPresensi fallback lama untuk kompatibilitas
func TemplatePengingatPresensi(namaPeserta string, tanggal string) string {
	return TemplatePengingatPresensiMasuk(namaPeserta, tanggal, "07:30")
}

// TemplatePresensiTidakLengkap fallback lama untuk kompatibilitas
func TemplatePresensiTidakLengkap(namaPeserta string, tanggal string) string {
	return TemplatePengingatPresensiPulang(namaPeserta, tanggal, "15:30")
}