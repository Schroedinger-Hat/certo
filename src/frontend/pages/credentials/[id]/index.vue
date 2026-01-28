<script setup lang="ts">
import type {
  AchievementCredential,
  Evidence,
  VerificationResult
} from '~/types/openbadges'
import { apiClient } from '~/api/api-client'

const route = useRoute()
const config = useRuntimeConfig()

// ============================================================================
// 1. ROUTE PARAMS & STATIC URLs
// ============================================================================
const rawId = route.params.id
const credentialId = rawId
  ? decodeURIComponent(Array.isArray(rawId) ? rawId[0] : rawId)
  : ''

const shareableUrl = `${WEBSITE_URL}/credentials/${encodeURIComponent(credentialId)}`
const ogImageUrl = `${WEBSITE_URL}/.netlify/functions/og-credential?id=${encodeURIComponent(credentialId)}`

// ============================================================================
// 2. DATA FETCHING
// ============================================================================
// For SSR meta tags to work, the API must be reachable from the Nuxt server process.
// In local dev: set NUXT_PUBLIC_API_URL to your backend (e.g., http://127.0.0.1:1337)
// In production: set to your production API URL

const apiUrl = config.public.apiUrl || ''

// useAsyncData fetches on server (SSR) and hydrates on client
// We catch errors to prevent page crash, but data will be null if fetch fails
const { data: verificationData, error: fetchError, status, refresh } = await useAsyncData<VerificationResult | null>(
  `credential-${credentialId}`,
  async () => {
    if (!credentialId) return null

    const url = `${apiUrl}/api/credentials/${encodeURIComponent(credentialId)}/verify`
    console.log(`[${import.meta.server ? 'SSR' : 'Client'}] Fetching: ${url}`)

    try {
      const result = await $fetch<VerificationResult>(url)
      console.log(`[${import.meta.server ? 'SSR' : 'Client'}] Fetch success:`, result?.credential?.name || result?.rawCredential?.name)
      return result
    }
    catch (err) {
      console.error(`[${import.meta.server ? 'SSR' : 'Client'}] Fetch failed:`, err)
      // Return null instead of throwing - page will render with fallback meta tags
      return null
    }
  },
  {
    // Nuxt 3.10+ options
    server: true,   // Fetch on server for SSR
    lazy: false,    // Block render until fetch completes (needed for SEO)
    default: () => null,
  }
)

// Client-side retry if SSR fetch failed (e.g., localhost not reachable from server)
onMounted(async () => {
  if (!verificationData.value && credentialId) {
    console.log('[Client] SSR data missing, retrying with apiClient...')
    try {
      verificationData.value = await apiClient.verifyBadge(credentialId)
      console.log('[Client] Retry success:', verificationData.value?.credential?.name)
    }
    catch (err) {
      console.error('[Client] Retry failed:', err)
    }
  }
})

// ============================================================================
// 3. COMPUTED DATA EXTRACTION
// ============================================================================
const credential = computed<AchievementCredential | null>(() => {
  const data = verificationData.value
  if (!data) return null
  return data.credential || data.rawCredential as AchievementCredential || null
})

const verificationResult = computed(() => verificationData.value)
const loading = computed(() => status.value === 'pending')
const error = computed(() => {
  if (fetchError.value) return fetchError.value.message
  if (status.value === 'error' && !verificationData.value && credentialId) {
    return 'Failed to verify or fetch credential details'
  }
  return null
})

// ============================================================================
// 4. SEO METADATA
// Per Nuxt 3 docs: use getter functions () => value for reactive meta tags
// https://nuxt.com/docs/api/composables/use-seo-meta
// ============================================================================

// Helper functions to extract data (keeps useSeoMeta clean)
function getCredentialName(): string {
  const cred = verificationData.value?.credential || verificationData.value?.rawCredential
  return cred?.name || cred?.title || ''
}

function getCredentialDescription(): string {
  const cred = verificationData.value?.credential || verificationData.value?.rawCredential
  return cred?.description || ''
}

function getIssuerName(): string {
  const cred = verificationData.value?.credential || verificationData.value?.rawCredential
  return cred?.issuer?.name || 'Certo'
}

function getRecipientName(): string {
  return verificationData.value?.rawCredential?.recipient?.name || ''
}

// SEO with getter functions (Nuxt 3 documented pattern)
useSeoMeta({
  // Title
  title: () => {
    const name = getCredentialName()
    return name ? `${name} | Certo` : 'Credential Details | Certo'
  },

  // Description
  description: () => {
    const desc = getCredentialDescription()
    if (desc) return desc

    const name = getCredentialName()
    if (name) {
      const issuer = getIssuerName()
      const recipient = getRecipientName()
      return recipient
        ? `View and verify "${name}" awarded to ${recipient}, issued by ${issuer} via Certo.`
        : `View and verify "${name}" issued by ${issuer} via Certo.`
    }
    return 'View and verify this digital credential issued via Certo.'
  },

  // Open Graph
  ogType: 'website',
  ogSiteName: 'Certo',
  ogUrl: shareableUrl,
  ogTitle: () => {
    const name = getCredentialName()
    return name ? `${name} | Certo` : 'Credential Details | Certo'
  },
  ogDescription: () => {
    const desc = getCredentialDescription()
    if (desc) return desc
    const name = getCredentialName()
    if (name) return `View and verify "${name}" issued by ${getIssuerName()} via Certo.`
    return 'View and verify this digital credential issued via Certo.'
  },
  ogImage: ogImageUrl,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: () => {
    const name = getCredentialName()
    return name ? `${name} - verified credential` : 'Certo credential'
  },

  // Twitter
  twitterCard: 'summary_large_image',
  twitterTitle: () => {
    const name = getCredentialName()
    return name ? `${name} | Certo` : 'Credential Details | Certo'
  },
  twitterDescription: () => {
    const desc = getCredentialDescription()
    if (desc) return desc
    const name = getCredentialName()
    if (name) return `View and verify "${name}" issued by ${getIssuerName()} via Certo.`
    return 'View and verify this digital credential issued via Certo.'
  },
  twitterImage: ogImageUrl,
  twitterImageAlt: () => {
    const name = getCredentialName()
    return name ? `${name} - verified credential` : 'Certo credential'
  },

  // Author
  author: () => getIssuerName(),
})

useHead({
  link: [{ rel: 'canonical', href: shareableUrl }],
})

// ============================================================================
// 5. UI HELPERS
// ============================================================================
async function refreshCredentialDetails() {
  await refresh()
  // If useAsyncData refresh failed, try apiClient (client-side only)
  if (!verificationData.value && credentialId && import.meta.client) {
    try {
      verificationData.value = await apiClient.verifyBadge(credentialId)
    }
    catch (err) {
      console.error('Refresh retry failed:', err)
    }
  }
}

// Client-side only state for image handling
const currentImageIndex = ref(0)
const imageLoadError = ref(false)

// Format dates with proper localization
const formattedIssuanceDate = computed(() => {
  const date = credential.value?.issuanceDate
  if (!date) return 'Unknown'
  return formatDate(date)
})

const formattedExpirationDate = computed(() => {
  const date = credential.value?.expirationDate
  if (!date) return 'No expiration'
  return formatDate(date)
})

// Get all possible image URLs for display
const imageUrlOptions = computed(() => {
  if (!credential.value) return []

  const cred = credential.value
  const rawCred = verificationData.value?.rawCredential

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

  return [...new Set(options)]
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
  }
  else {
    imageLoadError.value = true
  }
}

function formatDate(dateString: string) {
  if (!dateString) return 'Unknown'

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
  catch (err) {
    console.error('Error formatting date:', err)
    return dateString
  }
}

async function shareCredential() {
  try {
    if (navigator.share) {
      await navigator.share({
        title: credential.value?.name || 'Credential',
        text: `View my credential: ${credential.value?.name}`,
        url: shareableUrl
      })
    }
    else {
      await navigator.clipboard.writeText(shareableUrl)
    }
  }
  catch (err) {
    console.error('Error sharing:', err)
  }
}

async function downloadCredential() {
  const imageUrl = displayImageUrl.value
  if (!imageUrl) return

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
  catch (err) {
    console.error('Error downloading credential:', err)
  }
}

function getLinkedInAddToProfileUrl() {
  if (!credential.value) return '#'

  const cert = credential.value
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: cert.name || cert.title || '',
    organizationId: '53115782',
    issueYear: cert.issuanceDate ? new Date(cert.issuanceDate).getFullYear().toString() : '',
    issueMonth: cert.issuanceDate ? (new Date(cert.issuanceDate).getMonth() + 1).toString() : '',
    certId: cert.id,
    certUrl: shareableUrl
  })
  return `https://www.linkedin.com/profile/add?${params.toString()}`
}
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
          @click="refreshCredentialDetails"
        >
          <div class="i-lucide-refresh-cw mr-2" />
          Try Again
        </button>
      </div>
    </div>

    <!-- Credential Details -->
    <div v-else-if="credential" class="max-w-4xl mx-auto">
      <!-- LinkedIn Add to Profile Button at the Top -->
      <div class="flex flex-wrap gap-4 mb-6">
        <a
          :href="getLinkedInAddToProfileUrl()"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0077b5] text-white rounded hover:bg-[#005983] transition-colors text-sm font-medium"
          aria-label="Add this certificate to your LinkedIn profile"
        >
          <img src="https://download.linkedin.com/desktop/add2profile/buttons/en_US.png" alt="LinkedIn Add to Profile" class="h-5 w-auto">
          Add to LinkedIn
        </a>
      </div>

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
            @click="refreshCredentialDetails"
          >
            <div class="i-lucide-refresh-cw w-5 h-5" />
          </button>
        </div>

        <!-- Verification Checks -->
        <div v-if="verificationResult?.checks?.length" class="mt-6">
          <h4 class="font-medium mb-4 text-gray-700">
            Verification Checks
          </h4>
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="check in verificationResult.checks"
              :key="check.check"
              class="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              :class="{
                'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/60': check.result === 'success',
                'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200/60': check.result === 'warning',
                'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60': check.result === 'error',
              }"
            >
              <!-- Background decoration -->
              <div
                class="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30"
                :class="{
                  'bg-green-400': check.result === 'success',
                  'bg-amber-400': check.result === 'warning',
                  'bg-red-400': check.result === 'error',
                }"
              />

              <div class="relative flex items-start gap-3">
                <!-- Icon container with ring -->
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 transition-transform group-hover:scale-110"
                  :class="{
                    'bg-green-100 ring-green-200/50': check.result === 'success',
                    'bg-amber-100 ring-amber-200/50': check.result === 'warning',
                    'bg-red-100 ring-red-200/50': check.result === 'error',
                  }"
                >
                  <div
                    class="h-5 w-5"
                    :class="{
                      'i-lucide-shield-check text-green-600': check.check === 'not_revoked' && check.result === 'success',
                      'i-lucide-calendar-check text-green-600': check.check === 'not_expired' && check.result === 'success',
                      'i-lucide-file-check-2 text-green-600': check.check === 'proof' && check.result === 'success',
                      'i-lucide-check-circle text-green-600': check.result === 'success' && !['not_revoked', 'not_expired', 'proof'].includes(check.check),
                      'i-lucide-alert-triangle text-amber-600': check.result === 'warning',
                      'i-lucide-x-circle text-red-600': check.result === 'error',
                    }"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <!-- Status badge -->
                  <div class="mb-1.5 flex items-center gap-2">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                      :class="{
                        'bg-green-100 text-green-700': check.result === 'success',
                        'bg-amber-100 text-amber-700': check.result === 'warning',
                        'bg-red-100 text-red-700': check.result === 'error',
                      }"
                    >
                      {{ check.result === 'success' ? 'Passed' : check.result === 'warning' ? 'Warning' : 'Failed' }}
                    </span>
                  </div>

                  <!-- Check name with friendly label -->
                  <div class="font-semibold text-gray-800">
                    {{
                      check.check === 'not_revoked' ? 'Not Revoked' :
                      check.check === 'not_expired' ? 'Not Expired' :
                      check.check === 'proof' ? 'Valid Signature' :
                      check.check.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    }}
                  </div>

                  <!-- Description based on check type and result -->
                  <p class="mt-1 text-xs text-gray-500">
                    {{
                      check.result === 'error' || check.result === 'warning'
                        ? (check.message || 'Verification check failed')
                        : check.check === 'not_revoked' ? 'This credential has not been revoked by the issuer'
                        : check.check === 'not_expired' ? 'This credential is within its validity period'
                        : check.check === 'proof' ? 'Cryptographic signature verified successfully'
                        : 'Verification check completed'
                    }}
                  </p>
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
