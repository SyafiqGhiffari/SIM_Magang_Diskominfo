package emailtemplates

import (
	"fmt"
	"time"
)

func ResetPasswordEmailTemplate(nama string, resetLink string) string {
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
											&#128273;
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
											Permintaan Reset Password
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 24px;">
											Kami menerima permintaan untuk mengatur ulang password akun SIM Magang Anda. Klik tombol di bawah ini untuk membuat password baru.
										</td>
									</tr>

									<!-- Tombol CTA -->
									<tr>
										<td align="center" style="padding-bottom: 20px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td align="center" bgcolor="#0B1442" style="background-color: #0B1442; background-image: linear-gradient(135deg, #0B1442, #1E3A8A); border-radius: 10px;">
														<a href="%s" style="display: inline-block; padding: 14px 36px; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none;">
															Atur Ulang Password
														</a>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Badge waktu berlaku -->
									<tr>
										<td align="center" style="padding-bottom: 20px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#e0e7ff" style="background-color: #e0e7ff; border-radius: 999px; padding: 4px 12px;">
														<span style="color: #3730a3; font-size: 11px; font-weight: 600;">&#9201; Tautan berlaku selama 30 menit</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Fallback link -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<p style="color: #94a3b8; font-size: 11px; line-height: 1.6; margin: 0 0 6px;">
															Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:
														</p>
														<p style="color: #004F9F; font-size: 11px; line-height: 1.6; margin: 0; word-break: break-all;">%s</p>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr><td style="height: 20px;"></td></tr>

									<!-- Kotak peringatan -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#fefce8" style="background-color: #fefce8; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<table cellpadding="0" cellspacing="0">
															<tr>
																<td valign="top" style="font-size: 14px; padding-right: 10px;">&#9888;</td>
																<td style="color: #854d0e; font-size: 12px; line-height: 1.6;">
																	Jika Anda tidak meminta perubahan password ini, abaikan email ini atau segera hubungi admin. Akun Anda tetap aman selama Anda tidak membagikan tautan ini kepada siapa pun.
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
												Demi keamanan akun Anda, jangan bagikan tautan ini kepada siapa pun.
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
	`, nama, resetLink, resetLink, time.Now().Year())
}