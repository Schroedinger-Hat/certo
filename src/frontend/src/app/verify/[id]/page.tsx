import { Suspense } from 'react'
import VerifyClient from './client'

export default function VerifyPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        Open Badge Verification
      </h1>
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <VerifyClient id={params.id} />
      </Suspense>
    </div>
  )
} 