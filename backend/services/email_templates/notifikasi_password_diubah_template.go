package emailtemplates

import (
	"fmt"
	"time"
)

func NotifikasiPasswordDiubahTemplate(namaUser string, alamatIP string, waktu string) string {
	return fmt.Sprintf(`
		<table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
			<tr>
				<td align="center" style="padding: 24px 16px;">
					<table width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(11,20,66,0.08);">

						<!-- Header gradient -->
						<tr>
							<td bgcolor="#0B1442" style="background-color: #0B1442; background-image: linear-gradient(135deg, #0B1442, #7f1d1d, #dc2626); padding: 32px 28px; text-align: center;">
								<table cellpadding="0" cellspacing="0" align="center">
									<tr>
										<td width="52" height="52" align="center" valign="middle" bgcolor="#7f1d1d" style="background-color: rgba(255,255,255,0.15); border-radius: 14px; font-size: 22px; line-height: 52px;">
											&#128273;
										</td>
									</tr>
								</table>
								<p style="color: #ffffff; margin: 12px 0 0; font-size: 17px; font-weight: 800; letter-spacing: 0.3px;">SIM Magang Diskominfo</p>
								<p style="color: rgba(255,255,255,0.65); margin: 4px 0 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Kabupaten Ponorogo</p>
							</td>
						</tr>

						<!-- Banner peringatan -->
						<tr>
							<td bgcolor="#1e293b" align="center" style="background-color: #1e293b; padding: 10px 24px;">
								<span style="color: #fca5a5; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">&#128737; PEMBERITAHUAN KEAMANAN PENTING</span>
							</td>
						</tr>

						<!-- Body -->
						<tr>
							<td bgcolor="#ffffff" style="background-color: #ffffff; padding: 36px 28px;">
								<table width="100%%" cellpadding="0" cellspacing="0">
									<tr>
										<td align="center" style="color: #0B1442; font-size: 18px; font-weight: 800; padding-bottom: 12px;">
											Password Akun Anda Telah Diubah
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 24px;">
											Password akun <strong>SIM Magang Diskominfo</strong> Anda telah berhasil direset melalui fitur <strong>Lupa Password</strong>. Jika Anda tidak merasa melakukan permintaan reset password ini, segera hubungi pihak diskominfo untuk mendapatkan bantuan.
										</td>
									</tr>

									<!-- Info Waktu & IP -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<p style="color: #94a3b8; font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 8px;">Informasi Perubahan</p>
														<table width="100%%" cellpadding="0" cellspacing="0">
															<tr>
																<td style="color: #475569; font-size: 12px; padding: 3px 0;">&#128337; Waktu Perubahan</td>
																<td align="right" style="color: #0B1442; font-size: 12px; font-weight: 700; padding: 3px 0;">%s WIB</td>
															</tr>
															<tr>
																<td style="color: #475569; font-size: 12px; padding: 3px 0;">&#128205; Alamat IP</td>
																<td align="right" style="color: #0B1442; font-size: 12px; font-weight: 700; padding: 3px 0;">%s</td>
															</tr>
														</table>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr><td style="height: 20px;"></td></tr>

									<!-- Kotak peringatan -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#fef2f2" style="background-color: #fef2f2; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<table cellpadding="0" cellspacing="0">
															<tr>
																<td valign="top" style="font-size: 14px; padding-right: 10px;">&#128737;</td>
																<td style="color: #991b1b; font-size: 12px; line-height: 1.6;">
																	<strong>Bukan Anda yang melakukan ini?</strong><br/>
																	Segera hubungi admin Diskominfo Ponorogo untuk mengamankan akun Anda sesegera mungkin.
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
												Jika perubahan ini dilakukan oleh Anda sendiri, Anda dapat mengabaikan pesan ini.
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
	`, namaUser, waktu, alamatIP, time.Now().Year())
}