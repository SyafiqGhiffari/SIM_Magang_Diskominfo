package emailtemplates

import "fmt"

// TemplateNilaiAkhirDiterbitkan menghasilkan isi email saat nilai akhir 4 pilar kompetensi magang difinalisasi oleh mentor
func TemplateNilaiAkhirDiterbitkan(namaPeserta string, nilaiAkhir string, predikat string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Rapor Nilai Akhir Diterbitkan</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Evaluasi nilai akhir magang Anda berdasarkan penilaian 4 pilar kompetensi (Profesional, Personal, Sosial, dan Administratif) telah resmi difinalisasi dan diterbitkan oleh mentor pembimbing.
				</p>

				<div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<table style="width: 100%%; font-size: 14px; border-collapse: collapse;">
						<tr>
							<td style="padding: 4px 0; color: #475569; width: 140px;"><b>Nilai Kumulatif:</b></td>
							<td style="padding: 4px 0; font-size: 18px; font-weight: bold; color: #16a34a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 4px 0; color: #475569;"><b>Predikat Kelulusan:</b></td>
							<td style="padding: 4px 0; font-size: 15px; font-weight: bold; color: #0f172a;">%s</td>
						</tr>
					</table>
				</div>

				<p>
					Rincian evaluasi tiap indikator pilar kompetensi beserta transkrip nilai digital kini dapat diakses dan diunduh langsung di akun SIM Magang Anda.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/penilaian/rapor" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Buka Lembar Rapor Nilai
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, nilaiAkhir, predikat)
}

// TemplatePesertaSiapSertifikatAdmin menghasilkan email ke admin saat peserta telah tervalidasi siap diterbitkan sertifikat
func TemplatePesertaSiapSertifikatAdmin(namaPeserta, instansi, bidang, nilaiAkhir, predikat string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #059669; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Peserta Siap Diterbitkan Sertifikat</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo <b>Admin SIM Magang</b>,</p>

				<p>
					Peserta magang berikut telah menyelesaikan seluruh rangkaian evaluasi magang, nilai akhir 4 pilar kompetensi telah difinalisasi, dan laporan akhir telah disetujui (ACC) oleh mentor:
				</p>

				<div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 16px; margin: 18px 0; border-radius: 6px;">
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
							<td style="padding: 5px 0; color: #64748b;"><b>Posisi Bidang:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Nilai Akhir:</b></td>
							<td style="padding: 5px 0; font-size: 15px; font-weight: bold; color: #059669;">%s (%s)</td>
						</tr>
					</table>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Peserta telah memenuhi seluruh persyaratan kelulusan magang. Silakan masukkan nomor sertifikat resmi pada menu Kelola Sertifikat untuk menerbitkan dokumen kelulusan peserta.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/admin/sertifikat" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Terbitkan Sertifikat Magang
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, instansi, bidang, nilaiAkhir, predikat)
}

// TemplatePengingatNilaiAkhirMentor menghasilkan email pengingat ke mentor untuk mengisi evaluasi akhir peserta bimbingan
func TemplatePengingatNilaiAkhirMentor(namaMentor, namaPeserta string, sisaHari int, tanggalSelesai string) string {
	pesanWaktu := fmt.Sprintf("Masa magang peserta tersisa <b>%d hari lagi</b> (berakhir pada %s).", sisaHari, tanggalSelesai)
	if sisaHari <= 0 {
		pesanWaktu = fmt.Sprintf("Masa magang peserta telah berakhir pada <b>%s</b>.", tanggalSelesai)
	}

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #ea580c; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pengingat Evaluasi Nilai Akhir Peserta</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo <b>%s</b>,</p>

				<p>
					Ini adalah pengingat bahwa peserta bimbingan Anda, <b>%s</b>, memerlukan evaluasi akhir magang. %s
				</p>

				<div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 13px; color: #9a3412;">
						<b>Catatan:</b> Evaluasi 4 pilar kompetensi (Profesional, Personal, Sosial, dan Administratif) yang Anda finalisasi merupakan syarat mutlak agar sertifikat kelulusan peserta dapat diterbitkan oleh pihak dinas.
					</p>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Silakan masuk ke halaman Rapor / Evaluasi Nilai untuk mengisi lembar evaluasi dan memfinalisasi penilaian peserta.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/mentor/penilaian" style="display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Isi Evaluasi Nilai Akhir
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaMentor, namaPeserta, pesanWaktu)
}