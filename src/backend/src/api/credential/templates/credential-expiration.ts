interface Achievement {
  name: string
}

interface Credential {
  credentialId: string
  id: number | string
}

interface User {
  username: string
  email: string
}

interface ExpirationWarningParams {
  achievement: Achievement
  credential: Credential
  frontendUrl: string
  user: User | null
  daysLeft: number
  expirationDate: Date
}

export const generateCredentialExpirationEmail = ({
  achievement,
  credential,
  frontendUrl,
  user,
  daysLeft,
  expirationDate,
}: ExpirationWarningParams) => {
  const formattedDate = expirationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const urgency = daysLeft <= 1 ? 'expires today' : `expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
  const subject = `Your credential "${achievement.name}" ${urgency}`

  const credentialUrl = `${frontendUrl}/credentials/${encodeURIComponent(credential.credentialId)}`
  const renewUrl = credentialUrl

  const text = `Your credential "${achievement.name}" will expire on ${formattedDate} (${urgency}).

View and renew your credential at: ${credentialUrl}

If you have any questions, please contact the issuer or reach us at hello@schroedinger-hat.org

Thank you,
The Certo Team`

  const urgencyColor = daysLeft <= 1 ? '#e53e3e' : daysLeft <= 7 ? '#dd6b20' : '#d69e2e'
  const urgencyBg = daysLeft <= 1 ? '#fff5f5' : daysLeft <= 7 ? '#fffaf0' : '#fffff0'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Credential Expiration Notice</h1>
  </div>

  <div style="background-color: #f7f9fc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0; border-top: none;">

    <div style="background-color: ${urgencyBg}; border-left: 4px solid ${urgencyColor}; padding: 15px; margin-bottom: 25px; border-radius: 0 5px 5px 0;">
      <p style="margin: 0; color: ${urgencyColor}; font-weight: bold;">
        ⚠️ Your credential <strong>${achievement.name}</strong> ${urgency}.
      </p>
      <p style="margin: 5px 0 0; color: #4a5568; font-size: 14px;">Expiration date: ${formattedDate}</p>
    </div>

    ${user ? `<p>Hi ${user.username},</p>` : '<p>Hello,</p>'}
    <p>This is a reminder that your credential will expire soon. Please take action to renew it if needed.</p>

    <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e2e8f0;">
      <h2 style="margin: 0 0 10px; color: #2d3748; font-size: 18px;">${achievement.name}</h2>
      <p style="margin: 0; color: #718096; font-size: 14px; word-break: break-all;">ID: ${credential.credentialId}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${renewUrl}"
         style="background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
        View &amp; Renew Credential
      </a>
    </div>

    <p style="color: #718096; font-size: 14px;">
      If you believe this is an error or have questions, please contact the credential issuer or reach us at
      <a href="mailto:hello@schroedinger-hat.org" style="color: #667eea;">hello@schroedinger-hat.org</a>.
    </p>
  </div>

  <p style="text-align: center; color: #a0aec0; font-size: 12px; margin-top: 20px;">
    You received this email because you hold a credential managed through Certo.
  </p>
</body>
</html>`

  return { subject, text, html }
}
