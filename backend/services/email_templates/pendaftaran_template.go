package emailtemplates

import (
	"fmt"
	"time"
)

func TemplatePendaftaranBerhasil(nama string) string {
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
											&#128228;
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
											Pendaftaran Magang Berhasil Dikirim
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 24px;">
											Pendaftaran magang Anda telah berhasil dikirim dan saat ini sedang menunggu proses review dari admin.
										</td>
									</tr>

									<!-- Badge status -->
									<tr>
										<td align="center" style="padding-bottom: 24px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#e0e7ff" style="background-color: #e0e7ff; border-radius: 999px; padding: 6px 16px;">
														<span style="color: #3730a3; font-size: 11px; font-weight: 700;">&#128337; Status: Menunggu Review</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Kotak info -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f0f9ff" style="background-color: #f0f9ff; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<table cellpadding="0" cellspacing="0">
															<tr>
																<td valign="top" style="font-size: 14px; padding-right: 10px;">&#8505;</td>
																<td style="color: #0369a1; font-size: 12px; line-height: 1.6;">
																	Silakan pantau status pendaftaran Anda secara berkala melalui dashboard pendaftaran magang.
																</td>
															</tr>
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
												Terima kasih telah mendaftar melalui portal SIM Magang Diskominfo Ponorogo.
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
	`, nama, time.Now().Year())
}

func TemplateStatusPendaftaran(nama string, status string, catatan string) string {
	var pesan, badgeColor, badgeText, badgeLabel, iconEntity string

	switch status {
	case "menunggu":
		pesan = "Pendaftaran Anda sedang menunggu proses review admin."
		badgeColor, badgeText, badgeLabel, iconEntity = "#e0e7ff", "#3730a3", "Menunggu Review", "&#128337;"
	case "revisi":
		pesan = "Pendaftaran Anda perlu diperbaiki. Silakan cek catatan admin dan unggah ulang dokumen yang diminta."
		badgeColor, badgeText, badgeLabel, iconEntity = "#fef3c7", "#92400e", "Perlu Revisi", "&#9888;"
	case "diterima":
		pesan = "Selamat, pendaftaran magang Anda telah diterima. " +
			"Surat penerimaan resmi akan dikirim menyusul ke email ini setelah diterbitkan oleh admin."
		badgeColor, badgeText, badgeLabel, iconEntity = "#d1fae5", "#065f46", "Diterima", "&#9989;"
	case "ditolak":
		pesan = "Mohon maaf, pendaftaran magang Anda belum dapat diterima."
		badgeColor, badgeText, badgeLabel, iconEntity = "#fee2e2", "#991b1b", "Ditolak", "&#10060;"
	default:
		pesan = "Status pendaftaran Anda telah diperbarui."
		badgeColor, badgeText, badgeLabel, iconEntity = "#e2e8f0", "#334155", "Diperbarui", "&#128276;"
	}

	if catatan == "" {
		catatan = "-"
	}

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
											Status Pendaftaran Diperbarui
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 24px;">
											%s
										</td>
									</tr>

									<!-- Badge status -->
									<tr>
										<td align="center" style="padding-bottom: 24px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="%s" style="background-color: %s; border-radius: 999px; padding: 6px 16px;">
														<span style="color: %s; font-size: 11px; font-weight: 700;">%s Status: %s</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Catatan admin -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 6px;">Catatan Admin</p>
														<p style="color: #334155; font-size: 12.5px; line-height: 1.6; margin: 0;">%s</p>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr><td style="height: 20px;"></td></tr>

									<tr>
										<td style="border-top: 1px solid #e2e8f0; padding-top: 18px;">
											<p style="color: #94a3b8; font-size: 11px; line-height: 1.6; margin: 0; text-align: center;">
												Silakan cek dashboard pendaftaran untuk informasi lebih lanjut.
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
	`, nama, pesan, badgeColor, badgeColor, badgeText, iconEntity, badgeLabel, catatan, time.Now().Year())
}

func SubjectStatusPendaftaran(status string) string {
	switch status {
	case "menunggu":
		return "Pendaftaran Magang Menunggu Review"
	case "revisi":
		return "Pendaftaran Magang Perlu Revisi"
	case "diterima":
		return "Pendaftaran Magang Diterima"
	case "ditolak":
		return "Pendaftaran Magang Ditolak"
	default:
		return "Status Pendaftaran Magang Diperbarui"
	}
}

// TemplatePendaftaranMagangBaruAdmin menghasilkan email resmi ke admin saat ada pendaftaran magang baru
func TemplatePendaftaranMagangBaruAdmin(nama, kategori, institusi, jurusan, noHp, posisiBidang, tglMulai, tglSelesai string, pendaftaranID uint) string {
	urlDetail := fmt.Sprintf("https://sim-magang.ponorogo.go.id/admin/pendaftaran?id=%d", pendaftaranID)

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #004F9F; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Pendaftaran Magang Baru</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo <b>Admin SIM Magang</b>,</p>

				<p>
					Sistem menerima berkas pendaftaran magang baru yang telah dikirimkan oleh pemohon melalui portal pendaftaran publik dan saat ini berstatus <b>Menunggu Review</b>:
				</p>

				<div style="background-color: #f8fafc; border-left: 4px solid #004F9F; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<table style="width: 100%%; font-size: 13px; border-collapse: collapse;">
						<tr>
							<td style="padding: 5px 0; color: #64748b; width: 140px;"><b>Nama Pendaftar:</b></td>
							<td style="padding: 5px 0; font-weight: bold; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Kategori:</b></td>
							<td style="padding: 5px 0; text-transform: capitalize; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Asal Institusi:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Jurusan / Prodi:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Kontak / No. HP:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Posisi Bidang:</b></td>
							<td style="padding: 5px 0; font-weight: bold; color: #0284c7;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Periode Magang:</b></td>
							<td style="padding: 5px 0; color: #0f172a;">%s s.d. %s</td>
						</tr>
					</table>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Silakan masuk ke panel admin untuk memeriksa kelengkapan berkas administrasi (Surat Pengantar, CV, Transkrip, Pas Foto, dan Proposal).
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="%s" style="display: inline-block; background-color: #004F9F; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Verifikasi Berkas Sekarang
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, nama, kategori, institusi, jurusan, noHp, posisiBidang, tglMulai, tglSelesai, urlDetail)
}

// TemplateRevisiDokumenBerhasil menghasilkan email konfirmasi ke pemohon bahwa perbaikan berkas telah diterima sistem
func TemplateRevisiDokumenBerhasil(nama string) string {
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
											&#128221;
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
											Perbaikan Berkas Telah Diterima
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 24px;">
											Dokumen perbaikan (revisi) yang Anda kirimkan telah berhasil diterima oleh server SIM Magang dan status pendaftaran Anda saat ini kembali ke tahap <strong>Menunggu Verifikasi</strong>.
										</td>
									</tr>

									<!-- Badge status -->
									<tr>
										<td align="center" style="padding-bottom: 24px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#e0e7ff" style="background-color: #e0e7ff; border-radius: 999px; padding: 6px 16px;">
														<span style="color: #3730a3; font-size: 11px; font-weight: 700;">&#128337; Status: Menunggu Verifikasi Ulang</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Kotak info -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f0fdf4" style="background-color: #f0fdf4; border-radius: 12px; border: 1px solid #bbf7d0;">
												<tr>
													<td style="padding: 14px 16px;">
														<table cellpadding="0" cellspacing="0">
															<tr>
																<td valign="top" style="font-size: 14px; padding-right: 10px; color: #16a34a;">&#10004;</td>
																<td style="color: #15803d; font-size: 12px; line-height: 1.6;">
																	Tim verifikator kami akan memeriksa kembali kesesuaian dokumen yang telah Anda perbaiki. Anda dapat memantau status secara berkala melalui Dashboard.
																</td>
															</tr>
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
												Terima kasih telah melengkapi berkas dengan tepat waktu.
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
	`, nama, time.Now().Year())
}

// TemplateRevisiDokumenMasukAdmin menghasilkan email notifikasi ke tim admin saat peserta mengunggah berkas revisi baru
func TemplateRevisiDokumenMasukAdmin(nama, kategori, posisiBidang, catatanPeserta string, pendaftaranID uint) string {
	urlDetail := fmt.Sprintf("https://sim-magang.ponorogo.go.id/admin/pendaftaran?id=%d", pendaftaranID)
	if catatanPeserta == "" {
		catatanPeserta = "-"
	}

	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
			<div style="background-color: #d97706; padding: 24px; text-align: center; color: #ffffff;">
				<h2 style="margin: 0; font-size: 20px;">Berkas Revisi Masuk</h2>
				<p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Dinas Komunikasi dan Informatika Kabupaten Ponorogo</p>
			</div>

			<div style="padding: 24px;">
				<p>Halo <b>Admin SIM Magang</b>,</p>

				<p>
					Pemohon berikut telah memperbarui dan mengirimkan ulang berkas revisi yang diminta sebelumnya:
				</p>

				<div style="background-color: #f8fafc; border-left: 4px solid #d97706; padding: 16px; margin: 18px 0; border-radius: 6px;">
					<table style="width: 100%%; font-size: 13px; border-collapse: collapse;">
						<tr>
							<td style="padding: 5px 0; color: #64748b; width: 140px;"><b>Nama Pemohon:</b></td>
							<td style="padding: 5px 0; font-weight: bold; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Kategori:</b></td>
							<td style="padding: 5px 0; text-transform: capitalize; color: #0f172a;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b;"><b>Posisi Bidang:</b></td>
							<td style="padding: 5px 0; font-weight: bold; color: #0284c7;">%s</td>
						</tr>
						<tr>
							<td style="padding: 5px 0; color: #64748b; vertical-align: top;"><b>Catatan Pemohon:</b></td>
							<td style="padding: 5px 0; color: #334155; font-style: italic;">"%s"</td>
						</tr>
					</table>
				</div>

				<p style="font-size: 13px; color: #475569;">
					Silakan lakukan verifikasi ulang terhadap berkas dokumen yang telah diperbaiki melalui panel admin.
				</p>

				<div style="text-align: center; margin: 24px 0;">
					<a href="%s" style="display: inline-block; background-color: #d97706; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px;">
						Periksa Berkas Revisi
					</a>
				</div>
			</div>

			<div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
				Email ini dikirim otomatis oleh Sistem Informasi Manajemen Magang Diskominfo Ponorogo.
			</div>
		</div>
	`, nama, kategori, posisiBidang, catatanPeserta, urlDetail)
}