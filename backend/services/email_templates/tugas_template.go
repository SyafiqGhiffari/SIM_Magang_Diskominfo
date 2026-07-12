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