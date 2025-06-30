<script setup>
import { onMounted, ref, watch } from 'vue'
import { apiClient } from '~/api/api-client'

const props = defineProps({
  initialIdentifier: {
    type: String,
    default: ''
  },
  autoVerify: {
    type: Boolean,
    default: false
  }
})

const identifier = ref(props.initialIdentifier)
const badge = ref(null)
const rawCredential = ref(null)
const loading = ref(false)
const error = ref(null)
const isVerified = ref(null)
const verificationChecks = ref(null)
const jsonInput = ref('')
const verifyMode = ref('id') // 'id' or 'json'
const fileError = ref(null)
const uploadedFileName = ref('')

// Auto-verify on mount if autoVerify is true and initialIdentifier is provided
onMounted(() => {
  if (props.autoVerify && props.initialIdentifier) {
    verifyById()
  }
})

// Update identifier when initialIdentifier prop changes
watch(() => props.initialIdentifier, (newVal) => {
  identifier.value = newVal
})

function setVerifyMode(mode) {
  verifyMode.value = mode
  error.value = null
  fileError.value = null
  isVerified.value = null
  badge.value = null
  rawCredential.value = null
  verificationChecks.value = null
  jsonInput.value = ''
  uploadedFileName.value = ''
}

async function handleFileUpload(event) {
  fileError.value = null
  const file = event.target.files && event.target.files[0]
  if (!file) { return }
  uploadedFileName.value = file.name
  if (file.type !== 'application/json') {
    fileError.value = 'Please upload a valid JSON file.'
    return
  }
  try {
    const text = await file.text()
    jsonInput.value = text
    // Try to parse for preview
    JSON.parse(text)
  }
  catch (e) {
    fileError.value = 'Invalid JSON file.'
    jsonInput.value = ''
  }
}

function handleVerify() {
  if (verifyMode.value === 'id') {
    verifyById()
  }
  else {
    verifyByJson()
  }
}

async function verifyById() {
  if (!identifier.value.trim()) {
    error.value = 'Please enter a credential identifier'
    return
  }

  loading.value = true
  error.value = null
  badge.value = null
  rawCredential.value = null
  isVerified.value = null
  verificationChecks.value = null

  try {
    const result = await apiClient.verifyBadge(identifier.value)
    isVerified.value = result.verified
    badge.value = result.credential || null
    rawCredential.value = result.rawCredential || null
    verificationChecks.value = result.checks || null

    if (!result.verified && result.error) {
      error.value = result.error
    }
  }
  catch (err) {
    console.error('Error verifying badge:', err)
    error.value = 'Failed to verify badge. Please check the identifier and try again.'
    isVerified.value = false
  }
  finally {
    loading.value = false
  }
}

async function verifyByJson() {
  if (!jsonInput.value.trim()) {
    error.value = 'Please enter credential JSON'
    return
  }

  loading.value = true
  error.value = null
  badge.value = null
  rawCredential.value = null
  isVerified.value = null
  verificationChecks.value = null

  try {
    // Parse the JSON input
    let credentialData
    try {
      credentialData = JSON.parse(jsonInput.value)
    }
    catch (e) {
      throw new Error('Invalid JSON format. Please check your input.')
    }

    // Validate the credential
    const result = await apiClient.validateExternalBadge(credentialData)
    isVerified.value = result.verified
    badge.value = result.credential || null
    rawCredential.value = result.rawCredential || null
    verificationChecks.value = result.checks || null

    if (!result.verified && result.error) {
      error.value = result.error
    }
  }
  catch (err) {
    console.error('Error validating badge:', err)
    error.value = err instanceof Error ? err.message : 'Failed to validate badge.'
    isVerified.value = false
  }
  finally {
    loading.value = false
  }
}

function handleShare() {
  if (!badge.value) { return }

  // Create share data
  const shareData = {
    title: `${badge.value.name || 'Achievement Badge'}`,
    text: `Check out my badge: ${badge.value.name}`,
    url: window.location.href,
  }

  try {
    if (navigator.share) {
      navigator.share(shareData)
    }
    else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard')
    }
  }
  catch (err) {
    console.error('Error sharing:', err)
  }
}
</script>

<template>
  <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-text-primary">
        Verify Certificate
      </h2>
      <p class="mt-2 text-text-secondary">
        Verify the authenticity of a certificate or badge
      </p>
    </div>

    <!-- Verification Mode Tabs -->
    <div class="flex justify-center mb-6 gap-4">
      <button
        type="button"
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors" :class="[verifyMode === 'id' ? 'bg-[#5AB69F] text-black' : 'bg-gray-100 text-text-secondary hover:text-text-primary']"
        @click="setVerifyMode('id')"
      >
        By Certificate ID
      </button>
      <button
        type="button"
        class="px-4 py-2 rounded-full text-sm font-medium transition-colors" :class="[verifyMode === 'json' ? 'bg-[#5AB69F] text-black' : 'bg-gray-100 text-text-secondary hover:text-text-primary']"
        @click="setVerifyMode('json')"
      >
        By JSON File
      </button>
    </div>

    <!-- Verification Form -->
    <form class="space-y-6" @submit.prevent="handleVerify">
      <!-- Certificate ID Input -->
      <div v-if="verifyMode === 'id'">
        <label for="certificateId" class="block text-sm font-medium text-text-primary">
          Certificate ID or Hash
        </label>
        <div class="mt-1">
          <input
            id="certificateId"
            v-model="identifier"
            type="text"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
            placeholder="Enter certificate ID or hash"
          >
        </div>
      </div>

      <!-- File Upload & Preview -->
      <div v-if="verifyMode === 'json'">
        <label for="file-upload" class="block text-sm font-medium text-text-primary mb-2">
          Certificate JSON File
        </label>
        <div class="flex flex-col items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#00E5C5] transition-colors">
          <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-full flex items-center justify-center mb-4">
            <div class="w-6 h-6 i-heroicons-cloud-arrow-up text-[#5AB69F]" />
          </div>
          <label class="relative cursor-pointer rounded-md font-medium text-[#5AB69F] hover:text-[#5AB69F]/80 focus-within:outline-none">
            <span>Upload a file</span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              class="sr-only"
              accept=".json"
              @change="handleFileUpload"
            >
          </label>
          <p class="pl-1">
            or drag and drop
          </p>
          <p class="text-xs text-text-secondary mt-2">
            Supports JSON files containing Open Badges or Verifiable Credentials
          </p>
          <div v-if="uploadedFileName" class="mt-2 text-xs text-text-secondary">
            Selected: {{ uploadedFileName }}
          </div>
          <div v-if="fileError" class="mt-2 text-xs text-red-600">
            {{ fileError }}
          </div>
        </div>
        <!-- Preview -->
        <div v-if="jsonInput && !fileError" class="mt-4 bg-gray-50 rounded-lg p-4 text-xs font-mono overflow-x-auto">
          <pre>{{ JSON.stringify(JSON.parse(jsonInput), null, 2) }}</pre>
        </div>
      </div>

      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          :disabled="loading || (verifyMode === 'id' ? !identifier : !jsonInput || fileError)"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-white bg-[#5AB69F] hover:bg-[#5AB69F]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!loading">Verify Certificate</span>
          <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </button>
      </div>
    </form>

    <!-- Verification Result -->
    <div v-if="loading">
      <div class="flex justify-center py-8">
        <div class="i-lucide-loader animate-spin w-8 h-8" />
      </div>
    </div>

    <template v-else-if="error">
      <NAlert variant="error" class="mb-4">
        {{ error }}
      </NAlert>
    </template>

    <template v-else-if="isVerified !== null">
      <div class="mt-8">
        <div
          class="p-6 rounded-lg"
          :class="{
            'bg-green-50': isVerified,
            'bg-red-50': !isVerified,
          }"
        >
          <!-- Result Header -->
          <div class="flex items-center">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center"
              :class="{
                'bg-green-100': isVerified,
                'bg-red-100': !isVerified,
              }"
            >
              <div
                class="w-6 h-6"
                :class="{
                  'i-heroicons-check-circle text-green-600': isVerified,
                  'i-heroicons-x-circle text-red-600': !isVerified,
                }"
              />
            </div>
            <div class="ml-4">
              <h3
                class="text-lg font-medium"
                :class="{
                  'text-green-800': isVerified,
                  'text-red-800': !isVerified,
                }"
              >
                {{ isVerified ? 'Certificate Verified' : 'Verification Failed' }}
              </h3>
              <p
                class="text-sm"
                :class="{
                  'text-green-600': isVerified,
                  'text-red-600': !isVerified,
                }"
              >
                {{ verificationChecks && verificationChecks.length > 0 ? verificationChecks[0].message : error }}
              </p>
            </div>
          </div>

          <!-- Certificate Details -->
          <div v-if="isVerified" class="mt-6 space-y-4">
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">Issuer</span>
              <span class="font-medium text-text-primary">{{ badge?.issuer?.name || 'Unknown Issuer' }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">Issue Date</span>
              <span class="font-medium text-text-primary">{{ badge?.issuanceDate ? new Date(badge.issuanceDate).toLocaleDateString() : 'Unknown' }}</span>
            </div>
            <div v-if="badge?.expirationDate" class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">Expiry Date</span>
              <span class="font-medium text-text-primary">{{ new Date(badge.expirationDate).toLocaleDateString() }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-secondary">ID</span>
              <span class="font-medium text-text-primary">{{ badge?.id }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
