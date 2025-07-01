// src/backend/src/api/credential/templates/credential-issuance.ts

interface Achievement {
  name: string
}

interface Credential {
  credentialId: string
}

interface User {
  username: string
  email: string
}

interface TemplateParams {
  achievement: Achievement
  credential: Credential
  frontendUrl: string
  user: User | null
}

export const generateCredentialIssuanceEmail = ({ achievement, credential, frontendUrl, user }: TemplateParams) => {
  const subject = `You've received a new credential: ${achievement.name}`

  const text = `Congratulations! You have been awarded the "${achievement.name}" credential.

View your credential at: ${frontendUrl}/credentials/${credential.credentialId}

Follow our LinkedIn guide to add this credential to your LinkedIn profile: ${frontendUrl}/linkedin

If you need any support or have any question please contact us at hello@schroedinger-hat.org

${user ? `
A user account has been created for you to manage your credentials.
Username: ${user.username}
Email: ${user.email}

To set your password, please visit: ${frontendUrl}/forgot-password
` : ''}

Thank you,
The Certo Team`

  const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(achievement.name)}&organizationId=53115782&issueYear=${new Date().getFullYear()}&certId=${credential.credentialId}&certUrl=${encodeURIComponent(frontendUrl + '/credentials/' + credential.credentialId)}`

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've Received a New Credential: ${achievement.name}</title>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f7;">
    <tr>
      <td align="center" style="padding: 20px;">
        <!--[if mso]>
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" align="center">
        <tr>
        <td>
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2d3748; padding: 24px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h1 style="margin: 0; font-size: 24px; color: #ffffff; font-weight: bold;">Certo</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin-top: 0; color: #2d3748; font-size: 22px;">Congratulations!</h2>
              <p style="margin: 0; color: #4a5568; line-height: 1.6;">You have been awarded the "<strong>${achievement.name}</strong>" credential.</p>
              
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin-top: 32px; margin-bottom: 16px;">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/credentials/${credential.credentialId}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #3182ce; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px;">View Your Credential</a>
                  </td>
                </tr>
              </table>
              <!-- LinkedIn Add to Profile Button -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${linkedInUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #0077b5; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px;">
                      <img src="https://download.linkedin.com/desktop/add2profile/buttons/en_US.png" alt="LinkedIn Add to Profile" style="height: 20px; vertical-align: middle; margin-right: 8px;" />
                      Add to LinkedIn
                    </a>
                  </td>
                </tr>
              </table>

              <div style="margin: 24px 0; padding: 16px; background: #f3f4f6; border-radius: 6px; text-align: center;">
                <strong>Want to add this credential to your LinkedIn profile?</strong><br />
                <a href="https://certo.schroedinger-hat.org/linkedin" style="color: #0077b5; text-decoration: underline;">Follow our LinkedIn guide</a>
              </div>

              <div style="margin: 24px 0; padding: 16px; background: #fef9c3; border-radius: 6px; text-align: center; color: #92400e;">
                If you need any support or have any question please contact us at <a href="mailto:hello@schroedinger-hat.org" style="color: #92400e; text-decoration: underline;">hello@schroedinger-hat.org</a>
              </div>

              ${user ? `
                <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 0;" />
                <div style="padding-top: 32px; padding-bottom: 32px;">
                  <h3 style="margin-top: 0; color: #2d3748; font-size: 20px;">Your Account Information</h3>
                  <p style="margin: 0; color: #4a5568; line-height: 1.6;">A user account has been created for you to manage your credentials and discover new opportunities.</p>
                  <div style="background-color: #edf2f7; border-radius: 6px; padding: 20px; margin-top: 24px; margin-bottom: 24px;">
                    <p style="margin: 0 0 10px 0; color: #4a5568;"><strong>Username:</strong> ${user.username}</p>
                    <p style="margin: 0; color: #4a5568;"><strong>Email:</strong> ${user.email}</p>
                  </div>
                  <p style="margin: 0; color: #4a5568; line-height: 1.6;">To set your password and access your account, please click the button below and enter your email address.</p>
                </div>
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                  <tr>
                    <td align="center">
                      <a href="${frontendUrl}/forgot-password" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #4a5568; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px;">Set Your Password</a>
                    </td>
                  </tr>
                </table>
              ` : ''}

            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center; background-color: #edf2f7; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              <p style="margin: 0; font-size: 12px; color: #718096;">You received this email because you were issued a credential through Certo.</p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #718096;">&copy; ${new Date().getFullYear()} Certo. All rights reserved.</p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, text, html }
} 