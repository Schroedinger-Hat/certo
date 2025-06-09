'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthContext'
import CertificateCard from '@/components/certificates/CertificateCard'
import { apiClient } from '@/api/api-client'
import { useRouter } from 'next/navigation'

// Update to match the Certificate type in CertificateCard component
interface Certificate {
  id: number
  documentId: string
  credentialId: string
  type: string[]
  name: string
  description: string
  issuanceDate: string
  expirationDate?: string
  narrative?: string | null
  revoked: boolean
  revocationReason?: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  locale: string | null
  issuer: {
    id: number
    documentId: string
    name: string
    email: string | null
    url: string | null
    telephone: string | null
    description: string | null
    profileType: string
    did: string | null
    createdAt: string
    updatedAt: string
    publishedAt: string | null
    locale: string | null
  }
  achievement: {
    id: number
    documentId: string
    name: string
    description: string
    achievementType: string
    tags: string[]
    achievementId: string
    createdAt: string
    updatedAt: string
    publishedAt: string | null
    locale: string | null
  }
  image?: {
    url: string
  }
}

// API response format might be different, this is for handling the API response
interface ApiCertificate {
  id: string | number
  attributes: any
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCertificates()
    }
  }, [isAuthenticated, activeTab])

  const fetchCertificates = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let response

      if (activeTab === 'received') {
        response = await apiClient.getReceivedCertificates()
      } else if (activeTab === 'issued') {
        response = await apiClient.getIssuedCertificates()
      } else {
        response = await apiClient.getUserCertificates()
      }

      // Transform the data to match the Certificate interface
      const transformedCertificates = response.data.map((cert: ApiCertificate) => {
        // The API might return data in a different format, so this is a placeholder transformation
        // Adjust according to your actual API response structure
        return {
          id: cert.id,
          ...cert.attributes
        } as Certificate
      })

      setCertificates(transformedCertificates || [])
    } catch (err) {
      console.error('Error fetching certificates:', err)
      setError('Failed to load certificates. Please make sure the backend is properly configured.')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Certificates</h1>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('received')}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'received'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Received
          </button>
          <button
            onClick={() => setActiveTab('issued')}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'issued'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Issued
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading certificates...</div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : certificates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {activeTab === 'received'
              ? "You haven't received any certificates yet."
              : activeTab === 'issued'
              ? "You haven't issued any certificates yet."
              : "You don't have any certificates yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onExport={() => console.log('Certificate exported')}
              onRevoke={activeTab === 'issued' ? () => fetchCertificates() : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
} 