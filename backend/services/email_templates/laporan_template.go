package emailtemplates

import (
	"fmt"
)

// TemplatePengingatLaporanMentor menghasilkan isi email saat mentor menekan tombol Ingatkan
func TemplatePengingatLaporanMentor(namaPeserta string, namaMentor string) string {
	if namaMentor == "" {
		namaMentor = "Mentor Pembimbing"
	}

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pengingat Laporan Akhir Magang</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Mentor pembimbing Anda, <b>%s</b>, mengingatkan agar Anda segera menyusun dan mengunggah naskah <b>Laporan Akhir</b> serta tautan <b>Luaran Proyek Magang</b> ke dalam sistem SIM Magang Diskominfo.
				</p>

				<div style="background-color: #f8fafc; border-left: 4px solid #004F9F; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 13px; color: #475569;">
						<b>Catatan Penting:</b> Naskah Laporan Akhir yang telah disetujui oleh mentor merupakan syarat kelulusan magang dan akan otomatis mengaktifkan poin penuh (100) pada komponen kelengkapan laporan akhir di rapor Anda.
					</p>
				</div>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/penilaian/laporan" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Unggah Laporan Akhir Sekarang
					</a>
				</div>

				<p style="font-size: 13px; color: #64748b; margin-top: 24px;">
					Jika Anda sudah menyusun laporan, silakan masuk ke portal manajemen magang pada menu <b>Penilaian &gt; Laporan Akhir</b>.
				</p>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, namaMentor)
}

// TemplatePengingatLaporanOtomatis menghasilkan email pengingat otomatis berkala (H-14, H-7, H-3)
func TemplatePengingatLaporanOtomatis(namaPeserta string, sisaHari int, tanggalSelesai string) string {
	pesanSisa := fmt.Sprintf("Masa magang Anda tersisa <b>%d hari lagi</b> (berakhir pada %s).", sisaHari, tanggalSelesai)
	if sisaHari <= 0 {
		pesanSisa = "Masa magang Anda telah berakhir."
	}

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pengingat Batas Pengumpulan Laporan Akhir</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					%s Sistem mencatat bahwa Anda belum mengunggah naskah <b>Laporan Akhir Magang</b> dan tautan luaran proyek ke dalam SIM Magang Diskominfo.
				</p>

				<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 13px; color: #92400e;">
						<b>Peringatan:</b> Segera selesaikan dan unggah naskah laporan Anda sebelum periode magang ditutup agar mentor pembimbing memiliki waktu yang cukup untuk memeriksa dan memvalidasi berkas Anda sebelum penerbitan nilai akhir.
					</p>
				</div>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/penilaian/laporan" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Unggah Naskah Laporan
					</a>
				</div>

				<p style="font-size: 13px; color: #64748b;">
					Harap abaikan email ini apabila Anda telah mengunggah naskah laporan dan sedang menunggu proses verifikasi mentor.
				</p>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, pesanSisa)
}

// TemplateLaporanAkhirMasukMentor menghasilkan email ke mentor saat peserta bimbingan mengunggah laporan akhir
func TemplateLaporanAkhirMasukMentor(namaMentor, namaPeserta, judulLaporan, linkProyek, catatan string) string {
	if judulLaporan == "" {
		judulLaporan = "Laporan Akhir Magang"
	}
	if linkProyek == "" {
		linkProyek = "-"
	}
	if catatan == "" {
		catatan = "-"
	}

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Laporan Akhir Magang Diserahkan</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo <b>%s</b>,</p>

				<p>
					Peserta bimbingan Anda, <b>%s</b>, telah selesai menyusun dan mengunggah naskah <b>Laporan Akhir Magang</b> beserta luaran proyek ke dalam sistem SIM Magang.
				</p>

				<div style="background-color: #f8fafc; border-left: 4px solid #004F9F; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<table style="width: 100%%; font-size: 13px; border-collapse: collapse;">
						<tr>
							<td style="padding: 5px 0; color: #64748b; width: 140px;"><b>Nama Peserta:</b></td>
							<td style="padding: 5px 0; font-weight: bold; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Judul Laporan:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Tautan Luaran:</b></td>
							<td style="padding: 5px 0; color: #0284c7; word-break: break-all;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b; vertical-align: top;"><b>Catatan Peserta:</b></td>
							<td style="padding: 5px 0; color: #475569;">%s</td>
						</tr>
					</table>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Silakan masuk ke menu Laporan Akhir pada dashboard mentor untuk memeriksa naskah laporan, memberikan persetujuan (ACC), atau meminta revisi.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/mentor/laporan-akhir" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Tinjau Laporan Akhir Sekarang
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaMentor, namaPeserta, namaPeserta, judulLaporan, linkProyek, catatan)
}

// TemplateLaporanAkhirDisetujui menghasilkan email pemberitahuan ke peserta saat laporan disahkan oleh mentor
func TemplateLaporanAkhirDisetujui(namaPeserta, namaMentor, catatan string) string {
	if catatan == "" {
		catatan = "Laporan akhir telah memenuhi seluruh kriteria dan standar magang Diskominfo."
	}

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #059669; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Laporan Akhir Magang Disahkan</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Selamat, <b>%s</b>!</p>

				<p>
					Naskah <b>Laporan Akhir Magang</b> dan luaran proyek Anda telah diverifikasi dan <b>DISETUJUI (ACC)</b> oleh mentor pembimbing Anda (<b>%s</b>).
				</p>

				<div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<p style="margin: 0 0 6px 0; font-size: 13px; color: #065f46; font-weight: bold;">Catatan Mentor:</p>
					<p style="margin: 0; font-size: 13px; color: #334155;">%s</p>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Kelengkapan laporan akhir telah mengaktifkan poin penuh pada nilai administratif Anda. Silakan pantau transkrip rapor nilai akhir dan penerbitan sertifikat magang Anda.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/penilaian/laporan" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Lihat Status Laporan Akhir
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, namaMentor, catatan)
}

// TemplateLaporanAkhirRevisi menghasilkan email pemberitahuan ke peserta saat laporan perlu direvisi
func TemplateLaporanAkhirRevisi(namaPeserta, namaMentor, catatan string) string {
	if catatan == "" {
		catatan = "Silakan periksa naskah laporan Anda dan lakukan perbaikan sesuai arahan mentor."
	}

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #d97706; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Permintaan Revisi Laporan Akhir</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Mentor pembimbing Anda (<b>%s</b>) telah meninjau naskah Laporan Akhir Magang Anda dan meminta beberapa <b>perbaikan / revisi</b>:
				</p>

				<div style="background-color: #fffbeb; border-left: 4px solid #d97706; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<p style="margin: 0 0 6px 0; font-size: 13px; color: #92400e; font-weight: bold;">Catatan Revisi Mentor:</p>
					<p style="margin: 0; font-size: 13px; color: #334155;">%s</p>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Segera perbaiki naskah laporan Anda dan unggah kembali berkas PDF perbaikan melalui portal SIM Magang agar dapat disahkan kembali oleh mentor.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/penilaian/laporan" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Unggah Revisi Laporan
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, namaMentor, catatan)
}

