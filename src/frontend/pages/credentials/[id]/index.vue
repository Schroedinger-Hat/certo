<script setup lang="ts">
import type {
  AchievementCredential,
  Evidence,
  VerificationResult
} from '~/types/openbadges'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { apiClient } from '~/api/api-client'

const route = useRoute()
const credentialId = ref('')
const credential = ref<AchievementCredential | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const verificationResult = ref<VerificationResult | null>(null)
const currentImageIndex = ref(0)
const imageLoadError = ref(false)

// Format dates with proper localization
const formattedIssuanceDate = computed(() => {
  const date = credential.value?.issuanceDate
  if (!date) { return 'Unknown' }
  return formatDate(date)
})

const formattedExpirationDate = computed(() => {
  const date = credential.value?.expirationDate
  if (!date) { return 'No expiration' }
  return formatDate(date)
})

// Get all possible image URLs
const imageUrlOptions = computed(() => {
  if (!credential.value) { return [] }

  const cred = credential.value
  const rawCred = verificationResult.value?.rawCredential

  // Try different options in order of preference
  const options = [
    // Option 1: Direct certificate endpoint URL
    apiClient.getCertificateUrl(cred.id),

    // Option 2: Raw credential achievement image URL (Strapi format)
    rawCred?.achievement?.image?.url,

    // Option 3: Raw credential achievement image formats (Strapi responsive images)
    rawCred?.achievement?.image?.formats?.large?.url,
    rawCred?.achievement?.image?.formats?.medium?.url,
    rawCred?.achievement?.image?.formats?.small?.url,

    // Option 4: OpenBadges achievement image ID
    typeof cred.credentialSubject?.achievement?.image?.id === 'string'
      ? cred.credentialSubject.achievement.image.id.replace('https://bold-approval-5bde4fbd5d.strapiapp.comhttps://', 'https://')
      : null,

    // Option 5: OpenBadges issuer image
    typeof cred.issuer?.image === 'string' ? cred.issuer.image : null
  ].filter(Boolean) as string[]

  return [...new Set(options)] // Remove duplicates
})

// Get the current image URL based on the current index
const displayImageUrl = computed(() => {
  if (imageUrlOptions.value.length === 0) { return null }
  return imageUrlOptions.value[currentImageIndex.value]
})

// Generate shareable URL
const shareableUrl = computed(() => {
  if (!credentialId.value) { return '' }
  return `${window.location.origin}/credentials/${encodeURIComponent(credentialId.value)}`
})

// Handle image error by trying the next URL in the options
function handleImageError() {
  if (currentImageIndex.value < imageUrlOptions.value.length - 1) {
    currentImageIndex.value++
  }
  else {
    imageLoadError.value = true
  }
}

function formatDate(dateString: string) {
  if (!dateString) { return 'Unknown' }

  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date)
  }
  catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

async function shareCredential() {
  try {
    if (navigator.share) {
      await navigator.share({
        title: credential.value?.name || 'Credential',
        text: `View my credential: ${credential.value?.name}`,
        url: shareableUrl.value
      })
    }
    else {
      await navigator.clipboard.writeText(shareableUrl.value)
      alert('Link copied to clipboard!')
    }
  }
  catch (error) {
    console.error('Error sharing:', error)
  }
}

async function downloadCredential() {
  const imageUrl = displayImageUrl.value
  if (!imageUrl) { return }

  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `${credential.value?.name || 'credential'}.png`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(downloadUrl)
    document.body.removeChild(a)
  }
  catch (error) {
    console.error('Error downloading credential:', error)
  }
}

async function fetchCredentialDetails() {
  if (!credentialId.value) { return }

  loading.value = true
  error.value = null

  try {
    // First verify the credential
    const result = await apiClient.verifyBadge(credentialId.value)
    verificationResult.value = result

    if (result.credential) {
      // If verification returned the credential, use it
      credential.value = result.credential
    }
    else {
      // Otherwise try to fetch the credential directly
      try {
        const response = await apiClient.getCertificate(credentialId.value)
        credential.value = apiClient.formatCredential(response.data || response) as AchievementCredential
      }
      catch (fetchError) {
        console.error('Error fetching credential details:', fetchError)
        // Use what we have from verification anyway
        if (result.rawCredential) {
          credential.value = result.rawCredential as AchievementCredential
        }
        else {
          credential.value = null
        }
      }
    }
  }
  catch (err) {
    console.error('Error verifying credential:', err)
    error.value = 'Failed to verify or fetch credential details'
  }
  finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Get the credential ID from the route params and decode it
  if (route.params.id) {
    try {
      credentialId.value = decodeURIComponent(route.params.id.toString())
      await fetchCredentialDetails()
    }
    catch (error) {
      console.error('Error decoding credential ID:', error)
      credentialId.value = route.params.id.toString()
    }
  }
})

// Update page metadata
useHead({
  title: computed(() => credential.value?.name
    ? `${credential.value.name} | Credential Details`
    : 'Credential Details | Certo'),
  meta: [
    {
      name: 'description',
      content: computed(() => credential.value?.description || 'View and verify credential details')
    },
    {
      name: 'og:title',
      property: 'og:title',
      content: computed(() => credential.value?.name ? `${credential.value.name} | Certo` : 'Credential Details | Certo')
    },
    {
      name: 'og:description',
      property: 'og:description',
      content: computed(() => credential.value?.description || 'View and verify credential details')
    },
    {
      name: 'og:image',
      property: 'og:image',
      content: computed(() => displayImageUrl.value || 'https://certo.schroedinger-hat.org/og-default.png')
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image'
    },
    {
      name: 'twitter:image',
      content: computed(() => displayImageUrl.value || 'https://certo.schroedinger-hat.org/og-default.png')
    },
    {
      property: 'og:url',
      content: computed(() => shareableUrl.value)
    }
  ],
  link: [
    {
      rel: 'canonical',
      href: computed(() => shareableUrl.value)
    }
  ]
})
</script>

<template>
  <div class="container mx-auto py-10 px-4">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="max-w-lg mx-auto p-8 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl"
    >
      <div class="flex flex-col items-center justify-center">
        <div class="i-lucide-loader-2 w-12 h-12 animate-spin text-primary-500 mb-4" />
        <h2 class="text-xl font-medium">
          Loading Credential...
        </h2>
      </div>
    </div>

    <!-- Invalid Credential ID -->
    <div
      v-else-if="!credentialId"
      class="max-w-lg mx-auto p-8 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl"
    >
      <div class="text-center">
        <div class="i-lucide-alert-triangle w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h2 class="text-2xl font-semibold mb-3">
          Invalid Credential ID
        </h2>
        <p class="text-gray-600 mb-6">
          No credential ID was provided or the ID is invalid.
        </p>
        <NuxtLink
          to="/verify"
          class="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors"
        >
          <div class="i-lucide-search mr-2" />
          Verify Another Credential
        </NuxtLink>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="max-w-lg mx-auto p-8 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl"
    >
      <div class="text-center">
        <div class="i-lucide-x-circle w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 class="text-2xl font-semibold mb-3">
          Error Loading Credential
        </h2>
        <p class="text-gray-600 mb-6">
          {{ error }}
        </p>
        <button
          class="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors"
          @click="fetchCredentialDetails"
        >
          <div class="i-lucide-refresh-cw mr-2" />
          Try Again
        </button>
      </div>
    </div>

    <!-- Credential Details -->
    <div v-else-if="credential" class="max-w-4xl mx-auto">
      <!-- Verification Status -->
      <div
        class="mb-8 p-6 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl"
        :class="{
          'border-green-500': verificationResult?.verified,
          'border-red-500': verificationResult && !verificationResult.verified,
        }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center mr-4"
              :class="{
                'bg-green-100': verificationResult?.verified,
                'bg-red-100': verificationResult && !verificationResult.verified,
              }"
            >
              <div
                v-if="verificationResult?.verified"
                class="i-lucide-check-circle w-8 h-8 text-green-500"
              />
              <div
                v-else
                class="i-lucide-x-circle w-8 h-8 text-red-500"
              />
            </div>
            <div>
              <h3 class="text-xl font-semibold mb-1">
                {{ verificationResult?.verified ? 'Credential Verified' : 'Verification Failed' }}
              </h3>
              <p class="text-gray-600">
                {{ verificationResult?.error || 'All verification checks passed successfully.' }}
              </p>
            </div>
          </div>
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh verification"
            @click="fetchCredentialDetails"
          >
            <div class="i-lucide-refresh-cw w-5 h-5" />
          </button>
        </div>

        <!-- Verification Checks -->
        <div v-if="verificationResult?.checks?.length" class="mt-6">
          <h4 class="font-medium mb-3">
            Verification Checks
          </h4>
          <div class="space-y-2">
            <div
              v-for="check in verificationResult.checks"
              :key="check.check"
              class="flex items-center p-3 rounded-lg bg-gray-50"
            >
              <div
                class="w-6 h-6 mr-3"
                :class="{
                  'i-lucide-check-circle text-green-500': check.result === 'success',
                  'i-lucide-alert-triangle text-amber-500': check.result === 'warning',
                  'i-lucide-x-circle text-red-500': check.result === 'error',
                }"
              />
              <div>
                <div class="font-medium">
                  {{ check.check }}
                </div>
                <div
                  v-if="check.message"
                  class="text-sm"
                >
                  {{ check.message }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Credential Card -->
      <div class="mb-8 overflow-hidden rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl">
        <!-- Credential Image -->
        <div
          v-if="displayImageUrl && !imageLoadError"
          class="relative aspect-video bg-gray-100"
        >
          <img
            :src="displayImageUrl"
            :alt="credential.name || 'Credential Image'"
            class="w-full h-full object-contain"
            @error="handleImageError"
          >
          <div class="absolute bottom-4 right-4 flex gap-2">
            <button
              class="p-2 rounded-lg bg-white/90 hover:bg-white shadow-lg transition-colors"
              title="Download image"
              @click="downloadCredential"
            >
              <div class="i-lucide-download w-5 h-5" />
            </button>
            <button
              class="p-2 rounded-lg bg-white/90 hover:bg-white shadow-lg transition-colors"
              title="Share credential"
              @click="shareCredential"
            >
              <div class="i-lucide-share w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Credential Details -->
        <div class="p-6">
          <h1 class="text-3xl font-bold mb-4">
            {{ credential.name || 'Unnamed Credential' }}
          </h1>

          <div class="prose max-w-none mb-6">
            <p>{{ credential.description }}</p>
          </div>

          <!-- Metadata Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Dates -->
            <div class="space-y-4">
              <div>
                <div class="text-sm font-medium text-gray-500">
                  Issued On
                </div>
                <div class="mt-1">
                  {{ formattedIssuanceDate }}
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-gray-500">
                  Expires On
                </div>
                <div class="mt-1">
                  {{ formattedExpirationDate }}
                </div>
              </div>
              <!-- Recipient Name -->
              <div v-if="verificationResult?.rawCredential?.recipient?.name">
                <div class="text-sm font-medium text-gray-500">
                  Recipient
                </div>
                <div class="mt-1">
                  {{ verificationResult?.rawCredential?.recipient?.name }}
                </div>
              </div>
            </div>

            <!-- Issuer -->
            <div v-if="credential.issuer" class="space-y-2">
              <div class="text-sm font-medium text-gray-500">
                Issued By
              </div>
              <div class="flex items-center">
                <img
                  v-if="typeof credential.issuer.image === 'string'"
                  :src="credential.issuer.image"
                  :alt="credential.issuer.name"
                  class="w-10 h-10 rounded-full object-cover mr-3"
                >
                <div>
                  <div class="font-medium">
                    {{ credential.issuer.name }}
                  </div>
                  <a
                    v-if="credential.issuer.url"
                    :href="credential.issuer.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-primary-500 hover:text-primary-600"
                  >
                    Visit Website
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement Details -->
      <div
        v-if="credential.credentialSubject?.achievement"
        class="mb-8 p-6 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl"
      >
        <h2 class="text-2xl font-semibold mb-4">
          Achievement Details
        </h2>

        <div class="prose max-w-none">
          <h3>{{ credential.credentialSubject.achievement.name }}</h3>
          <p>{{ credential.credentialSubject.achievement.description }}</p>

          <!-- Criteria -->
          <div v-if="credential.credentialSubject.achievement.criteria?.narrative" class="mt-6">
            <h4 class="font-medium mb-2">
              Criteria
            </h4>
            <p>{{ credential.credentialSubject.achievement.criteria.narrative }}</p>
          </div>

          <!-- Alignments -->
          <div
            v-if="credential.credentialSubject.achievement.alignments?.length"
            class="mt-6"
          >
            <h4 class="font-medium mb-2">
              Alignments
            </h4>
            <div class="space-y-4">
              <div
                v-for="alignment in credential.credentialSubject.achievement.alignments"
                :key="alignment.targetUrl"
                class="p-4 rounded-lg bg-gray-50"
              >
                <h5 class="font-medium">
                  {{ alignment.targetName }}
                </h5>
                <p v-if="alignment.targetDescription" class="text-sm">
                  {{ alignment.targetDescription }}
                </p>
                <div class="mt-2">
                  <a
                    :href="alignment.targetUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-primary-500 hover:text-primary-600"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Evidence -->
      <div
        v-if="credential.evidence?.length"
        class="mb-8 p-6 rounded-2xl bg-white/80 backdrop-blur-lg border border-gray-200 shadow-xl"
      >
        <h2 class="text-2xl font-semibold mb-4">
          Evidence
        </h2>
        <div class="space-y-4">
          <div
            v-for="item in (credential.evidence as Evidence[])"
            :key="item.id"
            class="p-4 rounded-lg bg-gray-50"
          >
            <h3 class="font-medium mb-2">
              {{ item.name }}
            </h3>
            <p v-if="item.description" class="text-gray-600">
              {{ item.description }}
            </p>
            <div v-if="item.narrative" class="mt-2 text-sm">
              {{ item.narrative }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
