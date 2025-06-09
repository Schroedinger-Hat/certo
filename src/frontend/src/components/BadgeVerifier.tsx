'use client'

import { useState, useEffect } from 'react'
import { AchievementCredential, VerificationResult, VerificationCheck } from '../types/openbadges'
import apiClient from '../api/api-client'
import Image from 'next/image'

interface BadgeVerifierProps {
  initialIdentifier?: string
  autoVerify?: boolean
}

export const BadgeVerifier: React.FC<BadgeVerifierProps> = ({
  initialIdentifier = '',
  autoVerify = false,
}) => {
  const [identifier, setIdentifier] = useState(initialIdentifier)
  const [badge, setBadge] = useState<AchievementCredential | null>(null)
  const [rawCredential, setRawCredential] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [verificationChecks, setVerificationChecks] = useState<VerificationCheck[] | null>(null)
  const [jsonInput, setJsonInput] = useState<string>('')
  const [verifyMode, setVerifyMode] = useState<'id' | 'json'>('id')

  // Auto-verify on mount if autoVerify is true and initialIdentifier is provided
  useEffect(() => {
    if (autoVerify && initialIdentifier) {
      verifyById()
    }
  }, [autoVerify, initialIdentifier])

  // Update identifier when initialIdentifier prop changes
  useEffect(() => {
    setIdentifier(initialIdentifier)
  }, [initialIdentifier])

  const handleVerify = async () => {
    if (verifyMode === 'id') {
      await verifyById()
    } else {
      await verifyByJson()
    }
  }

  const verifyById = async () => {
    if (!identifier.trim()) {
      setError('Please enter a credential identifier')
      return
    }

    setLoading(true)
    setError(null)
    setBadge(null)
    setRawCredential(null)
    setIsVerified(null)
    setVerificationChecks(null)

    try {
      const result = await apiClient.verifyBadge(identifier)
      setIsVerified(result.verified)
      setBadge(result.credential || null)
      setRawCredential(result.rawCredential || null)
      setVerificationChecks(result.checks || null)
      
      if (!result.verified && result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error verifying badge:', err)
      setError('Failed to verify badge. Please check the identifier and try again.')
      setIsVerified(false)
    } finally {
      setLoading(false)
    }
  }

  const verifyByJson = async () => {
    if (!jsonInput.trim()) {
      setError('Please enter credential JSON')
      return
    }

    setLoading(true)
    setError(null)
    setBadge(null)
    setRawCredential(null)
    setIsVerified(null)
    setVerificationChecks(null)

    try {
      // Parse the JSON input
      let credentialData
      try {
        credentialData = JSON.parse(jsonInput)
      } catch (e) {
        throw new Error('Invalid JSON format. Please check your input.')
      }

      // Validate the credential
      const result = await apiClient.validateExternalBadge(credentialData)
      setIsVerified(result.verified)
      setBadge(result.credential || null)
      setRawCredential(result.rawCredential || null)
      setVerificationChecks(result.checks || null)
      
      if (!result.verified && result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error validating badge:', err)
      setError(err instanceof Error ? err.message : 'Failed to validate badge.')
      setIsVerified(false)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!badge) return

    // Create share data
    const shareData = {
      title: `${badge.name || 'Achievement Badge'}`,
      text: `Check out my badge: ${badge.name}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard')
      }
    } catch (err) {
      console.error('Error sharing:', err)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
      {!autoVerify && (
        <>
          <h2 className="text-2xl font-bold mb-4">Verify Open Badge</h2>
          
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setVerifyMode('id')}
                className={`px-4 py-2 rounded-md ${
                  verifyMode === 'id' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Verify by ID
              </button>
              <button
                onClick={() => setVerifyMode('json')}
                className={`px-4 py-2 rounded-md ${
                  verifyMode === 'json' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Verify JSON
              </button>
            </div>

            {verifyMode === 'id' ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter credential identifier"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste credential JSON here"
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify JSON'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {loading && <div className="text-center py-4">Verifying credential...</div>}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
      )}

      {verificationChecks && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <h3 className="font-semibold mb-2">Verification Checks</h3>
          <ul className="space-y-1">
            {verificationChecks.map((check, index) => (
              <li key={index} className="flex items-center">
                {check.result === 'success' ? (
                  <span className="text-green-600 mr-2">✓</span>
                ) : check.result === 'warning' ? (
                  <span className="text-yellow-600 mr-2">⚠</span>
                ) : (
                  <span className="text-red-600 mr-2">✗</span>
                )}
                <span className="capitalize">{check.check}</span>
                {check.message && <span className="ml-2 text-sm text-gray-500">({check.message})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isVerified === false && !error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          Badge verification failed
        </div>
      )}

      {badge && (
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex flex-col md:flex-row gap-6">
            {badge.image && (
              <div className="w-full md:w-1/3 flex-shrink-0">
                <div className="relative aspect-square w-full">
                  <Image
                    src={badge.image.id}
                    alt={badge.name || 'Badge image'}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center mb-4">
                <h3 className="text-xl font-semibold mr-2">{badge.name}</h3>
                {isVerified ? (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    ✗ Not Verified
                  </span>
                )}
              </div>
              
              <p className="text-gray-700 mb-4">{badge.description}</p>
              
              {/* Credential details section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Issued By</h4>
                  <p className="font-medium">{badge.issuer.name}</p>
                  {badge.issuer.url && (
                    <a 
                      href={badge.issuer.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      {badge.issuer.url}
                    </a>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Credential ID</h4>
                  <p className="text-sm font-mono overflow-hidden text-ellipsis">{rawCredential?.credentialId || badge.id}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Recipient</h4>
                  <p className="font-medium">{badge.recipient?.name || rawCredential?.recipient?.name || 'Not specified'}</p>
                  {(badge.recipient?.email || rawCredential?.recipient?.email) && (
                    <p className="text-sm text-gray-600">{badge.recipient?.email || rawCredential?.recipient?.email}</p>
                  )}
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-1">Issuance Date</h4>
                  <p>{new Date(badge.issuanceDate).toLocaleDateString()}</p>
                </div>
                
                {badge.expirationDate && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-1">Expiration Date</h4>
                    <p>{new Date(badge.expirationDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              {/* Certificate section */}
              {rawCredential?.id && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-semibold mb-2">Certificate</h4>
                  <div className="mt-2 flex flex-col items-center">
                    <div className="relative w-full max-w-md aspect-[4/3] border border-gray-200 rounded-md overflow-hidden mb-3">
                      <Image 
                        src={apiClient.getCertificateUrl(rawCredential.id)}
                        alt="Achievement Certificate"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <a 
                      href={apiClient.getCertificateUrl(rawCredential.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Download Certificate
                    </a>
                  </div>
                </div>
              )}
              
              {/* Achievement data section */}
              {rawCredential?.achievement && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-semibold mb-2">Achievement Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-500 mb-1">Achievement Name</h5>
                      <p>{rawCredential.achievement.name}</p>
                    </div>
                    
                    {rawCredential.achievement.description && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-500 mb-1">Description</h5>
                        <p className="text-sm">{rawCredential.achievement.description}</p>
                      </div>
                    )}
                    
                    {rawCredential.achievement.criteria && (
                      <div className="col-span-2">
                        <h5 className="text-sm font-semibold text-gray-500 mb-1">Criteria</h5>
                        <p className="text-sm">{rawCredential.achievement.criteria.narrative}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Evidence section */}
              {rawCredential?.evidence && rawCredential.evidence.length > 0 && (
                <div className="border-t border-gray-200 pt-4 mb-4">
                  <h4 className="font-semibold mb-2">Evidence</h4>
                  <div className="space-y-2">
                    {rawCredential.evidence.map((item: any, i: number) => (
                      <div key={i} className="bg-white p-2 rounded border border-gray-200">
                        <p className="font-medium">{item.name}</p>
                        {item.description && <p className="text-sm text-gray-700">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={handleShare}
                className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Share this Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BadgeVerifier 