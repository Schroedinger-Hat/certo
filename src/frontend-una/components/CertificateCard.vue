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

const emit = defineEmits(['export', 'revoke'])

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
  <NCard class="relative">
    <template #header>
      <div class="flex justify-between items-start gap-2">
        <div>
          <h3 class="text-lg font-semibold">{{ achievementName }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Issued by {{ issuerName }}
          </p>
        </div>
        <NBadge :variant="revoked ? 'error' : 'success'" class="ml-auto">
          {{ revoked ? 'Revoked' : 'Valid' }}
        </NBadge>
      </div>
    </template>
    
    <div class="flex mt-4 space-y-2 flex-col">
      <div class="aspect-square max-h-40 overflow-hidden rounded-lg mb-4">
        <img
          :src="imageUrl"
          :alt="achievementName"
          class="w-full h-full object-contain bg-gray-50 dark:bg-gray-800"
          loading="lazy"
        />
      </div>
      
      <p v-if="achievementDescription" class="text-sm text-gray-700 dark:text-gray-300 mb-4">
        {{ achievementDescription }}
      </p>
      
      <div class="space-y-2">
        <div class="flex justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Issued On:</span>
          <span class="text-sm">{{ formattedIssuanceDate }}</span>
        </div>
        
        <div v-if="expirationDate || expires" class="flex justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-400">Expires On:</span>
          <span class="text-sm">{{ formattedExpirationDate }}</span>
        </div>
        
        <div v-if="revoked" class="flex justify-between text-red-600 dark:text-red-400">
          <span class="text-sm">Revoked:</span>
          <span class="text-sm">{{ props.certificate.revocationReason || 'Revoked by issuer' }}</span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="flex justify-between mt-4">
        <div class="space-x-2">
          <NuxtLink :to="`/credentials/${encodeURIComponent(credentialId || id)}`">
            <NButton
              size="sm"
              variant="ghost"
            >
              <div class="i-lucide-eye mr-1"></div>
              View
            </NButton>
          </NuxtLink>
          
          <NTooltip text="Share Link">
            <NButton
              size="sm"
              variant="ghost"
              @click="copyToClipboard"
            >
              <div class="i-lucide-link mr-1"></div>
              Share
            </NButton>
          </NTooltip>
        </div>
        
        <div class="space-x-2">
          <NButton
            size="sm"
            variant="outline"
            @click="handleExport"
            :loading="isExporting"
          >
            <div class="i-lucide-download mr-1"></div>
            Export
          </NButton>
          
          <NPopover v-if="issuer && issuer.id === recipient?.id && !revoked">
            <template #trigger>
              <NButton
                size="sm"
                variant="outline"
                class="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
              >
                <div class="i-lucide-ban mr-1"></div>
                Revoke
              </NButton>
            </template>
            
            <template #content>
              <div class="p-4 w-72">
                <h4 class="font-medium mb-2">Revoke Certificate</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  This action cannot be undone. Please provide a reason for revocation.
                </p>
                <NFormItem label="Reason">
                  <NInput v-model="revocationReason" placeholder="Enter revocation reason" />
                </NFormItem>
                <div class="flex justify-end mt-3">
                  <NButton
                    size="sm"
                    variant="solid"
                    class="bg-red-600 hover:bg-red-700 text-white"
                    :loading="isRevoking"
                    :disabled="!revocationReason.trim()"
                    @click="handleRevoke"
                  >
                    Confirm Revocation
                  </NButton>
                </div>
              </div>
            </template>
          </NPopover>
        </div>
      </div>
    </template>
  </NCard>
</template>