/**
 * Certificate template generator
 * Creates a dynamic SVG certificate based on credential data
 */

interface CertificateData {
  recipientName: string
  achievementName: string
  issuerName: string
  issueDate: string
  credentialId: string
  badgeImageUrl?: string
}

/**
 * Generate a certificate SVG template based on provided data
 */
export const generateCertificateSvg = (data: CertificateData): string => {
  const {
    recipientName,
    achievementName,
    issuerName,
    issueDate,
    credentialId,
    badgeImageUrl
  } = data

  // Format date nicely
  const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Badge image with fallback
  const badgeImage = badgeImageUrl
    ? `<image href="${badgeImageUrl}" x="350" y="100" width="100" height="100" />`
    : `<circle cx="400" cy="160" r="50" fill="#ffd700" /><text x="400" y="170" text-anchor="middle" font-size="40" font-weight="bold" fill="#333">🏆</text>`

  // Generate the SVG
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="650" viewBox="0 0 800 650" xmlns="http://www.w3.org/2000/svg">
  <!-- Certificate Background -->
  <rect x="0" y="0" width="800" height="600" fill="#f9f9f9" />
  
  <!-- Decorative Border -->
  <rect x="20" y="20" width="760" height="560" fill="none" stroke="#d4af37" stroke-width="3" />
  <rect x="25" y="25" width="750" height="550" fill="none" stroke="#d4af37" stroke-width="1" />
  
  <!-- Corner Ornaments -->
  <path d="M20,20 C50,40 40,50 20,50 Z" fill="#d4af37" />
  <path d="M780,20 C750,40 760,50 780,50 Z" fill="#d4af37" />
  <path d="M20,580 C50,560 40,550 20,550 Z" fill="#d4af37" />
  <path d="M780,580 C750,560 760,550 780,550 Z" fill="#d4af37" />
  
  <!-- Certificate Title -->
  <text x="400" y="90" font-family="'Georgia', serif" font-size="36" font-weight="bold" text-anchor="middle" fill="#333">Certificate of Achievement</text>
  
  <!-- Badge Image / Logo -->
  ${badgeImage}
  
  <!-- Main Text -->
  <text x="400" y="210" font-family="'Georgia', serif" font-size="16" text-anchor="middle" fill="#555">This is to certify that</text>
  
  <!-- Recipient Name -->
  <text x="400" y="260" font-family="'Georgia', serif" font-size="32" font-weight="bold" text-anchor="middle" fill="#333">${escapeXml(recipientName)}</text>
  
  <!-- Achievement Description -->
  <text x="400" y="310" font-family="'Georgia', serif" font-size="16" text-anchor="middle" fill="#555">has successfully completed</text>
  
  <!-- Achievement Name -->
  <text x="400" y="360" font-family="'Georgia', serif" font-size="28" font-weight="bold" text-anchor="middle" fill="#333">${escapeXml(achievementName)}</text>
  
  <!-- Issuer Info -->
  <text x="400" y="430" font-family="'Georgia', serif" font-size="16" text-anchor="middle" fill="#555">Issued by</text>
  <text x="400" y="460" font-family="'Georgia', serif" font-size="22" font-weight="bold" text-anchor="middle" fill="#333">${escapeXml(issuerName)}</text>
  
  <!-- Date -->
  <text x="400" y="510" font-family="'Georgia', serif" font-size="16" text-anchor="middle" fill="#555">on ${formattedDate}</text>
  
  <!-- Signature Line -->
  <line x1="250" y1="460" x2="550" y2="460" stroke="#333" stroke-width="1" />
  <text x="400" y="500" font-family="'Georgia', serif" font-size="16" text-anchor="middle" fill="#555">Authorized Signature</text>
  <text x="400" y="560" font-size="14" fill="#888" text-anchor="middle">Credential ID: ${escapeXml(credentialId)}</text>
</svg>`
}

/**
 * Escape XML special characters to prevent SVG injection attacks
 */
const escapeXml = (unsafe: string): string => {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
} 