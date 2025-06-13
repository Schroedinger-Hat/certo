<script setup>
defineOptions({
  name: 'BadgeIssuanceForm'
})

import { ref, onMounted, computed } from 'vue'
import { apiClient } from '~/api/api-client'
import { useRuntimeConfig } from '#app'
import Papa from 'papaparse'

const badges = ref([])
const selectedBadge = ref(null)
const isLoadingBadges = ref(true)
const badgeError = ref(null)

// Recipient form
const recipientName = ref('')
const recipientEmail = ref('')
const issuingBadge = ref(false)
const issuanceSuccess = ref(false)
const issuanceError = ref(null)
const emailSent = ref(null)
const emailError = ref(null)

// Evidence fields
const evidenceEntries = ref([{ name: '', description: '', url: '' }])

// Batch issuance state
const csvFile = ref(null)
const csvResults = ref([])
const batchIssuing = ref(false)
const batchError = ref(null)
const batchSuccess = ref(false)
const batchResults = ref([])

// Helper function to get badge image URL from various data structures
function getBadgeImageUrl(badge) {
  const apiUrl = useRuntimeConfig().public.apiUrl || 'http://localhost:1337'
  
  // Handle Strapi nested format: data.attributes structure
  if (badge.attributes?.image?.data?.attributes?.url) {
    return `${apiUrl}${badge.attributes.image.data.attributes.url}`
  }
  
  // Handle flat Strapi format with image object
  if (badge.image?.url) {
    return `${apiUrl}${badge.image.url}`
  }
  
  // Handle direct imageUrl property
  if (badge.imageUrl) {
    return badge.imageUrl.startsWith('http') 
      ? badge.imageUrl 
      : `${apiUrl}${badge.imageUrl}`
  }
  
  // Handle data.attributes format with direct URL
  if (badge.attributes?.image?.url) {
    return `${apiUrl}${badge.attributes.image.url}`
  }
  
  // Handle image as string URL
  if (typeof badge.image === 'string') {
    return badge.image.startsWith('http')
      ? badge.image
      : `${apiUrl}${badge.image}`
  }
  
  // No image found
  return null
}

// Computed property to format badge data
const formattedBadges = computed(() => {
  return badges.value.map(badge => {
    const attrs = badge.attributes || badge
    
    return {
      id: badge.id,
      name: attrs.name,
      description: attrs.description,
      image: attrs.image,
      issuer: attrs.issuer,
      imageUrl: getBadgeImageUrl(badge)
    }
  })
})

onMounted(async () => {
  await loadBadges()
})

async function loadBadges() {
  isLoadingBadges.value = true
  badgeError.value = null
  
  try {
    const response = await apiClient.getBadges()
    
    // Check if we have valid response data
    if (!response) {
      console.error('Invalid badge response format - no response')
      badgeError.value = 'Failed to load badges - invalid response format'
      badges.value = []
      return
    }
    
    // Handle different response formats
    let badgeData
    
    if (Array.isArray(response)) {
      // Direct array of badges
      badgeData = response
      console.log('Received direct array of badges:', badgeData.length)
    } else if (response.data && Array.isArray(response.data)) {
      // Strapi format with data array
      badgeData = response.data
      console.log('Received Strapi-format badges:', badgeData.length)
    } else {
      console.error('Invalid badge response format:', response)
      badgeError.value = 'Failed to load badges - unexpected data format'
      badges.value = []
      return
    }
    
    // Process badges for display
    badges.value = badgeData.map(badge => {
      // For badges already in the correct format, just return them
      if (badge.name && badge.id) {
        return badge
      }
      
      // For Strapi format, ensure attributes exist
      if (!badge.attributes) {
        badge.attributes = {}
      }
      
      return badge
    })
    
    console.log('Loaded badges:', badges.value.length)
    
    // Log the first badge as an example for debugging
    if (badges.value.length > 0) {
      console.log('Sample badge structure:', JSON.stringify(badges.value[0], null, 2))
      logBadgeImageData(badges.value[0])
    }
  } catch (error) {
    console.error('Error loading badges:', error)
    badgeError.value = 'Failed to load badges. Please try again later.'
    badges.value = []
  } finally {
    isLoadingBadges.value = false
  }
}

// Debug function to check image data in the badge
function logBadgeImageData(badge) {
  console.log('=== Badge Image Data Debug ===')
  console.log('Badge ID:', badge.id)
  console.log('Badge name:', badge.attributes?.name || badge.name)
  
  // Check for Strapi nested format (data.attributes)
  if (badge.attributes?.image?.data) {
    console.log('Image format: Strapi nested (data.attributes)')
    console.log('Image data:', badge.attributes.image.data)
    if (badge.attributes.image.data.attributes) {
      console.log('Image URL:', badge.attributes.image.data.attributes.url)
    }
  } 
  // Check for image object with URL
  else if (badge.image?.url) {
    console.log('Image format: Object with URL')
    console.log('Image URL:', badge.image.url)
  }
  // Check for direct imageUrl property
  else if (badge.imageUrl) {
    console.log('Image format: Direct imageUrl property')
    console.log('Image URL:', badge.imageUrl)
  }
  // Check for direct image string
  else if (typeof badge.image === 'string') {
    console.log('Image format: Direct string URL')
    console.log('Image URL:', badge.image)
  }
  // Check for Strapi nested format without data
  else if (badge.attributes?.image?.url) {
    console.log('Image format: Strapi image with direct URL')
    console.log('Image URL:', badge.attributes.image.url)
  }
  // No image found
  else {
    console.log('No image found in badge data')
  }
  
  console.log('Resolved image URL:', getBadgeImageUrl(badge))
  console.log('=== End Debug ===')
}

function selectBadge(badge) {
  selectedBadge.value = badge
  const badgeName = badge.attributes?.name || badge.name || 'Unknown Badge'
  const badgeId = badge.id
  const imageUrl = getBadgeImageUrl(badge)
  
  // Log detailed information for debugging
  console.log(`Selected badge: ${badgeName} (ID: ${badgeId})`)
  console.log('Badge image URL:', imageUrl)
  console.log('Badge data structure:', JSON.stringify(badge, null, 2))
}

function addEvidenceEntry() {
  evidenceEntries.value.push({ name: '', description: '', url: '' })
}

function removeEvidenceEntry(index) {
  evidenceEntries.value.splice(index, 1)
}

async function handleSubmit() {
  if (!selectedBadge.value) {
    issuanceError.value = 'Please select a badge to issue'
    return
  }
  
  if (!recipientName.value || !recipientEmail.value) {
    issuanceError.value = 'Please fill in all recipient details'
    return
  }
  
  issuingBadge.value = true
  issuanceError.value = null
  issuanceSuccess.value = false
  
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail.value)) {
      throw new Error('Please enter a valid email address')
    }
    
    // Get badge ID - handle both formats
    const badgeId = selectedBadge.value.id
    
    if (!badgeId) {
      throw new Error('The selected badge has an invalid ID')
    }
    
    // Filter out empty evidence entries
    const evidence = evidenceEntries.value
      .filter(e => e.name.trim() || e.description.trim() || e.url.trim())
      .map(e => ({
        name: e.name.trim(),
        description: e.description.trim(),
        url: e.url.trim()
      }))
    
    // Log what we're about to submit
    console.log('Issuing badge with data:', {
      badgeId,
      badgeName: selectedBadge.value.attributes?.name || selectedBadge.value.name,
      recipient: {
        name: recipientName.value,
        email: recipientEmail.value
      },
      evidenceCount: evidence.length
    })
    
    // Issue the badge
    const result = await apiClient.issueBadge(
      badgeId,
      {
        name: recipientName.value,
        email: recipientEmail.value
      },
      evidence
    )
    
    console.log('Badge issuance result:', result)
    issuanceSuccess.value = true
    
    // Check if email notification was sent
    if (result && result.notification) {
      emailSent.value = result.notification.emailSent
      emailError.value = result.notification.emailError
      
      // Add a notification about email status
      if (result.notification.emailSent) {
        console.log('Email notification sent to recipient')
      } else if (result.notification.emailError) {
        console.warn('Email notification failed:', result.notification.emailError)
      }
    } else {
      emailSent.value = null
      emailError.value = null
    }
    
    // Reset form
    recipientName.value = ''
    recipientEmail.value = ''
    evidenceEntries.value = [{ name: '', description: '', url: '' }]
    selectedBadge.value = null
    
  } catch (error) {
    console.error('Error issuing badge:', error)
    
    // Detailed error handling
    if (error instanceof Error) {
      issuanceError.value = error.message
    } else if (typeof error === 'object' && error !== null) {
      // Try to extract error message from various possible API error formats
      const errorObj = error
      if (errorObj.message) {
        issuanceError.value = errorObj.message
      } else if (errorObj.error?.message) {
        issuanceError.value = errorObj.error.message
      } else if (errorObj.data?.error?.message) {
        issuanceError.value = errorObj.data.error.message
      } else {
        issuanceError.value = 'Failed to issue badge. Please try again.'
      }
    } else {
      issuanceError.value = 'Failed to issue badge. Please try again.'
    }
  } finally {
    issuingBadge.value = false
  }
}

function handleCsvFileChange(event) {
  const files = event.target.files
  if (files && files.length > 0) {
    csvFile.value = files[0]
    batchError.value = null
    batchResults.value = []
  }
}

function downloadCsvTemplate() {
  const csv = 'name,email\nJane Doe,jane@example.com\nJohn Smith,john@example.com\n'
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'recipients-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

async function handleBatchIssue() {
  batchError.value = null
  batchSuccess.value = false
  batchResults.value = []
  if (!selectedBadge.value) {
    batchError.value = 'Please select a badge to issue.'
    return
  }
  if (!csvFile.value) {
    batchError.value = 'Please select a CSV file.'
    return
  }
  batchIssuing.value = true
  try {
    const text = await csvFile.value.text()
    const { data, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })
    if (errors.length > 0) {
      batchError.value = 'CSV parsing error: ' + errors.map(e => e.message).join('; ')
      batchIssuing.value = false
      return
    }
    // Validate rows
    const recipients = Array.isArray(data) ? data.filter(row => row.name && row.email) : []
    if (recipients.length === 0) {
      batchError.value = 'No valid recipients found in CSV.'
      batchIssuing.value = false
      return
    }
    // Optionally: validate email format
    const invalidRows = recipients.filter(r => !/^\S+@\S+\.\S+$/.test(r.email))
    if (invalidRows.length > 0) {
      batchError.value = `Invalid email(s): ${invalidRows.map(r => r.email).join(', ')}`
      batchIssuing.value = false
      return
    }
    // Call API
    const badgeId = selectedBadge.value.id
    const result = await apiClient.batchIssueBadges(badgeId, recipients, evidenceEntries.value)
    batchResults.value = result.results
    batchSuccess.value = true
  } catch (error) {
    batchError.value = error && error.message ? error.message : 'Batch issuance failed.'
  } finally {
    batchIssuing.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <NAlert v-if="badgeError" variant="error" class="mb-6">
      {{ badgeError }}
    </NAlert>
    
    <div v-if="isLoadingBadges" class="flex justify-center py-12">
      <div class="i-lucide-loader animate-spin w-8 h-8"></div>
    </div>
    
    <NAlert v-if="issuanceSuccess" variant="success" class="mb-6">
      <div>
        <p class="font-medium">Badge issued successfully!</p>
        <template v-if="emailSent === true">
          <p class="text-sm mt-1">✓ Notification email sent to {{ recipientEmail }}</p>
        </template>
        <template v-else-if="emailSent === false">
          <p class="text-sm mt-1 text-amber-600">
            ⚠️ Notification email could not be sent to the recipient.
          </p>
          <p v-if="emailError" class="text-xs mt-1 text-amber-700">{{ emailError }}</p>
        </template>
        <template v-else>
          <p class="text-sm mt-1">Recipient will be notified.</p>
        </template>
      </div>
    </NAlert>
    
    <NAlert v-if="issuanceError" variant="error" class="mb-6">
      {{ issuanceError }}
    </NAlert>
    
    <form @submit.prevent="handleSubmit">
      <!-- Step 1: Select Badge -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Step 1: Select Badge</h2>
        
        <!-- Badge Preview (when selected) -->
        <div v-if="selectedBadge" class="mb-6 p-6 border border-primary-200 bg-primary-50 dark:bg-primary-900/10 dark:border-primary-800 rounded-lg">
          <div class="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <!-- Badge Image -->
            <div class="w-32 h-32 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 flex items-center justify-center">
              <img 
                v-if="getBadgeImageUrl(selectedBadge)" 
                :src="getBadgeImageUrl(selectedBadge)" 
                :alt="selectedBadge.attributes?.name || selectedBadge.name || 'Selected Badge'"
                class="max-w-full max-h-full object-contain"
              />
              <div v-else class="i-lucide-award text-primary-400 dark:text-primary-500 w-16 h-16"></div>
            </div>
            
            <!-- Badge Details -->
            <div class="flex-1 text-center sm:text-left">
              <h3 class="text-lg font-semibold">
                {{ selectedBadge.attributes?.name || selectedBadge.name || 'Selected Badge' }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ selectedBadge.attributes?.description || selectedBadge.description || 'No description available' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Issuer: {{ selectedBadge.attributes?.issuer?.data?.attributes?.name || selectedBadge.issuer?.name || 'Unknown Issuer' }}
              </p>
              <NButton 
                class="mt-4" 
                size="sm" 
                variant="outline" 
                @click="selectedBadge = null"
              >
                Change Selection
              </NButton>
            </div>
          </div>
        </div>
        
        <div v-if="badges.length === 0 && !isLoadingBadges && !badgeError" class="text-center py-8">
          <p class="text-gray-500 mb-4">No badges available for issuance.</p>
          <NButton variant="outline" @click="loadBadges">Refresh</NButton>
        </div>
        
        <div v-else-if="!selectedBadge" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="border rounded-lg p-4 cursor-pointer transition-all hover:border-primary-200 hover:bg-primary-50/50 dark:hover:bg-primary-900/5"
            @click="selectBadge(badge)"
          >
            <!-- Badge Card with Centered Image -->
            <div class="flex flex-col items-center">
              <!-- Image with fixed height -->
              <div class="w-24 h-24 mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 flex items-center justify-center">
                <img 
                  v-if="getBadgeImageUrl(badge)" 
                  :src="getBadgeImageUrl(badge)" 
                  :alt="badge.attributes?.name || badge.name || 'Badge'"
                  class="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
                <div v-else class="i-lucide-award text-primary-400 dark:text-primary-500 w-12 h-12"></div>
              </div>
              
              <!-- Badge Info -->
              <div class="text-center">
                <h3 class="font-medium">{{ badge.attributes?.name || badge.name || 'Unnamed Badge' }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ badge.attributes?.issuer?.data?.attributes?.name || badge.issuer?.name || 'Unknown Issuer' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Step 2: Recipient Details -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Step 2: Recipient Details</h2>
        
        <div class="space-y-4">
          <NFormItem label="Recipient Name" required>
            <NInput
              v-model="recipientName"
              placeholder="Enter recipient's full name"
              required
            />
          </NFormItem>
          
          <NFormItem label="Recipient Email" required>
            <NInput
              v-model="recipientEmail"
              type="email"
              placeholder="Enter recipient's email address"
              required
            />
          </NFormItem>
        </div>
      </div>
      
      <!-- Step 3: Evidence (Optional) -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Step 3: Evidence (Optional)</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Add evidence to support this credential issuance.
        </p>
        
        <div class="space-y-6">
          <div 
            v-for="(evidence, index) in evidenceEntries" 
            :key="index"
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-medium">Evidence #{{ index + 1 }}</h3>
              <NButton
                v-if="evidenceEntries.length > 1"
                @click="removeEvidenceEntry(index)"
                size="sm"
                variant="outline"
                class="text-red-600 hover:bg-red-50"
              >
                <div class="i-lucide-trash-2 w-4 h-4"></div>
              </NButton>
            </div>
            
            <div class="space-y-3">
              <NFormItem label="Name">
                <NInput
                  v-model="evidence.name"
                  placeholder="Evidence name"
                />
              </NFormItem>
              
              <NFormItem label="Description">
                <NTextarea
                  v-model="evidence.description"
                  placeholder="Evidence description"
                  rows="2"
                />
              </NFormItem>
              
              <NFormItem label="URL">
                <NInput
                  v-model="evidence.url"
                  placeholder="https://example.com/evidence"
                  type="url"
                />
              </NFormItem>
            </div>
          </div>
          
          <div class="flex justify-center">
            <NButton
              @click="addEvidenceEntry"
              variant="outline"
              type="button"
            >
              <div class="i-lucide-plus mr-2"></div>
              Add Evidence
            </NButton>
          </div>
        </div>
      </div>
      
      <!-- Submit Button -->
      <div class="mt-8">
        <NButton 
          type="submit" 
          variant="primary" 
          block 
          :loading="issuingBadge"
          :disabled="issuingBadge || !selectedBadge"
        >
          {{ issuingBadge ? 'Issuing Badge...' : 'Issue Badge' }}
        </NButton>
      </div>

      <!-- Batch Issuance Section -->
      <div class="mt-12 border-t pt-10">
        <h2 class="text-xl font-semibold mb-4">Batch Issue via CSV</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Import a CSV file of recipients to issue this badge to multiple people at once.<br>
          <NButton size="xs" variant="outline" class="mt-2" @click="downloadCsvTemplate">
            Download CSV Template
          </NButton>
        </p>
        <NFormItem label="Upload CSV File">
          <NInput type="file" accept=".csv" @change="handleCsvFileChange" />
        </NFormItem>
        <NButton 
          variant="primary" 
          :loading="batchIssuing"
          :disabled="batchIssuing || !selectedBadge || !csvFile"
          class="mt-2"
          @click="handleBatchIssue"
        >
          {{ batchIssuing ? 'Issuing Badges...' : 'Batch Issue Badges' }}
        </NButton>
        <NAlert v-if="batchError" variant="error" class="mt-4">{{ batchError }}</NAlert>
        <NAlert v-if="batchSuccess" variant="success" class="mt-4">Batch issuance complete.</NAlert>
        <div v-if="batchResults.length > 0" class="mt-6 overflow-x-auto">
          <table class="min-w-full text-sm border rounded-lg">
            <thead>
              <tr class="bg-primary-50 dark:bg-primary-900/10">
                <th class="px-4 py-2 text-left">Name</th>
                <th class="px-4 py-2 text-left">Email</th>
                <th class="px-4 py-2 text-left">Status</th>
                <th class="px-4 py-2 text-left">Error</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in batchResults" :key="row.recipient.email">
                <td class="px-4 py-2">{{ row.recipient.name }}</td>
                <td class="px-4 py-2">{{ row.recipient.email }}</td>
                <td class="px-4 py-2">
                  <span v-if="row.success" class="text-green-600">Success</span>
                  <span v-else class="text-red-600">Failed</span>
                </td>
                <td class="px-4 py-2 text-xs text-red-500">{{ row.error || '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </form>
  </div>
</template> 