'use client'

import Image from 'next/image'
import { useState } from 'react'
import { apiClient } from '@/api/api-client'
import Link from 'next/link'

interface CertificateCardProps {
  certificate: {
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
  onExport?: () => void
  onDelete?: () => void
  onRevoke?: () => void
}

export default function CertificateCard({ 
  certificate, 
  onExport, 
  onDelete, 
  onRevoke 
}: CertificateCardProps) {
  const [isRevoking, setIsRevoking] = useState(false)
  const [revocationReason, setRevocationReason] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const { 
    name, 
    credentialId, 
    issuanceDate, 
    expirationDate,
    revoked,
    image,
    achievement,
    issuer
  } = certificate.attributes

  const achievementName = achievement?.data?.attributes?.name || 'Unknown Achievement'
  const achievementDescription = achievement?.data?.attributes?.description || 'No description available'
  const issuerName = issuer?.data?.attributes?.name || 'Unknown Issuer'
  const imageUrl = image?.data?.attributes?.url || '/placeholder-badge.png'
  
  const formattedIssuanceDate = new Date(issuanceDate).toLocaleDateString()
  const formattedExpirationDate = expirationDate 
    ? new Date(expirationDate).toLocaleDateString() 
    : 'No expiration'

  const handleExport = async () => {
    if (!onExport) return
    
    setIsExporting(true)
    try {
      const exportData = await apiClient.exportCertificate(certificate.id)
      // Create a download link for the exported certificate
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${certificate.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      onExport()
    } catch (error) {
      console.error('Error exporting certificate:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleRevoke = async () => {
    if (!onRevoke || !revocationReason.trim()) return
    
    setIsRevoking(true)
    try {
      await apiClient.revokeCertificate(certificate.id, revocationReason)
      onRevoke()
    } catch (error) {
      console.error('Error revoking certificate:', error)
    } finally {
      setIsRevoking(false)
      setRevocationReason('')
    }
  }

  const getVerificationUrl = () => {
    // Use the browser's window.location to get the base URL
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}`
      : ''
    return `${baseUrl}/verify?id=${encodeURIComponent(credentialId)}`
  }

  return (
    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 relative">
              <Image
                src={imageUrl}
                alt={name}
                fill
                className="rounded-md object-cover"
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">{name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{achievementName}</p>
            </div>
          </div>
          
          {revoked && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
              Revoked
            </span>
          )}
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">{achievementDescription}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div>
            <span className="font-medium">Issued by:</span>
            <p className="text-gray-600 dark:text-gray-400">{issuerName}</p>
          </div>
          <div>
            <span className="font-medium">Issued on:</span>
            <p className="text-gray-600 dark:text-gray-400">{formattedIssuanceDate}</p>
          </div>
          <div>
            <span className="font-medium">Expires:</span>
            <p className="text-gray-600 dark:text-gray-400">{formattedExpirationDate}</p>
          </div>
          <div>
            <span className="font-medium">ID:</span>
            <p className="text-gray-600 dark:text-gray-400 truncate">{credentialId}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Link 
            href={`/verify?id=${encodeURIComponent(credentialId)}`}
            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md transition"
          >
            Verify
          </Link>

          {onExport && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition"
            >
              Delete
            </button>
          )}

          <button
            onClick={() => {
              // Copy verification URL to clipboard
              navigator.clipboard.writeText(getVerificationUrl())
              alert('Verification URL copied to clipboard')
            }}
            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-md transition"
          >
            Copy Link
          </button>
          
          {onRevoke && !revoked && (
            <div className="w-full mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  placeholder="Reason for revocation"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md"
                />
                <button
                  onClick={handleRevoke}
                  disabled={isRevoking || !revocationReason.trim()}
                  className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-md transition disabled:opacity-50"
                >
                  {isRevoking ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 