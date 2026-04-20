interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const escapeHtmlAttribute = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

export const SignupEmail = ({ confirmationUrl }: SignupEmailProps) => `<!DOCTYPE html>

<html>

<head><meta charset="utf-8"></head>

<body style="margin:0;padding:0;background:#ffffff;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0a07;min-height:100vh;">

<tr><td align="center" style="padding:40px 20px;">

<table width="480" cellpadding="0" cellspacing="0" style="background:#1a1510;border-radius:14px;border:1px solid rgba(212,160,74,0.15);">

<tr><td align="center" style="padding:40px 32px;">

<p style="margin:0 0 24px;font-family:Georgia,serif;font-size:12px;letter-spacing:4px;text-transform:uppercase;color:#a07830;">ANCESTORSQR</p>

<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:32px;color:#f0e8da;">Your story is waiting.</h1>

<p style="margin:0 0 32px;font-family:Georgia,serif;font-style:italic;font-size:17px;color:#c4b8a6;">Confirm your email to begin your journey.</p>

<a href="${escapeHtmlAttribute(confirmationUrl)}" style="display:inline-block;background:linear-gradient(135deg,#e8943a,#c47828);color:#1a1208;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:60px;">Confirm My Email</a>

<p style="margin:32px 0 0;font-family:Georgia,serif;font-style:italic;font-size:12px;color:#8a7e6e;">Every family has a story worth telling.</p>

<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#8a7e6e;">ANCESTORSQR — EST. 2026</p>

</td></tr>

</table>

</td></tr>

</table>

</body>

</html>`

export const SignupEmailText = ({ confirmationUrl }: SignupEmailProps) => `Your story is waiting.\n\nConfirm your email to begin your journey.\n\nConfirm My Email: ${confirmationUrl}\n\nEvery family has a story worth telling.\n\nANCESTORSQR — EST. 2026`

export default SignupEmail
