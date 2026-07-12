package emailtemplates

import "fmt"

func TemplateLogbookDikonfirmasi(namaPeserta string, tanggal string) string {
	return fmt.Sprintf(`
		<h3>Logbook Harian Dikonfirmasi</h3>

		<p>Halo, <b>%s</b>.</p>

		<p>
			Logbook harian Anda pada tanggal <b>%s</b> telah dikonfirmasi oleh mentor.
		</p>

		<br>
		<p>Silakan login ke Web Manajemen Magang untuk melihat detail logbook.</p>
	`, namaPeserta, tanggal)
}

func TemplatePengingatLogbook(namaPeserta string, tanggal string) string {
	return fmt.Sprintf(`
		<h3>Pengingat Pengisian Logbook Harian</h3>

		<p>Halo, <b>%s</b>.</p>

		<p>
			Anda belum mengisi logbook harian untuk tanggal <b>%s</b>.
		</p>

		<p>
			Silakan segera login ke Web Manajemen Magang dan lengkapi logbook harian sesuai kegiatan magang yang telah dilakukan.
		</p>

		<br>
		<p>Terima kasih.</p>
	`, namaPeserta, tanggal)
}