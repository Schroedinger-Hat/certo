import { Suspense } from 'react'
import CredentialClient from './client'

export default async function CredentialPage({ params }: { params: { id: string } }) {
  // Await params before using its properties
  const { id } = await params
  
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        Credential Details
      </h1>
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <CredentialClient id={id} />
      </Suspense>
    </div>
  )
} 