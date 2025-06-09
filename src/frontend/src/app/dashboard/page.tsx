'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthContext'
import CertificateCard from '@/components/certificates/CertificateCard'
import { apiClient } from '@/api/api-client'
import { useRouter } from 'next/navigation'

interface Certificate {
  id: string | number
  attributes: {
    name: string
    credentialId: string
    issuanceDate: string
    expirationDate?: string
    revoked: boolean
    image?: {
      data?: {
        attributes?: {
          url: string
        }
      }
    }
    achievement?: {
      data?: {
        attributes?: {
          name: string
          description?: string
        }
      }
    }
    issuer?: {
      data?: {
        attributes?: {
          name: string
        }
      }
    }
  }
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

      setCertificates(response.data || [])
    } catch (err) {
      console.error('Error fetching certificates:', err)
      setError('Failed to load certificates. Please make sure the backend is properly configured.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCertificate = async (id: string | number) => {
    try {
      await apiClient.delete(`/api/credentials/${id}`)
      // Refresh the list
      fetchCertificates()
    } catch (error) {
      console.error('Error deleting certificate:', error)
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
              onDelete={() => handleDeleteCertificate(certificate.id)}
              onRevoke={activeTab === 'issued' ? () => fetchCertificates() : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
} 