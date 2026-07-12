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
		pesan = "Selamat, pendaftaran magang Anda telah diterima."
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