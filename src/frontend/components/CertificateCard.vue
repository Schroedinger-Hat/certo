<script setup lang="ts">
defineOptions({
  name: 'CertificateCard'
})

import { ref, computed } from 'vue'
import { apiClient } from '~/api/api-client'
import { useRuntimeConfig } from '#app'
import { useSimpleToast } from '~/composables/useSimpleToast'

const props = defineProps({
  certificate: {
    type: Object,
    required: true
  },
  showRecipient: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['export', 'revoke', 'view', 'download'])

const isMenuOpen = ref(false)
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
function formatDate(dateString: string) {
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
  const apiUrl = runtimeConfig.public.apiUrl
  
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

const toast = useSimpleToast()

function copyToClipboard() {
  if (!process.client) return
  try {
    const fullUrl = `${window.location.origin}/credentials/${encodeURIComponent(credentialId || id)}`
    navigator.clipboard.writeText(fullUrl)
    toast.show('Credential link copied!', 'The credential link has been copied to your clipboard.', 'success')
    isMenuOpen.value = false
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    toast.show('Failed to copy', 'Could not copy the credential link to clipboard.', 'error')
  }
}

async function handleDownload() {
  if (!process.client || !imageUrl.value) return

  try {
    const a = document.createElement('a')
    a.href = imageUrl.value
    // Suggest a filename for the download
    a.download = `${achievementName.replace(/\s+/g, '-')}-certificate.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    emit('download')
  } catch (error) {
    console.error('Error downloading certificate image:', error)
    alert('Failed to download image.')
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
          <div v-if="showRecipient" class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-building-office mr-2"></div>
            {{ recipient?.name || 'Unknown Recipient' }}
          </div>
        </div>
      </div>

      <!-- Dropdown Menu for Actions -->
      <div class="relative">
        <button 
          @click.stop="isMenuOpen = !isMenuOpen" 
          class="p-2 rounded-full hover:bg-gray-100"
        >
          <div class="w-5 h-5 i-heroicons-ellipsis-vertical text-gray-500"></div>
        </button>
        
        <!-- Dropdown Content -->
        <transition name="fade">
          <div 
            v-if="isMenuOpen" 
            class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
          >
            <a 
              :href="getCredentialUrl()" 
              target="_blank"
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Certificate
            </a>
            <button 
              @click="handleDownload"
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Download
            </button>
            <button 
              @click="copyToClipboard"
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Copy Verification Link
            </button>
            <button 
              @click="handleExport" 
              :disabled="isExporting"
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              <span v-if="isExporting">Exporting...</span>
              <span v-else>Export to JSON</span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Image Preview -->
    <div class="mt-4 aspect-[16/9] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
      <img :src="imageUrl" alt="Certificate Image" class="w-full h-full object-cover">
    </div>
  </div>
</template>