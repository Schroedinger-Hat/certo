<script setup>
defineOptions({
  name: 'CertificateCard'
})

import { ref, computed } from 'vue'
import { apiClient } from '~/api/api-client'
import { useRuntimeConfig } from '#app'

const props = defineProps({
  certificate: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['export', 'revoke', 'view', 'download'])

const isRevoking = ref(false)
const revocationReason = ref('')
const isExporting = ref(false)

// Extract properties from the certificate with fallbacks for different data structures
const { 
  id,
  credentialId,
  achievement,
  issuer,
  recipient,
  issuanceDate,
  issuedOn,
  expirationDate,
  expires,
  revoked,
  image,
  description
} = props.certificate

// Get derived values with fallbacks
const achievementName = achievement?.name || props.certificate.name || 'Unknown Achievement'
const achievementDescription = description || achievement?.description || props.certificate.description || 'No description available'
const issuerName = issuer?.name || props.certificate.issuerName || 'Unknown Issuer'
const formattedIssuanceDate = formatDate(issuanceDate || issuedOn)
const formattedExpirationDate = expirationDate || expires ? formatDate(expirationDate || expires) : 'No expiration'

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return 'Unknown'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

// Get the certificate image URL from the API
const imageUrl = computed(() => {
  const runtimeConfig = useRuntimeConfig()
  const apiUrl = runtimeConfig.public.apiUrl || 'http://localhost:1337'
  
  // Try different possible image structures
  if (props.certificate.imageUrl) {
    return props.certificate.imageUrl.startsWith('http') 
      ? props.certificate.imageUrl 
      : `${apiUrl}${props.certificate.imageUrl}`
  }
  
  if (image?.url) {
    return image.url.startsWith('http') 
      ? image.url 
      : `${apiUrl}${image.url}`
  }
  
  if (achievement?.image?.url) {
    return achievement.image.url.startsWith('http') 
      ? achievement.image.url 
      : `${apiUrl}${achievement.image.url}`
  }
  
  if (achievement?.image?.data?.attributes?.url) {
    return `${apiUrl}${achievement.image.data.attributes.url}`
  }
  
  if (props.certificate.attributes?.image?.data?.attributes?.url) {
    return `${apiUrl}${props.certificate.attributes.image.data.attributes.url}`
  }
  
  if (props.certificate.attributes?.achievement?.data?.attributes?.image?.data?.attributes?.url) {
    return `${apiUrl}${props.certificate.attributes.achievement.data.attributes.image.data.attributes.url}`
  }
  
  // Fallback to credential certificate endpoint
  return `${apiUrl}/api/credentials/${id}/certificate`
})

async function handleExport() {
  isExporting.value = true
  try {
    const exportData = await apiClient.exportCertificate(id)
    if (process.client) {
      // Create a download link for the exported certificate
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    
    emit('export')
  } catch (error) {
    console.error('Error exporting certificate:', error)
  } finally {
    isExporting.value = false
  }
}

async function handleRevoke() {
  if (!revocationReason.value.trim()) return
  
  isRevoking.value = true
  try {
    await apiClient.revokeCertificate(id, revocationReason.value)
    emit('revoke')
  } catch (error) {
    console.error('Error revoking certificate:', error)
  } finally {
    isRevoking.value = false
    revocationReason.value = ''
  }
}

function getCredentialUrl() {
  // Use the browser's window.location to get the base URL
  const baseUrl = process.client 
    ? `${window.location.protocol}//${window.location.host}`
    : ''
  return `${baseUrl}/credentials/${encodeURIComponent(credentialId || id)}`
}

function getVerificationUrl() {
  // Use the browser's window.location to get the base URL
  const baseUrl = process.client 
    ? `${window.location.protocol}//${window.location.host}`
    : ''
  return `${baseUrl}/verify?id=${encodeURIComponent(credentialId || id)}`
}

function copyToClipboard() {
  if (!process.client) return
  
  try {
    navigator.clipboard.writeText(getVerificationUrl())
    // Use the Una UI toast/notification instead of alert
    alert('Verification URL copied to clipboard')
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    alert('Failed to copy to clipboard')
  }
}
</script>

<template>
  <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <!-- Certificate Icon -->
        <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-lg flex items-center justify-center mb-4">
          <div class="w-6 h-6 i-heroicons-document-text text-[#00E5C5]"></div>
        </div>

        <!-- Certificate Info -->
        <h3 class="text-lg font-medium text-text-primary mb-1">{{ achievementName }}</h3>
        <p class="text-text-secondary text-sm mb-4">{{ achievementDescription }}</p>

        <!-- Metadata -->
        <div class="space-y-2">
          <div class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-calendar mr-2"></div>
            {{ formattedIssuanceDate }}
          </div>
          <div class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-user mr-2"></div>
            {{ issuerName }}
          </div>
          <div class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-building-office mr-2"></div>
            {{ recipient?.name || 'Unknown Recipient' }}
          </div>
        </div>
      </div>

      <!-- Status Badge -->
      <span 
        class="px-2 py-1 text-xs font-semibold rounded-full"
        :class="{
          'bg-green-100 text-green-800': !revoked,
          'bg-yellow-100 text-yellow-800': !revoked,
          'bg-red-100 text-red-800': revoked
        }"
      >
        {{ revoked ? 'Revoked' : 'Valid' }}
      </span>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex items-center justify-end space-x-4">
      <NuxtLink
        :to="`/credentials/${encodeURIComponent(credentialId || id)}`"
        class="text-[#00E5C5] hover:text-[#00E5C5]/80 text-sm font-medium"
      >
        View Details
      </NuxtLink>
      <button 
        @click="$emit('download', certificate)"
        class="text-[#00E5C5] hover:text-[#00E5C5]/80 text-sm font-medium"
      >
        Download
      </button>
      <button 
        v-if="revoked"
        @click="$emit('revoke', certificate)"
        class="text-red-500 hover:text-red-600 text-sm font-medium"
      >
        Revoke
      </button>
    </div>
  </div>
</template>