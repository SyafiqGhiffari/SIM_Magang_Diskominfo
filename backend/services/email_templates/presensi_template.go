package emailtemplates

import "fmt"

func TemplatePengingatPresensi(namaPeserta string, tanggal string) string {
	return fmt.Sprintf(`
		<h3>Pengingat Presensi Magang</h3>

		<p>Halo, <b>%s</b>.</p>

		<p>
			Ini adalah pengingat untuk melakukan presensi magang pada tanggal <b>%s</b>.
		</p>

		<br>
		<p>Silakan login ke Web Manajemen Magang untuk melakukan presensi.</p>
	`, namaPeserta, tanggal)
}

func TemplatePresensiTidakLengkap(namaPeserta string, tanggal string) string {
	return fmt.Sprintf(`
		<h3>Presensi Belum Lengkap</h3>

		<p>Halo, <b>%s</b>.</p>

		<p>
			Presensi Anda pada tanggal <b>%s</b> belum lengkap.
			Pastikan Anda melakukan presensi masuk dan presensi pulang sesuai ketentuan.
		</p>

		<br>
		<p>Silakan cek kembali riwayat presensi Anda di Web Manajemen Magang.</p>
	`, namaPeserta, tanggal)
}