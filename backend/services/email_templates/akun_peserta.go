package emailtemplates

import (
	"fmt"
	"time"
)

// ==== GANTI URL ini sesuai alamat login web manajemen yang sebenarnya ====
const urlLoginManajemen = "http://localhost:5173/login"

func SubjectAkunPesertaDibuat() string {
	return "Akun Peserta Magang Anda Sudah Aktif"
}

func TemplateAkunPesertaDibuat(namaLengkap, emailLogin, password string) string {
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
											&#127881;
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
											Akun Peserta Magang Anda Sudah Aktif
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 24px;">
											Selamat! Pendaftaran magang Anda di Dinas Komunikasi dan Informatika Kabupaten Ponorogo telah <strong style="color:#065f46;">diterima</strong>. Berikut kredensial akun Anda untuk mengakses portal manajemen peserta magang.
										</td>
									</tr>

									<!-- Badge status -->
									<tr>
										<td align="center" style="padding-bottom: 20px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#d1fae5" style="background-color: #d1fae5; border-radius: 999px; padding: 6px 16px;">
														<span style="color: #065f46; font-size: 11px; font-weight: 700;">&#9989; Akun Aktif</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Kotak kredensial -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 12px;">
												<tr>
													<td style="padding: 18px 20px;">
														<p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 4px;">Email Login</p>
														<p style="color: #0B1442; font-size: 14px; font-weight: 800; margin: 0 0 14px;">%s</p>
														<p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 4px;">Password</p>
														<p style="color: #0B1442; font-size: 14px; font-weight: 800; margin: 0;">%s</p>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr><td style="height: 20px;"></td></tr>

									<!-- Tombol login -->
									<tr>
										<td align="center" style="padding-bottom: 20px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#004F9F" style="background-color: #004F9F; border-radius: 10px;">
														<a href="%s" target="_blank" style="display: inline-block; padding: 12px 32px; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none;">
															Login ke Portal Manajemen &rarr;
														</a>
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
																	Email login ini <strong>berbeda</strong> dari email pribadi Anda, khusus dipakai untuk masuk ke sistem. Seluruh notifikasi kegiatan magang akan tetap dikirim ke email pribadi Anda ini. Disarankan untuk segera mengganti password setelah login pertama kali.
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
												Terima kasih telah bergabung dalam program magang SIM Magang Diskominfo Ponorogo.
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
	`, namaLengkap, emailLogin, password, urlLoginManajemen, time.Now().Year())
}

func SubjectResetPasswordPeserta() string {
	return "Password Akun Magang Anda Telah Direset"
}

func TemplateResetPasswordPeserta(namaLengkap, emailLogin, passwordBaru string) string {
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
											Password Akun Anda Telah Direset
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 24px;">
											Password akun magang Anda telah direset oleh admin. Berikut kredensial terbaru Anda untuk mengakses portal manajemen peserta magang.
										</td>
									</tr>

									<!-- Badge status -->
									<tr>
										<td align="center" style="padding-bottom: 20px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#fef3c7" style="background-color: #fef3c7; border-radius: 999px; padding: 6px 16px;">
														<span style="color: #92400e; font-size: 11px; font-weight: 700;">&#128273; Password Direset</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Kotak kredensial -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 12px;">
												<tr>
													<td style="padding: 18px 20px;">
														<p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 4px;">Email Login</p>
														<p style="color: #0B1442; font-size: 14px; font-weight: 800; margin: 0 0 14px;">%s</p>
														<p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 4px;">Password Baru</p>
														<p style="color: #0B1442; font-size: 14px; font-weight: 800; margin: 0;">%s</p>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr><td style="height: 20px;"></td></tr>

									<!-- Tombol login -->
									<tr>
										<td align="center" style="padding-bottom: 20px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#004F9F" style="background-color: #004F9F; border-radius: 10px;">
														<a href="%s" target="_blank" style="display: inline-block; padding: 12px 32px; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none;">
															Login ke Portal Manajemen &rarr;
														</a>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- Kotak info -->
									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#fffbeb" style="background-color: #fffbeb; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<table cellpadding="0" cellspacing="0">
															<tr>
																<td valign="top" style="font-size: 14px; padding-right: 10px;">&#9888;</td>
																<td style="color: #92400e; font-size: 12px; line-height: 1.6;">
																	Jika Anda tidak meminta reset password ini, segera hubungi admin. Disarankan untuk segera mengganti password setelah login.
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
												Terima kasih telah menggunakan portal SIM Magang Diskominfo Ponorogo.
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
	`, namaLengkap, emailLogin, passwordBaru, urlLoginManajemen, time.Now().Year())
}

func SubjectMentorDitugaskan() string {
	return "Mentor Pembimbing Magang Anda Telah Ditentukan"
}

func TemplateMentorDitugaskan(namaLengkap, mentorNama, mentorJabatan, bidang string) string {
	if mentorJabatan == "" {
		mentorJabatan = "-"
	}
	return fmt.Sprintf(`
		<table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
			<tr>
				<td align="center" style="padding: 24px 16px;">
					<table width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(11,20,66,0.08);">

						<tr>
							<td bgcolor="#0B1442" style="background-color: #0B1442; background-image: linear-gradient(135deg, #0B1442, #1E3A8A, #00A5EC); padding: 32px 28px; text-align: center;">
								<table cellpadding="0" cellspacing="0" align="center">
									<tr>
										<td width="52" height="52" align="center" valign="middle" bgcolor="#1a2a6c" style="background-color: rgba(255,255,255,0.15); border-radius: 14px; font-size: 22px; line-height: 52px;">
											&#128101;
										</td>
									</tr>
								</table>
								<p style="color: #ffffff; margin: 12px 0 0; font-size: 17px; font-weight: 800; letter-spacing: 0.3px;">SIM Magang Diskominfo</p>
								<p style="color: rgba(255,255,255,0.65); margin: 4px 0 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Kabupaten Ponorogo</p>
							</td>
						</tr>

						<tr>
							<td bgcolor="#ffffff" style="background-color: #ffffff; padding: 36px 28px;">
								<table width="100%%" cellpadding="0" cellspacing="0">
									<tr>
										<td align="center" style="color: #0B1442; font-size: 18px; font-weight: 800; padding-bottom: 12px;">
											Mentor Pembimbing Anda Telah Ditentukan
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #475569; font-size: 13.5px; line-height: 1.7; padding-bottom: 4px;">
											Halo <strong style="color: #0B1442;">%s</strong>,
										</td>
									</tr>
									<tr>
										<td align="center" style="color: #64748b; font-size: 13px; line-height: 1.7; padding-bottom: 24px;">
											Admin telah menentukan mentor pembimbing untuk Anda selama masa magang di bidang <strong style="color:#0B1442;">%s</strong>.
										</td>
									</tr>

									<tr>
										<td align="center" style="padding-bottom: 20px;">
											<table cellpadding="0" cellspacing="0">
												<tr>
													<td bgcolor="#e0e7ff" style="background-color: #e0e7ff; border-radius: 999px; padding: 6px 16px;">
														<span style="color: #3730a3; font-size: 11px; font-weight: 700;">&#128101; Mentor Ditugaskan</span>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 12px;">
												<tr>
													<td style="padding: 18px 20px;">
														<p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 4px;">Nama Mentor</p>
														<p style="color: #0B1442; font-size: 14px; font-weight: 800; margin: 0 0 14px;">%s</p>
														<p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin: 0 0 4px;">Jabatan</p>
														<p style="color: #0B1442; font-size: 14px; font-weight: 800; margin: 0;">%s</p>
													</td>
												</tr>
											</table>
										</td>
									</tr>
									<tr><td style="height: 20px;"></td></tr>

									<tr>
										<td>
											<table width="100%%" cellpadding="0" cellspacing="0" bgcolor="#f0f9ff" style="background-color: #f0f9ff; border-radius: 12px;">
												<tr>
													<td style="padding: 14px 16px;">
														<table cellpadding="0" cellspacing="0">
															<tr>
																<td valign="top" style="font-size: 14px; padding-right: 10px;">&#8505;</td>
																<td style="color: #0369a1; font-size: 12px; line-height: 1.6;">
																	Mentor Anda akan membantu membimbing selama proses magang berlangsung. Anda dapat menghubungi mentor melalui koordinasi yang telah ditentukan oleh admin.
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
	`, namaLengkap, bidang, mentorNama, mentorJabatan, time.Now().Year())
}