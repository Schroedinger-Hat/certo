<script setup lang="ts">
import { useRuntimeConfig } from '#app'
import { computed, ref } from 'vue'
import { apiClient } from '~/api/api-client'
import { useSimpleToast } from '~/composables/useSimpleToast'

defineOptions({
  name: 'CertificateCard'
})

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
  if (!dateString) { return 'Unknown' }

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

// Get the achievement image URL (badge) as the primary image for the card
const badgeImageUrl = computed(() => {
  const runtimeConfig = useRuntimeConfig()
  const apiUrl = runtimeConfig.public.apiUrl

  // Prefer achievement image
  if (achievement?.image?.url) {
    return achievement.image.url.startsWith('http')
      ? achievement.image.url
      : `${apiUrl}${achievement.image.url}`
  }
  // Fallbacks
  if (image?.url) {
    return image.url.startsWith('http')
      ? image.url
      : `${apiUrl}${image.url}`
  }
  if (props.certificate.imageUrl) {
    return props.certificate.imageUrl.startsWith('http')
      ? props.certificate.imageUrl
      : `${apiUrl}${props.certificate.imageUrl}`
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
  // Fallback to placeholder
  return '/placeholder-badge.png'
})

async function handleExport() {
  isExporting.value = true
  try {
    const exportResponse = await apiClient.exportCertificate(id)
    const exportData = exportResponse?.data
    if (process.client && exportData) {
      // Create a download link for the exported credential data only
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
  }
  catch (error) {
    console.error('Error exporting certificate:', error)
  }
  finally {
    isExporting.value = false
  }
}

async function handleRevoke() {
  if (!revocationReason.value.trim()) { return }

  isRevoking.value = true
  try {
    await apiClient.revokeCertificate(id, revocationReason.value)
    emit('revoke')
  }
  catch (error) {
    console.error('Error revoking certificate:', error)
  }
  finally {
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
  if (!process.client) { return }
  try {
    const fullUrl = `${window.location.origin}/credentials/${encodeURIComponent(credentialId || id)}`
    navigator.clipboard.writeText(fullUrl)
    toast.show('Credential link copied!', 'The credential link has been copied to your clipboard.', 'success')
    isMenuOpen.value = false
  }
  catch (error) {
    console.error('Error copying to clipboard:', error)
    toast.show('Failed to copy', 'Could not copy the credential link to clipboard.', 'error')
  }
}

async function handleDownload() {
  if (!process.client || !badgeImageUrl.value) { return }

  try {
    const a = document.createElement('a')
    a.href = badgeImageUrl.value
    // Suggest a filename for the download
    a.download = `${achievementName.replace(/\s+/g, '-')}-certificate.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    emit('download')
  }
  catch (error) {
    console.error('Error downloading certificate image:', error)
    alert('Failed to download image.')
  }
}

function openCertificateInNewTab() {
  if (typeof window !== 'undefined') {
    window.open(apiClient.getCertificateUrl(id), '_blank')
  }
}

// Utility to generate LinkedIn Add to Profile URL
function getLinkedInAddToProfileUrl() {
  const certName = achievementName
  const certIdValue = credentialId || id
  const issueDateValue = issuanceDate || issuedOn
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: certName,
    organizationId: '53115782',
    issueYear: issueDateValue ? new Date(issueDateValue).getFullYear().toString() : '',
    issueMonth: issueDateValue ? (new Date(issueDateValue).getMonth() + 1).toString() : '',
    certId: certIdValue,
    certUrl: process.client ? `${window.location.origin}/credentials/${certIdValue}` : ''
  })
  return `https://www.linkedin.com/profile/add?${params.toString()}`
}
</script>

<template>
  <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <!-- Certificate Icon -->
        <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-lg flex items-center justify-center mb-4">
          <div class="w-6 h-6 i-heroicons-document-text text-[#5AB69F]" />
        </div>

        <!-- Certificate Info -->
        <h3 class="text-lg font-medium text-text-primary mb-1">
          {{ achievementName }}
        </h3>
        <p class="text-text-secondary text-sm mb-4">
          {{ achievementDescription }}
        </p>

        <!-- Metadata -->
        <div class="space-y-2">
          <div class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-calendar mr-2" />
            {{ formattedIssuanceDate }}
          </div>
          <div class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-user mr-2" />
            {{ issuerName }}
          </div>
          <div v-if="showRecipient" class="flex items-center text-sm text-text-secondary">
            <div class="w-4 h-4 i-heroicons-building-office mr-2" />
            {{ recipient?.name || 'Unknown Recipient' }}
          </div>
        </div>
      </div>

      <!-- Dropdown Menu for Actions -->
      <div class="relative">
        <button
          class="p-2 rounded-full hover:bg-gray-100"
          @click.stop="isMenuOpen = !isMenuOpen"
        >
          <div class="w-5 h-5 i-heroicons-ellipsis-vertical text-gray-500" />
        </button>

        <!-- Dropdown Content -->
        <transition name="fade">
          <div
            v-if="isMenuOpen"
            class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10"
          >
            <!-- LinkedIn Add to Profile Button -->
            <a
              :href="getLinkedInAddToProfileUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="block w-full text-left px-4 py-2 text-sm text-[#0077b5] hover:bg-[#eaf4fb] font-medium"
              aria-label="Add this certificate to your LinkedIn profile"
            >
              <img src="https://download.linkedin.com/desktop/add2profile/buttons/en_US.png" alt="LinkedIn Add to Profile" class="inline h-4 w-auto mr-2 align-middle" />
              Add to LinkedIn
            </a>
            <a
              :href="getCredentialUrl()"
              target="_blank"
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              View Certificate
            </a>
            <button
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="handleDownload"
            >
              Download Badge
            </button>
            <button
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="openCertificateInNewTab"
            >
              Download Certificate
            </button>
            <button
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="copyToClipboard"
            >
              Copy Verification Link
            </button>
            <button
              :disabled="isExporting"
              class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              @click="handleExport"
            >
              <span v-if="isExporting">Exporting...</span>
              <span v-else>Export to JSON</span>
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Badge Image Preview (Achievement Image) -->
    <div class="mt-4 aspect-[16/9] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
      <img :src="badgeImageUrl" alt="Credential Badge Image" class="w-full h-full object-contain">
    </div>
  </div>
</template>
