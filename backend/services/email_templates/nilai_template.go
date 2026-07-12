package emailtemplates

import "fmt"

func TemplateNilaiAkhirDiterbitkan(namaPeserta string, nilaiAkhir string, predikat string) string {
	return fmt.Sprintf(`
		<h3>Nilai Akhir Magang Telah Diterbitkan</h3>

		<p>Halo, <b>%s</b>.</p>

		<p>
			Nilai akhir magang Anda telah diterbitkan oleh mentor.
		</p>

		<p><b>Nilai Akhir:</b> %s</p>
		<p><b>Predikat:</b> %s</p>

		<br>
		<p>Silakan login ke Web Manajemen Magang untuk melihat detail nilai.</p>
	`, namaPeserta, nilaiAkhir, predikat)
}