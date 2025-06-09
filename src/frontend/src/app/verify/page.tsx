'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import BadgeVerifier from '@/components/BadgeVerifier'

function VerifyPageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || ''

  return (
    <div className="max-w-4xl mx-auto">
      <BadgeVerifier initialIdentifier={id} />
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        Open Badge Verification
      </h1>
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <VerifyPageContent />
      </Suspense>
    </div>
  )
} 