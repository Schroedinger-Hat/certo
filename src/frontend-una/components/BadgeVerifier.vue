<script setup>
import { ref, onMounted, watch } from 'vue'
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

function handleVerify() {
  if (verifyMode.value === 'id') {
    verifyById()
  } else {
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
  } catch (err) {
    console.error('Error verifying badge:', err)
    error.value = 'Failed to verify badge. Please check the identifier and try again.'
    isVerified.value = false
  } finally {
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
    } catch (e) {
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
  } catch (err) {
    console.error('Error validating badge:', err)
    error.value = err instanceof Error ? err.message : 'Failed to validate badge.'
    isVerified.value = false
  } finally {
    loading.value = false
  }
}

function handleShare() {
  if (!badge.value) return

  // Create share data
  const shareData = {
    title: `${badge.value.name || 'Achievement Badge'}`,
    text: `Check out my badge: ${badge.value.name}`,
    url: window.location.href,
  }

  try {
    if (navigator.share) {
      navigator.share(shareData)
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard')
    }
  } catch (err) {
    console.error('Error sharing:', err)
  }
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-6">
    <template v-if="!autoVerify">
      <h2 class="text-2xl font-bold mb-4">Verify Open Badge</h2>
      
      <div class="mb-6">
        <div class="flex gap-4 mb-4">
          <NButton
            @click="verifyMode = 'id'"
            :variant="verifyMode === 'id' ? 'solid' : 'outline'"
          >
            Verify by ID
          </NButton>
          <NButton
            @click="verifyMode = 'json'"
            :variant="verifyMode === 'json' ? 'solid' : 'outline'"
          >
            Verify JSON
          </NButton>
        </div>

        <div v-if="verifyMode === 'id'" class="flex gap-2">
          <NInput
            v-model="identifier"
            placeholder="Enter credential identifier"
            class="flex-1"
          />
          <NButton
            @click="handleVerify"
            :loading="loading"
          >
            {{ loading ? 'Verifying...' : 'Verify' }}
          </NButton>
        </div>
        
        <div v-else class="flex flex-col gap-2">
          <NTextarea
            v-model="jsonInput"
            placeholder="Paste credential JSON here"
            rows="8"
            class="font-mono text-sm"
          />
          <div class="flex justify-end">
            <NButton
              @click="handleVerify"
              :loading="loading"
            >
              {{ loading ? 'Verifying...' : 'Verify' }}
            </NButton>
          </div>
        </div>
      </div>
    </template>

    <template v-if="loading">
      <div class="flex justify-center py-8">
        <div class="i-lucide-loader animate-spin w-8 h-8"></div>
      </div>
    </template>

    <template v-else-if="error">
      <NAlert variant="error" class="mb-4">
        {{ error }}
      </NAlert>
    </template>

    <template v-else-if="isVerified !== null">
      <div class="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg mb-6">
        <div class="flex items-center mb-4">
          <div v-if="isVerified" class="i-lucide-check-circle w-6 h-6 text-green-500 mr-2"></div>
          <div v-else class="i-lucide-x-circle w-6 h-6 text-red-500 mr-2"></div>
          <h3 class="text-xl font-semibold">
            {{ isVerified ? 'Credential Verified' : 'Verification Failed' }}
          </h3>
        </div>

        <template v-if="verificationChecks && verificationChecks.length > 0">
          <div class="mb-4">
            <h4 class="font-medium mb-2">Verification Details:</h4>
            <ul class="space-y-2">
              <li 
                v-for="(check, index) in verificationChecks" 
                :key="index"
                class="flex items-start"
              >
                <div 
                  :class="[
                    'w-5 h-5 mr-2 flex-shrink-0', 
                    check.result === 'success' ? 'i-lucide-check text-green-500' : 
                    check.result === 'warning' ? 'i-lucide-alert-triangle text-yellow-500' : 
                    'i-lucide-x text-red-500'
                  ]"
                ></div>
                <div>
                  <div class="font-medium">{{ check.check }}</div>
                  <div v-if="check.message" class="text-sm text-gray-600 dark:text-gray-400">
                    {{ check.message }}
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </template>

        <template v-if="badge">
          <div class="border-t dark:border-gray-700 pt-4 mt-4">
            <h4 class="font-medium mb-2">Credential Information:</h4>
            
            <div class="grid md:grid-cols-2 gap-4">
              <div>
                <div class="mb-4">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Name</div>
                  <div>{{ badge.name || 'Unnamed Credential' }}</div>
                </div>
                
                <div class="mb-4">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Description</div>
                  <div>{{ badge.description || 'No description provided' }}</div>
                </div>
                
                <div class="mb-4">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Issuer</div>
                  <div>{{ badge.issuer?.name || 'Unknown Issuer' }}</div>
                </div>
              </div>
              
              <div>
                <div class="mb-4">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Issuance Date</div>
                  <div>{{ badge.issuanceDate ? new Date(badge.issuanceDate).toLocaleDateString() : 'Unknown' }}</div>
                </div>
                
                <div class="mb-4" v-if="badge.expirationDate">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">Expiration Date</div>
                  <div>{{ new Date(badge.expirationDate).toLocaleDateString() }}</div>
                </div>
                
                <div class="mb-4">
                  <div class="text-sm font-medium text-gray-500 dark:text-gray-400">ID</div>
                  <div class="truncate">{{ badge.id }}</div>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end mt-4">
              <NuxtLink :to="`/credentials/${encodeURIComponent(identifier)}`" v-if="!autoVerify && isVerified" class="mr-3">
                <NButton variant="outline">
                  <div class="i-lucide-external-link mr-2"></div>
                  View Full Details
                </NButton>
              </NuxtLink>
              <NButton @click="handleShare">
                <div class="i-lucide-share-2 mr-2"></div>
                Share Credential
              </NButton>
            </div>
          </div>
        </template>
      </div>
    </template>


  </div>
</template> 