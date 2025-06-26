import React from 'react'
import satori from 'satori'
import type { Handler } from '@netlify/functions'

// Real API call to fetch credential data
async function fetchCredential(id: string) {
  // Replace with your real backend API endpoint
  const apiUrl = process.env.CERTO_API_URL || 'https://certo.schroedinger-hat.org/api/credentials/'
  const res = await fetch(`${apiUrl}${encodeURIComponent(id)}`)
  if (!res.ok) throw new Error('Credential not found')
  const data = await res.json()
  // Adapt to your API response structure
  return {
    name: data?.name || 'Open Badges Credential',
    issuer: data?.issuer?.name || 'Certo',
    image: data?.image || 'https://certo.schroedinger-hat.org/og-default.png',
    description: data?.description || 'A verifiable digital credential issued using the Open Badges standard.'
  }
}

export const handler: Handler = async (event, context) => {
  const id = event.queryStringParameters?.id || 'demo'
  let credential
  try {
    credential = await fetchCredential(id)
  } catch (e) {
    credential = {
      name: 'Open Badges Credential',
      issuer: 'Certo',
      image: 'https://certo.schroedinger-hat.org/og-default.png',
      description: 'A verifiable digital credential issued using the Open Badges standard.'
    }
  }

  const svg = await satori(
    <div style={{
      width: '1200px',
      height: '630px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      border: '8px solid #00E5C5',
      fontFamily: 'sans-serif',
      color: '#222',
      padding: '40px',
      position: 'relative'
    }}>
      <img src={credential.image} width={180} height={180} style={{ borderRadius: '24px', marginBottom: '32px', border: '4px solid #00E5C5' }} />
      <h1 style={{ fontSize: '56px', fontWeight: 700, margin: '0 0 24px 0', textAlign: 'center' }}>{credential.name}</h1>
      <h2 style={{ fontSize: '32px', fontWeight: 400, color: '#00E5C5', margin: 0 }}>Issued by {credential.issuer}</h2>
      <p style={{ fontSize: '28px', color: '#666', marginTop: '32px', textAlign: 'center', maxWidth: '900px' }}>{credential.description}</p>
      <div style={{ position: 'absolute', bottom: 40, right: 60, fontSize: '28px', color: '#00E5C5', fontWeight: 700 }}>certo.schroedinger-hat.org</div>
    </div>,
    {
      width: 1200,
      height: 630
    }
  )

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    },
    body: svg
  }
} 