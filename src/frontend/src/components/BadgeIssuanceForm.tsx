'use client'

import { useState, useEffect } from 'react'
import apiClient from '../api/api-client'
import { Badge, Issuer } from '../types/strapi'
import Image from 'next/image'

interface BadgeIssuanceFormProps {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

const BadgeIssuanceForm = ({ onSuccess, onError }: BadgeIssuanceFormProps) => {
  const [badges, setBadges] = useState<Badge[]>([])
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null)
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [evidenceItems, setEvidenceItems] = useState<{ name: string; description: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingBadges, setLoadingBadges] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailSent, setEmailSent] = useState<boolean | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await apiClient.getBadges({ 'populate': '*' })
        if (response.data) {
          setBadges(response.data as unknown as Badge[])
        }
      } catch (err) {
        console.error('Error fetching badges:', err)
        setError('Failed to load badges')
      } finally {
        setLoadingBadges(false)
      }
    }

    fetchBadges()
  }, [])

  const handleAddEvidence = () => {
    setEvidenceItems([...evidenceItems, { name: '', description: '' }])
  }

  const handleEvidenceChange = (index: number, field: 'name' | 'description', value: string) => {
    const newEvidenceItems = [...evidenceItems]
    newEvidenceItems[index][field] = value
    setEvidenceItems(newEvidenceItems)
  }

  const handleRemoveEvidence = (index: number) => {
    const newEvidenceItems = [...evidenceItems]
    newEvidenceItems.splice(index, 1)
    setEvidenceItems(newEvidenceItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedBadgeId) {
      setError('Please select a badge')
      return
    }
    
    if (!recipientName.trim() || !recipientEmail.trim()) {
      setError('Recipient name and email are required')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    setEmailSent(null)
    setEmailError(null)
    
    try {
      const result = await apiClient.issueBadge(
        selectedBadgeId,
        {
          name: recipientName,
          email: recipientEmail
        },
        evidenceItems.map(item => ({
          name: item.name,
          description: item.description
        }))
      )
      
      setSuccess(true)
      if (result.notification) {
        setEmailSent(result.notification.emailSent)
        setEmailError(result.notification.emailError)
      }
      
      setSelectedBadgeId(null)
      setRecipientName('')
      setRecipientEmail('')
      setEvidenceItems([])
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err: any) {
      console.error('Error issuing badge:', err)
      setError(err?.message || 'Failed to issue badge')
      
      if (onError) {
        onError(err)
      }
    } finally {
      setLoading(false)
    }
  }
  
  const selectedBadge = badges.find(badge => badge.id === selectedBadgeId)

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Issue Open Badge</h2>
      
      {loadingBadges ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md">{error}</div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-md">
              <p className="font-medium">Badge issued successfully!</p>
              {emailSent === true && (
                <p className="text-sm mt-1">✓ Notification email sent to {recipientEmail}</p>
              )}
              {emailSent === false && (
                <div className="mt-1">
                  <p className="text-sm text-amber-600">
                    ⚠️ Notification email could not be sent to the recipient.
                  </p>
                  {emailError && (
                    <p className="text-xs text-amber-700 mt-1">{emailError}</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div>
            <label htmlFor="badge" className="block text-sm font-medium text-gray-700 mb-1">
              Select Badge
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {badges.map(badge => (
                <div 
                  key={badge.id}
                  onClick={() => setSelectedBadgeId(badge.id)}
                  className={`
                    border rounded-lg p-2 cursor-pointer transition-all
                    ${selectedBadgeId === badge.id 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="aspect-square relative w-full mb-2">
                    {badge.image && (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}${badge.image.url}`}
                        alt={badge.name}
                        fill
                        unoptimized
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="text-center text-sm font-medium truncate">
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {selectedBadge && (
            <div className="p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium">{selectedBadge.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedBadge.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Name
              </label>
              <input
                id="recipientName"
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Email
              </label>
              <input
                id="recipientEmail"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Evidence (Optional)
              </label>
              <button
                type="button"
                onClick={handleAddEvidence}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Evidence
              </button>
            </div>
            
            {evidenceItems.map((item, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-md mb-3">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Evidence #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEvidence(index)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleEvidenceChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Description
                    </label>
                    <textarea
                      value={item.description}
                      onChange={(e) => handleEvidenceChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !selectedBadgeId}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Issuing Badge...' : 'Issue Badge'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default BadgeIssuanceForm 