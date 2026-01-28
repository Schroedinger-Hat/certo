import React from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import type { Handler } from '@netlify/functions'

// Fetch credential data from the API
async function fetchCredential(id: string) {
  const apiUrl = process.env.CERTO_API_URL || process.env.NUXT_PUBLIC_API_URL || 'https://api.certo.schroedinger-hat.org'
  
  try {
    // Try to fetch verification data which includes credential details
    const verifyUrl = `${apiUrl}/api/credentials/${encodeURIComponent(id)}/verify`
    const res = await fetch(verifyUrl)
    
    if (!res.ok) {
      throw new Error('Credential not found')
    }
    
    const data = await res.json()
    const credential = data?.credential || data?.rawCredential || data
    
    // Extract issuer name from various possible structures
    const issuerName = credential?.issuer?.name 
      || data?.rawCredential?.issuer?.name
      || 'Certo'
    
    // Extract image URL from various possible structures
    const imageUrl = credential?.credentialSubject?.achievement?.image?.id
      || data?.rawCredential?.achievement?.image?.url
      || data?.rawCredential?.achievement?.image?.formats?.medium?.url
      || null
    
    // Get verification status
    const isVerified = data?.verified === true
    
    return {
      name: credential?.name || credential?.title || 'Digital Credential',
      issuer: issuerName,
      image: imageUrl,
      description: credential?.description || 'A verifiable digital credential issued using the Open Badges standard.',
      verified: isVerified,
      issuanceDate: credential?.issuanceDate || null,
      recipientName: data?.rawCredential?.recipient?.name || null
    }
  } catch (error) {
    console.error('Error fetching credential:', error)
    throw error
  }
}

// Truncate text to a maximum length
function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || ''
  return text.substring(0, maxLength - 3) + '...'
}

// Format date for display
function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export const handler: Handler = async (event) => {
  const id = event.queryStringParameters?.id
  
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Credential ID is required' })
    }
  }

  let credential
  try {
    credential = await fetchCredential(id)
  } catch (e) {
    // Return a default/error image for invalid credentials
    credential = {
      name: 'Credential Not Found',
      issuer: 'Certo',
      image: null,
      description: 'This credential could not be found or verified.',
      verified: false,
      issuanceDate: null,
      recipientName: null
    }
  }

  // Generate SVG using satori
  const svg = await satori(
    <div style={{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'row',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'rgba(0, 229, 197, 0.1)',
        display: 'flex'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(0, 229, 197, 0.05)',
        display: 'flex'
      }} />
      
      {/* Left side - Badge image area */}
      <div style={{
        width: '380px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'linear-gradient(180deg, #00E5C5 0%, #00C4A7 100%)',
      }}>
        {/* Badge placeholder or image */}
        <div style={{
          width: '220px',
          height: '220px',
          borderRadius: '24px',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }}>
          {credential.image ? (
            <img 
              src={credential.image} 
              width={200} 
              height={200} 
              style={{ 
                objectFit: 'contain',
                borderRadius: '16px'
              }} 
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00E5C5'
            }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 15l-2 5l5-3l5 3l-2-5m-6-3a6 6 0 1 1 0-12a6 6 0 0 1 0 12z"/>
              </svg>
            </div>
          )}
        </div>
        
        {/* Verification badge */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '20px',
          background: credential.verified ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)',
          color: credential.verified ? '#059669' : '#6b7280'
        }}>
          {credential.verified ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 12l2 2l4-4"/>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4m0 4h.01"/>
            </svg>
          )}
          <span style={{ fontSize: '16px', fontWeight: 600 }}>
            {credential.verified ? 'Verified' : 'Unverified'}
          </span>
        </div>
      </div>
      
      {/* Right side - Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '50px 60px',
        position: 'relative'
      }}>
        {/* Credential name */}
        <h1 style={{
          fontSize: credential.name.length > 40 ? '42px' : '52px',
          fontWeight: 700,
          color: '#1e293b',
          margin: '0 0 16px 0',
          lineHeight: 1.2,
          maxWidth: '680px'
        }}>
          {truncateText(credential.name, 80)}
        </h1>
        
        {/* Issuer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '24px', color: '#64748b' }}>Issued by</span>
          <span style={{ fontSize: '24px', fontWeight: 600, color: '#00C4A7' }}>
            {truncateText(credential.issuer, 40)}
          </span>
        </div>
        
        {/* Recipient name if available */}
        {credential.recipientName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '20px', color: '#64748b' }}>Awarded to</span>
            <span style={{ fontSize: '20px', fontWeight: 500, color: '#334155' }}>
              {truncateText(credential.recipientName, 40)}
            </span>
          </div>
        )}
        
        {/* Issuance date if available */}
        {credential.issuanceDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontSize: '18px', color: '#64748b' }}>
              {formatDate(credential.issuanceDate)}
            </span>
          </div>
        )}
        
        {/* Description */}
        <p style={{
          fontSize: '20px',
          color: '#64748b',
          margin: '0',
          lineHeight: 1.5,
          maxWidth: '620px'
        }}>
          {truncateText(credential.description, 150)}
        </p>
        
        {/* Footer with branding */}
        <div style={{
          position: 'absolute',
          bottom: '40px',
          right: '60px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#00E5C5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '20px' }}>C</span>
          </div>
          <span style={{ fontSize: '22px', fontWeight: 600, color: '#475569' }}>
            certo.schroedinger-hat.org
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630
    }
  )

  // Convert SVG to PNG using resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200
    }
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'CDN-Cache-Control': 'public, max-age=86400'
    },
    body: pngBuffer.toString('base64'),
    isBase64Encoded: true
  }
} 