<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRuntimeConfig } from '#app'
import { apiClient } from '~/api/api-client'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const credentialId = ref('')
const credential = ref(null)
const loading = ref(false)
const error = ref(null)
const verificationResult = ref(null)
const currentImageIndex = ref(0)
const imageLoadError = ref(false)

const formattedIssuanceDate = computed(() => {
  if (!credential.value?.issuanceDate) return 'Unknown'
  return formatDate(credential.value.issuanceDate)
})

const formattedExpirationDate = computed(() => {
  if (!credential.value?.expirationDate) return 'No expiration'
  return formatDate(credential.value.expirationDate)
})

// Get all possible image URLs
const imageUrlOptions = computed(() => {
  if (!credential.value) return []
  
  const apiUrl = runtimeConfig.public.apiUrl || 'http://localhost:1337'
  
  // Try different options in order of preference
  const options = [
    // Option 1: Direct certificate endpoint URL
    apiClient.getCertificateUrl(credential.value.id || credentialId.value),
    
    // Option 2: imageUrl property if available
    credential.value.imageUrl,
    
    // Option 3: image.url if available
    credential.value.image?.url?.startsWith('http') 
      ? credential.value.image.url 
      : credential.value.image?.url ? `${apiUrl}${credential.value.image.url}` : null,
    
    // Option 4: achievement image if available
    credential.value.achievement?.image?.data?.attributes?.url 
      ? `${apiUrl}${credential.value.achievement.image.data.attributes.url}` : null,
      
    // Option 5: achievement image.url if available
    credential.value.achievement?.image?.url?.startsWith('http')
      ? credential.value.achievement.image.url
      : credential.value.achievement?.image?.url ? `${apiUrl}${credential.value.achievement.image.url}` : null
  ].filter(Boolean)
  
  console.log('Image URL options:', options)
  return options
})

// Get the current image URL based on the current index
const displayImageUrl = computed(() => {
  if (imageUrlOptions.value.length === 0) return null
  return imageUrlOptions.value[currentImageIndex.value]
})

// Handle image error by trying the next URL in the options
function handleImageError() {
  if (currentImageIndex.value < imageUrlOptions.value.length - 1) {
    currentImageIndex.value++
  } else {
    imageLoadError.value = true
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

onMounted(async () => {
  // Get the credential ID from the route params and decode it
  if (route.params.id) {
    try {
      credentialId.value = decodeURIComponent(route.params.id.toString())
      console.log('Decoded credential ID:', credentialId.value)
      await fetchCredentialDetails()
    } catch (error) {
      console.error('Error decoding credential ID:', error)
      credentialId.value = route.params.id.toString()
    }
  }
})

async function fetchCredentialDetails() {
  if (!credentialId.value) return
  
  loading.value = true
  error.value = null
  
  try {
    // First verify the credential
    verificationResult.value = await apiClient.verifyBadge(credentialId.value)
    console.log('Verification result:', verificationResult.value)
    
    if (verificationResult.value.credential) {
      // If verification returned the credential, use it
      credential.value = verificationResult.value.credential
      console.log('Credential from verification:', credential.value)
    } else {
      // Otherwise try to fetch the credential directly
      try {
        const response = await apiClient.getCertificate(credentialId.value)
        credential.value = apiClient.formatCredential(response.data || response)
        console.log('Credential from direct fetch:', credential.value)
        console.log('Image path test:', {
          directImageUrl: apiClient.getCertificateUrl(credential.value.id || credentialId.value),
          credentialId: credential.value.id || credentialId.value
        })
      } catch (fetchError) {
        console.error('Error fetching credential details:', fetchError)
        // Use what we have from verification anyway
        credential.value = verificationResult.value.rawCredential || {}
      }
    }
  } catch (err) {
    console.error('Error verifying credential:', err)
    error.value = 'Failed to verify or fetch credential details'
  } finally {
    loading.value = false
  }
}

useHead({
  title: credential.value?.name 
    ? `${credential.value.name} | Credential Details` 
    : 'Credential Details | Certo',
  meta: [
    { name: 'description', content: credential.value?.description || 'View and verify credential details' }
  ]
})
</script>

<template>
  <div class="container mx-auto py-10 px-4">
    <div v-if="!credentialId" class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="i-lucide-alert-triangle w-12 h-12 mx-auto text-amber-500 mb-3"></div>
      <h2 class="text-xl font-semibold mb-2">Invalid Credential ID</h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        No credential ID was provided or the ID is invalid.
      </p>
      <NuxtLink to="/verify" class="text-primary-600 hover:underline">
        Try verifying a different credential
      </NuxtLink>
    </div>
    
    <div v-else-if="loading" class="flex flex-col items-center justify-center py-12">
      <div class="i-lucide-loader animate-spin w-12 h-12 text-primary-500 mb-4"></div>
      <p class="text-lg">Loading credential details...</p>
    </div>
    
    <div v-else-if="error" class="max-w-4xl mx-auto">
      <NAlert variant="error" class="mb-8">
        {{ error }}
      </NAlert>
      
      <BadgeVerifier 
        :initialIdentifier="credentialId" 
        :autoVerify="true" 
      />
    </div>
    
    <div v-else-if="credential" class="max-w-4xl mx-auto">
      <!-- Credential Header with Verification Status -->
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div class="w-40 h-40 relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <img 
            v-if="displayImageUrl && !imageLoadError" 
            :src="displayImageUrl" 
            :alt="credential.name || 'Credential'" 
            class="w-full h-full object-contain p-2"
            loading="lazy"
            @error="handleImageError"
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <div class="i-lucide-award w-20 h-20 text-primary-400"></div>
          </div>
        </div>
        
        <div class="flex-1 text-center md:text-left">
          <h1 class="text-3xl font-bold mb-2">
            {{ credential.name || 'Unnamed Credential' }}
          </h1>
          
          <p v-if="credential.description" class="text-gray-600 dark:text-gray-400 mb-4">
            {{ credential.description }}
          </p>
          
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <NBadge :variant="verificationResult?.verified ? 'success' : 'error'">
              {{ verificationResult?.verified ? 'Verified' : 'Unverified' }}
            </NBadge>
            
            <NBadge v-if="credential.revoked" variant="error">
              Revoked
            </NBadge>
          </div>
          
          <div class="text-sm">
            <p>
              <span class="font-medium">Issuer:</span> 
              {{ credential.issuer?.name || 'Unknown Issuer' }}
            </p>
            <p>
              <span class="font-medium">ID:</span> 
              <span class="font-mono text-xs">{{ credentialId }}</span>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Credential Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <NCard>
          <template #header>
            <h2 class="text-xl font-semibold">Credential Information</h2>
          </template>
          
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Issued On</h3>
              <p>{{ formattedIssuanceDate }}</p>
            </div>
            
            <div v-if="credential.expirationDate">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Expires On</h3>
              <p>{{ formattedExpirationDate }}</p>
            </div>
            
            <div v-if="credential.achievement">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Achievement</h3>
              <p>{{ credential.achievement.name || credential.name }}</p>
              <p v-if="credential.achievement.description" class="text-sm text-gray-600 dark:text-gray-400">
                {{ credential.achievement.description }}
              </p>
            </div>
            
            <div v-if="credential.revoked">
              <h3 class="text-sm font-medium text-red-600 dark:text-red-400">Revocation Information</h3>
              <p class="text-red-600 dark:text-red-400">
                {{ credential.revocationReason || 'This credential has been revoked by the issuer.' }}
              </p>
            </div>
          </div>
        </NCard>
        
        <NCard>
          <template #header>
            <h2 class="text-xl font-semibold">Issuer Information</h2>
          </template>
          
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Name</h3>
              <p>{{ credential.issuer?.name || 'Unknown' }}</p>
            </div>
            
            <div v-if="credential.issuer?.description">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
              <p>{{ credential.issuer.description }}</p>
            </div>
            
            <div v-if="credential.issuer?.url">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Website</h3>
              <a :href="credential.issuer.url" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline">
                {{ credential.issuer.url }}
              </a>
            </div>
            
            <div v-if="credential.issuer?.email">
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
              <a :href="`mailto:${credential.issuer.email}`" class="text-primary-600 hover:underline">
                {{ credential.issuer.email }}
              </a>
            </div>
          </div>
        </NCard>
      </div>
      
      <!-- Verification Details -->
      <NCard v-if="verificationResult" class="mb-8">
        <template #header>
          <h2 class="text-xl font-semibold">Verification Information</h2>
        </template>
        
        <div class="space-y-4">
          <div class="flex items-center gap-2">
            <div v-if="verificationResult.verified" class="i-lucide-check-circle text-green-500 w-6 h-6"></div>
            <div v-else class="i-lucide-x-circle text-red-500 w-6 h-6"></div>
            <p class="font-medium">
              {{ verificationResult.verified 
                ? 'This credential has been verified as authentic' 
                : 'This credential could not be verified' 
              }}
            </p>
          </div>
          
          <div v-if="verificationResult.error" class="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded">
            {{ verificationResult.error }}
          </div>
          
          <div v-if="verificationResult.checks && verificationResult.checks.length">
            <h3 class="font-medium mb-2">Verification Checks:</h3>
            <ul class="space-y-3">
              <li 
                v-for="(check, index) in verificationResult.checks" 
                :key="index"
                class="flex items-start gap-2 p-2 rounded"
                :class="{
                  'bg-green-50 dark:bg-green-900/10': check.result === 'success',
                  'bg-yellow-50 dark:bg-yellow-900/10': check.result === 'warning',
                  'bg-red-50 dark:bg-red-900/10': check.result === 'error'
                }"
              >
                <div 
                  :class="[
                    'w-5 h-5 mt-0.5', 
                    check.result === 'success' ? 'i-lucide-check text-green-500' : 
                    check.result === 'warning' ? 'i-lucide-alert-triangle text-yellow-500' : 
                    'i-lucide-x text-red-500'
                  ]"
                ></div>
                <div>
                  <div class="font-medium">{{ check.check }}</div>
                  <div v-if="check.message" class="text-sm">
                    {{ check.message }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </NCard>
      
      <div class="flex justify-between mt-8">
        <NuxtLink to="/verify">
          <NButton variant="outline">
            <div class="i-lucide-arrow-left mr-2"></div>
            Back to Verification
          </NButton>
        </NuxtLink>
        
        <div>
          <NButton 
            v-if="!credential.revoked" 
            variant="outline" 
            class="mr-3"
            @click="() => {
              if (navigator.share) {
                navigator.share({
                  title: credential.name,
                  text: `Check out this credential: ${credential.name}`,
                  url: window.location.href
                })
              } else {
                navigator.clipboard.writeText(window.location.href)
                alert('URL copied to clipboard')
              }
            }"
          >
            <div class="i-lucide-share-2 mr-2"></div>
            Share
          </NButton>
          
          <NButton 
            variant="primary"
            @click="async () => {
              try {
                const exportData = await apiClient.exportCertificate(credential.id || credentialId)
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `credential-${credential.id || credentialId}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              } catch (error) {
                console.error('Error exporting credential:', error)
                alert('Error exporting credential')
              }
            }"
          >
            <div class="i-lucide-download mr-2"></div>
            Export
          </NButton>
        </div>
      </div>
    </div>
    
    <!-- Fallback to BadgeVerifier if we couldn't fetch the credential details -->
    <div v-else class="max-w-4xl mx-auto">
      <BadgeVerifier 
        :initialIdentifier="credentialId" 
        :autoVerify="true" 
      />
    </div>
  </div>
</template> 