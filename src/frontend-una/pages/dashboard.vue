<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/api/api-client'
import CertificateCard from '~/components/CertificateCard.vue'

definePageMeta({
  title: 'Dashboard - Certo',
  middleware: 'auth'
})

const authStore = useAuthStore()
const tabs = ref([
  { name: 'All', icon: 'i-lucide-list' },
  { name: 'Received', icon: 'i-lucide-download' },
  { name: 'Issued', icon: 'i-lucide-upload' },
  { name: 'Verify', icon: 'i-lucide-check-circle' },
])
const activeTab = ref('Received')

const credentials = ref([])
const isLoading = ref(false)
const error = ref('')

// Verification form data
const verifyForm = ref({
  credentialId: '',
  credentialFile: null
})
const verificationResult = ref(null)
const isVerifying = ref(false)

onMounted(async () => {
  await loadCredentials()
})

async function loadCredentials() {
  if (!authStore.isAuthenticated) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    let response

    if (activeTab.value === 'Received') {
      response = await apiClient.getReceivedCertificates()
    } else if (activeTab.value === 'Issued') {
      response = await apiClient.getIssuedCertificates()
    } else {
      response = await apiClient.getUserCertificates()
    }

    if (!response || !response.data) {
      console.error('Invalid response format:', response)
      error.value = 'Invalid response format from server'
      credentials.value = []
      return
    }

    console.log(`Loaded ${response.data.length} ${activeTab.value.toLowerCase()} credentials`)
    
    // Process the credentials to ensure proper data structure
    const processedCredentials = response.data.map(credential => {
      // If the credential already has the expected format, return it as is
      if (credential.issuer && typeof credential.issuer === 'object') {
        return credential
      }
      
      // Handle nested Strapi format
      if (credential.attributes) {
        const attrs = credential.attributes
        
        // Extract issuer if available
        let issuer = null
        if (attrs.issuer?.data?.attributes) {
          issuer = {
            ...attrs.issuer.data.attributes,
            id: attrs.issuer.data.id
          }
        } else if (attrs.issuer) {
          issuer = attrs.issuer
        }
        
        return {
          ...credential,
          ...attrs,
          issuer: issuer
        }
      }
      
      return credential
    })
    
    // Set the credentials
    credentials.value = processedCredentials
    
    // Log a sample for debugging
    if (processedCredentials.length > 0) {
      console.log('Sample credential:', processedCredentials[0])
      if (processedCredentials[0].issuer) {
        console.log('Issuer information:', processedCredentials[0].issuer)
      }
    }
  } catch (err) {
    console.error('Error loading credentials:', err)
    error.value = 'Failed to load credentials'
    credentials.value = []
  } finally {
    isLoading.value = false
  }
}

// Watch for tab changes to reload credentials
watch(activeTab, () => {
  if (activeTab.value !== 'Verify') {
    loadCredentials()
  }
})

async function handleVerifyCredential() {
  if (!verifyForm.value.credentialId) return
  
  isVerifying.value = true
  verificationResult.value = null
  
  try {
    const result = await apiClient.verifyBadge(verifyForm.value.credentialId)
    verificationResult.value = result
    console.log('Verification result:', result)
  } catch (err) {
    console.error('Error verifying credential:', err)
    verificationResult.value = {
      verified: false,
      error: 'Failed to verify credential'
    }
  } finally {
    isVerifying.value = false
  }
}

function getTabMessage() {
  if (activeTab.value === 'Received') {
    return "You haven't received any credentials yet."
  } else if (activeTab.value === 'Issued') {
    return "You haven't issued any credentials yet."
  } else {
    return "You don't have any credentials yet."
  }
}
</script>

<template>
  <div class="py-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Manage your digital credentials
      </p>
    </div>
    
    <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
      <nav class="flex -mb-px">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          @click="activeTab = tab.name"
          class="py-2 px-4 border-b-2 font-medium text-sm transition-colors"
          :class="[
            activeTab === tab.name
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
          ]"
        >
          <div :class="tab.icon" class="mr-2 inline-block"></div>
          {{ tab.name }}
        </button>
      </nav>
    </div>
    
    <!-- Credentials List Tabs -->
    <template v-if="activeTab === 'All' || activeTab === 'Received' || activeTab === 'Issued'">
      <NAlert v-if="error" variant="error" class="mb-4">
        {{ error }}
      </NAlert>
      
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="i-lucide-loader animate-spin w-8 h-8"></div>
      </div>
      
      <div v-else-if="credentials.length === 0" class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="i-lucide-award w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600"></div>
        <h3 class="text-xl font-semibold mb-2">No Credentials</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ getTabMessage() }}
        </p>
        <NButton v-if="activeTab === 'Issued'" to="/issue" variant="outline">
          Issue New Credential
        </NButton>
        <NButton v-else to="#" variant="outline">
          Learn How to Earn Credentials
        </NButton>
      </div>
      
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CertificateCard 
          v-for="credential in credentials" 
          :key="credential.id" 
          :certificate="credential" 
          @export="loadCredentials"
          @revoke="loadCredentials"
        />
      </div>
    </template>
    
    <!-- Verify Tab -->
    <template v-else-if="activeTab === 'Verify'">
      <NCard class="p-6">
        <template #header>
          <h3 class="text-xl font-semibold">Verify Credential</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Verify the authenticity of a credential
          </p>
        </template>
        
        <form @submit.prevent="handleVerifyCredential" class="mt-4 space-y-4">
          <NFormItem label="Credential ID or Hash">
            <NInput v-model="verifyForm.credentialId" placeholder="Enter credential ID or hash..." />
          </NFormItem>
          
          <div class="text-center">
            <p class="mb-4">Or</p>
            <NButton variant="outline" class="mb-2" type="button">
              <div class="i-lucide-upload mr-2" />
              Upload Credential File
            </NButton>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Support for JSON files containing Open Badges or Verifiable Credentials
            </p>
          </div>
          
          <div class="flex justify-end mt-6">
            <NButton type="submit" :loading="isVerifying">
              {{ isVerifying ? 'Verifying...' : 'Verify Credential' }}
            </NButton>
          </div>
        </form>
        
        <template v-if="verificationResult">
          <div class="mt-8 p-4 rounded-lg" :class="[
            verificationResult.verified ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
          ]">
            <h3 class="text-lg font-semibold" :class="[
              verificationResult.verified ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            ]">
              {{ verificationResult.verified ? 'Credential Verified' : 'Verification Failed' }}
            </h3>
            
            <p v-if="verificationResult.error" class="mt-2 text-red-600 dark:text-red-400">
              {{ verificationResult.error }}
            </p>
            
            <div v-if="verificationResult.verified" class="mt-4 space-y-2">
              <div v-if="verificationResult.issuer" class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Issuer:</span>
                <span class="text-sm font-medium">{{ verificationResult.issuer.name }}</span>
              </div>
              <div v-if="verificationResult.issuanceDate" class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Issued On:</span>
                <span class="text-sm">{{ new Date(verificationResult.issuanceDate).toLocaleDateString() }}</span>
              </div>
              <div v-if="verificationResult.expirationDate" class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Expires On:</span>
                <span class="text-sm">{{ new Date(verificationResult.expirationDate).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </template>
      </NCard>
    </template>
  </div>
</template> 