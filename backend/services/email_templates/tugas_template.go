package emailtemplates

import "fmt"

func TemplateTugasBaru(namaPeserta string, judulTugas string, namaMentor string, deadline string) string {
	return fmt.Sprintf(`
		<h3>Tugas Baru dari Mentor</h3>

		<p>Halo, <b>%s</b>.</p>

		<p>
			Anda mendapatkan tugas baru dari mentor <b>%s</b>.
		</p>

		<p><b>Judul Tugas:</b> %s</p>
		<p><b>Deadline:</b> %s</p>

		<br>
		<p>
			Silakan login ke Web Manajemen Magang untuk melihat detail tugas
			dan mengumpulkan jawaban.
		</p>
	`, namaPeserta, namaMentor, judulTugas, deadline)
}

func TemplateTugasRevisi(namaPeserta string, judulTugas string, catatanMentor string) string {
	if catatanMentor == "" {
		catatanMentor = "-"
	}

	return fmt.Sprintf(`
		<h3>Tugas Perlu Direvisi</h3>

		<p>Halo, <b>%s</b>.</p>

		<p>
			Tugas Anda dengan judul <b>%s</b> perlu diperbaiki.
		</p>

		<p><b>Catatan Mentor:</b> %s</p>

		<br>
		<p>
			Silakan login ke Web Manajemen Magang untuk mengunggah revisi tugas.
		</p>
	`, namaPeserta, judulTugas, catatanMentor)
}

func TemplateTugasDinilai(namaPeserta string, judulTugas string, nilai string, catatanMentor string) string {
	if catatanMentor == "" {
		catatanMentor = "-"
	}

	return fmt.Sprintf(`
		<h3>Tugas Telah Dinilai</h3>

		<p>Halo, <b>%s</b>.</p>

		<p>
			Tugas Anda dengan judul <b>%s</b> telah dinilai oleh mentor.
		</p>

		<p><b>Nilai:</b> %s</p>
		<p><b>Catatan Mentor:</b> %s</p>

		<br>
		<p>Silakan login ke Web Manajemen Magang untuk melihat detail penilaian.</p>
	`, namaPeserta, judulTugas, nilai, catatanMentor)
}

func TemplatePengingatDeadlineTugas(namaPeserta string, judulTugas string, deadline string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #f59e0b; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pengingat Tenggat Waktu Tugas</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo, <b>%s</b>.</p>

				<p>
					Ini adalah pengingat bahwa tugas magang dengan judul <b>"%s"</b> memiliki batas waktu pengumpulan yang akan segera berakhir:
				</p>

				<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px; margin: 18px 0; border-radius: 4px;">
					<p style="margin: 0; font-size: 14px; color: #b45309;">
						<b>Batas Waktu Pengumpulan:</b> %s
					</p>
				</div>

				<p>
					Sistem mendeteksi bahwa Anda belum mengumpulkan jawaban untuk tugas ini. Segera selesaikan dan kirimkan pengumpulan tugas Anda sebelum batas waktu ditutup.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="https://sim-magang.ponorogo.go.id/peserta/pembelajaran/tugas" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Kumpulkan Tugas Sekarang
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaPeserta, judulTugas, deadline)
}

// TemplateTugasDikumpulkanMentor menghasilkan email ke mentor saat peserta bimbingan mengumpulkan tugas
func TemplateTugasDikumpulkanMentor(namaMentor, namaPeserta, judulTugas, catatanPeserta string, tugasID uint) string {
	if catatanPeserta == "" {
		catatanPeserta = "-"
	}
	urlReview := fmt.Sprintf("https://sim-magang.ponorogo.go.id/mentor/tugas/review?tugas_id=%d", tugasID)

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Tugas Magang Dikumpulkan</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo <b>%s</b>,</p>

				<p>
					Peserta bimbingan Anda, <b>%s</b>, telah selesai mengerjakan dan mengumpulkan pengumpulan untuk tugas:
				</p>

				<div style="background-color: #f8fafc; border-left: 4px solid #004F9F; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #0f172a;">
						%s
					</p>
					<p style="margin: 0; font-size: 13px; color: #64748b;">
						<b>Catatan Peserta:</b> %s
					</p>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Silakan masuk ke halaman review tugas untuk memeriksa berkas/jawaban peserta, memberikan catatan masukan, atau menyetujui (ACC) tugas tersebut.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="%s" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Periksa Jawaban Tugas
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaMentor, namaPeserta, judulTugas, catatanPeserta, urlReview)
}

// TemplateKuisSelesaiMentor menghasilkan email ke mentor saat peserta menyelesaikan kuis
func TemplateKuisSelesaiMentor(namaMentor, namaPeserta, judulTugas, skorStr string, tugasID uint) string {
	urlReview := fmt.Sprintf("https://sim-magang.ponorogo.go.id/mentor/tugas/review?tugas_id=%d", tugasID)

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Kuis Magang Selesai Dikerjakan</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo <b>%s</b>,</p>

				<p>
					Peserta bimbingan Anda, <b>%s</b>, telah menyelesaikan pengerjaan kuis:
				</p>

				<div style="background-color: #f8fafc; border-left: 4px solid #004F9F; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #0f172a;">
						%s
					</p>
					<p style="margin: 0; font-size: 14px; color: #16a34a; font-weight: bold;">
						Skor Akhir: %s / 100
					</p>
				</div>

				<div style="text-align: center; margin: 24px 0;">
					<a href="%s" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Lihat Rincian Jawaban Kuis
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, namaMentor, namaPeserta, judulTugas, skorStr, urlReview)
}