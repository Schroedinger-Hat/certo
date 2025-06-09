'use client'

import { useState } from 'react'
import { apiClient } from '@/api/api-client'

interface ImportCertificateProps {
  onImport: () => void
}

export default function ImportCertificate({ onImport }: ImportCertificateProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      // Read the file contents
      const fileContents = await readFileAsText(file)
      
      // Parse the file contents as JSON
      let certificateData
      try {
        certificateData = JSON.parse(fileContents)
      } catch (e) {
        throw new Error('Invalid JSON file. Please upload a valid certificate file.')
      }
      
      // Import the certificate
      await apiClient.importCertificate(certificateData)
      
      // Reset the form
      setFile(null)
      
      // Notify parent component
      onImport()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import certificate')
    } finally {
      setIsImporting(false)
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      reader.readAsText(file)
    })
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-medium mb-4">Import Certificate</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Certificate File (JSON)
        </label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Please upload a valid certificate JSON file
        </p>
      </div>
      
      <button
        onClick={handleImport}
        disabled={!file || isImporting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
      >
        {isImporting ? 'Importing...' : 'Import Certificate'}
      </button>
    </div>
  )
} 