'use client'

import { useEffect, useState } from 'react'
import { BadgeVerifier } from '@/components/BadgeVerifier'

export default function CredentialClient({ id }: { id: string }) {
  // Decode the URL parameter to handle any encoded characters
  const [decodedId, setDecodedId] = useState<string>(id)
  
  useEffect(() => {
    try {
      // Decode the URL parameter to properly handle special characters like %
      const decoded = decodeURIComponent(id)
      setDecodedId(decoded)
    } catch (error) {
      console.error('Error decoding credential ID:', error)
      // Fallback to original ID if decoding fails
      setDecodedId(id)
    }
  }, [id])
  
  return (
    <div className="max-w-4xl mx-auto">
      <BadgeVerifier initialIdentifier={decodedId} autoVerify={true} />
    </div>
  )
} 