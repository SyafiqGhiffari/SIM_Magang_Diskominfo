package emailtemplates

import (
	"fmt"
	"html"
	"strings"
	"time"
)

// BalasanPertanyaanTemplate menyusun email balasan admin atas pertanyaan yang
// dikirim lewat form FAQ publik. Pertanyaan asli ikut disertakan agar penerima
// ingat konteksnya — jeda antara bertanya dan dibalas bisa berhari-hari.
func BalasanPertanyaanTemplate(nama, pertanyaan, jawaban string) string {
	// Baris baru diubah jadi <br> supaya susunan paragraf admin tidak hilang.
	jawabanHTML := strings.ReplaceAll(html.EscapeString(jawaban), "\n", "<br>")
	pertanyaanHTML := strings.ReplaceAll(html.EscapeString(pertanyaan), "\n", "<br>")
	namaHTML := html.EscapeString(nama)

	return fmt.Sprintf(`
		<table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
			<tr>
				<td align="center" style="padding: 24px 16px;">
					<table width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(11,20,66,0.08);">

						<tr>
							<td bgcolor="#0B1442" style="background-color: #0B1442; background-image: linear-gradient(135deg, #0B1442, #1E3A8A, #00A5EC); padding: 32px 28px; text-align: center;">
								<table cellpadding="0" cellspacing="0" align="center">
									<tr>
										<td width="52" height="52" align="center" valign="middle" bgcolor="#1a2a6c" style="background-color: rgba(255,255,255,0.15); border-radius: 14px; font-size: 22px; line-height: 52px;">
											&#128172;
										</td>
									</tr>
								</table>
								<p style="color: #ffffff; margin: 12px 0 0; font-size: 17px; font-weight: 800; letter-spacing: 0.3px;">SIM Magang Diskominfo</p>
								<p style="color: rgba(255,255,255,0.65); margin: 4px 0 0; font-size: 10.5px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Kabupaten Ponorogo</p>
							</td>
						</tr>

						<tr>
							<td bgcolor="#ffffff" style="background-color: #ffffff; padding: 32px 28px;">
								<p style="color: #0B1442; font-size: 18px; font-weight: 800; margin: 0 0 6px;">Balasan Atas Pertanyaan Anda</p>
								<p style="color: #475569; font-size: 13.5px; line-height: 1.7; margin: 0 0 24px;">
									Halo <strong style="color:#0B1442;">%s</strong>, terima kasih telah menghubungi kami. Berikut jawaban atas pertanyaan yang Anda kirimkan.
								</p>

								<table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
									<tr>
										<td bgcolor="#f8fafc" style="background-color: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 0 8px 8px 0; padding: 14px 16px;">
											<p style="color: #94a3b8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;">Pertanyaan Anda</p>
											<p style="color: #64748b; font-size: 13px; line-height: 1.65; margin: 0; font-style: italic;">%s</p>
										</td>
									</tr>
								</table>

								<table width="100%%" cellpadding="0" cellspacing="0">
									<tr>
										<td bgcolor="#eff6ff" style="background-color: #eff6ff; border-left: 3px solid #004F9F; border-radius: 0 8px 8px 0; padding: 16px 18px;">
											<p style="color: #004F9F; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Jawaban Kami</p>
											<p style="color: #1e293b; font-size: 13.5px; line-height: 1.75; margin: 0;">%s</p>
										</td>
									</tr>
								</table>

								<p style="color: #94a3b8; font-size: 12px; line-height: 1.65; margin: 24px 0 0; padding-top: 18px; border-top: 1px solid #e2e8f0;">
									Bila masih ada yang ingin ditanyakan, Anda dapat mengirim pertanyaan kembali melalui halaman FAQ di situs kami.
								</p>
							</td>
						</tr>

						<tr>
							<td bgcolor="#f8fafc" style="background-color: #f8fafc; padding: 18px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
								<p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.6;">
									Email ini dikirim otomatis oleh SIM Magang Diskominfo Kabupaten Ponorogo.<br>
									%s
								</p>
							</td>
						</tr>

					</table>
				</td>
			</tr>
		</table>
	`, namaHTML, pertanyaanHTML, jawabanHTML, time.Now().Format("2 January 2006"))
}