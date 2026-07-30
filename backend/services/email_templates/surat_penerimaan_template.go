package emailtemplates

import (
	"fmt"
	"strings"
	"time"
)

// SubjectSuratPenerimaan — judul email saat surat penerimaan diterbitkan.
func SubjectSuratPenerimaan(nomorSurat string) string {
	if strings.TrimSpace(nomorSurat) == "" {
		return "Surat Penerimaan Magang Telah Diterbitkan"
	}
	return "Surat Penerimaan Magang Nomor " + nomorSurat
}

// barisDetailSurat membuat satu baris rincian (dilewati bila kosong).
func barisDetailSurat(label, nilai string) string {
	if strings.TrimSpace(nilai) == "" {
		return ""
	}
	return fmt.Sprintf(`
		<tr>
			<td valign="top" style="color: #64748b; font-size: 12px; line-height: 1.7; padding: 4px 0; width: 132px;">%s</td>
			<td valign="top" style="color: #0B1442; font-size: 12px; font-weight: 700; line-height: 1.7; padding: 4px 0;">%s</td>
		</tr>`, label, nilai)
}

// TemplateSuratPenerimaan — badan email pemberitahuan surat penerimaan magang.
// Gaya kartu disamakan dengan template email lain (header gradient #0B1442,
// lebar 480px). Berkas PDF ditampilkan sebagai kartu di dalam badan email.
func TemplateSuratPenerimaan(nama, nomorSurat, tanggalTerbit, bidang, mulai, selesai, namaInstansi, namaBerkas, urlBerkas string) string {
	if strings.TrimSpace(namaInstansi) == "" {
		namaInstansi = "Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo"
	}
	if strings.TrimSpace(namaBerkas) == "" {
		namaBerkas = "surat-penerimaan-magang.pdf"
	}
	// Bila URL kosong, kartu tetap tampil tetapi tidak bisa diklik.
	urlBerkas = strings.TrimSpace(urlBerkas)
	if urlBerkas == "" {
		urlBerkas = "#"
	}

	detail := barisDetailSurat("Nomor Surat", nomorSurat) +
		barisDetailSurat("Tanggal Surat", tanggalTerbit) +
		barisDetailSurat("Bidang/Unit Kerja", bidang) +
		barisDetailSurat("Waktu Pelaksanaan", strings.TrimSpace(mulai+" s.d. "+selesai))

	return fmt.Sprintf(`
		<table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
			<tr>
				<td align="center" style="padding: 24px 16px;">
					<table width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(11,20,66,0.08);">

						<!-- Header gradient -->
						<tr>
							<td bgcolor="#0B1442" style="background-color: #0B1442; background-image: linear-gradient(135deg, #0B1442, #1E3A8A, #00A5EC); padding: 32px 28px; text-align: center;">
								<table cellpadding="0" cellspacing="0" align="center">
									<tr>
										<td width="52" height="52" align="center" valign="middle" bgcolor="#1a2a6c" style="background-color: rgba(255,255,255,0.15); border-radius: 14px; font-size: 22px; line-height: 52px;">
											&#128196;
										</td>
									</tr>
								</table>
								<p style="color: #ffffff; margin: 12px 0 0; font-size: 17px; font-weight: 800; letter-spacing: 0.3px;">SIM Magang Diskominfo</p>
								<p style="color: rgba(255,255,255,0.65); margin: 4px 0 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Kabupaten Ponorogo</p>
							</td>
						</tr>

						<!-- Body -->
						<tr>
							<td bgcolor="#ffffff" style="background-color: #ffffff; padding: 36px 28px;">
								<table width="100%%" cellpadding="0" cellspacing="0">
									<tr>
										<td align="center" style="color: #0B1442; font-size: 18px; font-weight: 800; padding-bottom: 12px;">
											Surat Penerimaan Magang Diterbitkan
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 20px;">
											Surat penerimaan magang Anda di %s telah resmi diterbitkan. Berkas surat dapat Anda serahkan kepada pihak kampus/sekolah sebagai bukti penerimaan.
										</td>
									</tr>

									<!-- Badge status -->
									<tr>
										<td align="center" style="padding-bottom: 22px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#dcfce7" style="background-color: #dcfce7; border-radius: 999px; padding: 6px 16px;">
														<span style="color: #166534; font-size: 11px; font-weight: 700;">&#9989; Status: Surat Terbit</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Kartu berkas PDF: seluruh kartu bisa diklik -->
									<tr>
										<td style="padding-bottom: 18px;">
											<a href="%s" target="_blank" style="text-decoration: none; display: block;">
												<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border: 1px solid #bfdbfe; border-radius: 12px;">
													<tr>
														<td style="padding: 14px 16px;">
															<table width="100%%" cellpadding="0" cellspacing="0">
																<tr>
																	<td width="42" valign="middle">
																		<table cellpadding="0" cellspacing="0">
																			<tr>
																				<td width="34" height="34" align="center" valign="middle" bgcolor="#fee2e2" style="background-color: #fee2e2; border-radius: 9px; color: #b91c1c; font-size: 10px; font-weight: 800; line-height: 34px;">PDF</td>
																			</tr>
																		</table>
																	</td>
																	<td valign="middle">
																		<p style="margin: 0; color: #0B1442; font-size: 12.5px; font-weight: 700; word-break: break-all;">%s</p>
																		<p style="margin: 2px 0 0; color: #94a3b8; font-size: 11px;">Klik kartu ini untuk membuka surat penerimaan magang Anda</p>
																	</td>
																</tr>
															</table>
														</td>
													</tr>
												</table>
											</a>
										</td>
									</tr>

									<!-- Rincian surat -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f0f9ff" style="background-color: #f0f9ff; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<p style="margin: 0 0 8px; color: #0369a1; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Rincian Surat</p>
														<table width="100%%" cellpadding="0" cellspacing="0">
															%s
														</table>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr><td style="height: 20px;"></td></tr>

									<tr>
										<td style="border-top: 1px solid #e2e8f0; padding-top: 18px;">
											<p style="color: #94a3b8; font-size: 11px; line-height: 1.6; margin: 0; text-align: center;">
												Mohon periksa kembali kesesuaian data pada surat. Bila terdapat kekeliruan, silakan hubungi admin magang agar surat diperbaiki dan dikirim ulang.
											</p>
										</td>
									</tr>
								</table>
							</td>
						</tr>

					</table>

					<p style="text-align: center; color: #94a3b8; font-size: 10px; margin-top: 20px; line-height: 1.6;">
						&copy; %d Dinas Komunikasi, Informatika dan Statistik<br/>Kabupaten Ponorogo
					</p>
				</td>
			</tr>
		</table>
	`, nama, namaInstansi, urlBerkas, namaBerkas, detail, time.Now().Year())
}