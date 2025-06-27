<script setup lang="ts">
import { useRuntimeConfig } from '#app'
import { computed, onMounted, ref } from 'vue'
import { apiClient } from '~/api/api-client'

interface StrapiImage {
  data?: {
    attributes?: {
      url?: string
    }
  }
}

interface StrapiCreator {
  data?: {
    attributes?: {
      name?: string
      url?: string
    }
  }
}

interface Badge {
  id: string
  name: string
  description: string
  achievementType?: string
  criteria?: {
    narrative?: string
    url?: string
  }
  tags?: string[]
  skills?: {
    skillName: string
    skillDescription?: string
    skillType?: string
    level?: string
  }[]
  alignment?: {
    targetName: string
    targetDescription?: string
    targetFramework?: string
    targetCode?: string
  }[]
  image?: StrapiImage
  creator?: StrapiCreator
  issuer?: {
    data?: {
      attributes?: {
        name?: string
        url?: string
      }
    }
  }
  attributes?: {
    name?: string
    description?: string
    achievementType?: string
    criteria?: {
      narrative?: string
      url?: string
    }
    tags?: string[]
    skills?: {
      skillName: string
      skillDescription?: string
      skillType?: string
      level?: string
    }[]
    alignment?: {
      targetName: string
      targetDescription?: string
      targetFramework?: string
      targetCode?: string
    }[]
    image?: StrapiImage
    creator?: StrapiCreator
    issuer?: {
      data?: {
        attributes?: {
          name?: string
          url?: string
        }
      }
    }
  }
}

interface EvidenceEntry {
  name: string
  description: string
  url: string
}

interface BatchResult {
  success: boolean
  recipient: Recipient
  error?: string
  credential?: any
}

interface CsvRow {
  name: string
  email: string
  organization?: string
}

interface Recipient {
  name: string
  email: string
  organization?: string
}

const props = defineProps<{
  initialBadge?: Badge
}>()

const emit = defineEmits<{
  (e: 'submit', recipients: Recipient[]): void
  (e: 'error', message: string): void
}>()

// Component state
const badges = ref<Badge[]>([])
const selectedBadge = ref<Badge | null>(props.initialBadge || null)
const recipientName = ref('')
const recipientEmail = ref('')
const isLoadingBadges = ref(false)
const issuingBadge = ref(false)
const issuanceSuccess = ref(false)
const badgeError = ref<string>()
const issuanceError = ref<string>()

// Recipient form state
const emailSent = ref<boolean | null>(null)
const emailError = ref<string | undefined>(undefined)

// Evidence fields
const evidenceEntries = ref<EvidenceEntry[]>([{ name: '', description: '', url: '' }])

// Batch issuance state
const csvFile = ref<File | null>(null)
const csvResults = ref<CsvRow[]>([])
const batchIssuing = ref(false)
const batchError = ref<string | undefined>(undefined)
const batchSuccess = ref(false)
const batchResults = ref<BatchResult[]>([])

// Helper function to get badge image URL from various data structures
function getBadgeImageUrl(badge: Badge): string | undefined {
  const apiUrl = useRuntimeConfig().public.apiUrl

  // Handle Strapi nested format: data.attributes structure
  if (badge.attributes?.image?.data?.attributes?.url) {
    return `${apiUrl}${badge.attributes.image.data.attributes.url}`
  }

  // Handle direct image object with data structure
  if (badge.image?.data?.attributes?.url) {
    return `${apiUrl}${badge.image.data.attributes.url}`
  }

  return undefined
}

// Computed property to format badge data
const formattedBadges = computed(() => {
  return badges.value.map((badge) => {
    const attrs = badge.attributes || {}

    return {
      id: badge.id,
      name: attrs.name || badge.name,
      description: attrs.description || badge.description,
      image: attrs.image || badge.image,
      issuer: attrs.issuer || badge.issuer,
      imageUrl: getBadgeImageUrl(badge)
    }
  })
})

onMounted(async () => {
  await loadBadges()
})

async function loadBadges() {
  isLoadingBadges.value = true
  badgeError.value = undefined

  try {
    const response = await apiClient.getAvailableBadges()

    if (!response) {
      console.error('Invalid badge response format - no response')
      badgeError.value = 'Failed to load badges'
      badges.value = []
      return
    }

    // Process badges for display
    badges.value = response.data.map((badge) => {
      const data = badge.attributes || badge
      return {
        id: String(badge.id), // Convert to string to match Badge interface
        name: data.name || '',
        description: data.description || '',
        achievementType: data.achievementType,
        criteria: data.criteria,
        tags: data.tags,
        skills: data.skills,
        alignment: data.alignment,
        image: data.image,
        creator: data.creator,
        issuer: data.issuer,
        attributes: {
          name: data.name || '',
          description: data.description || '',
          achievementType: data.achievementType,
          criteria: data.criteria,
          tags: data.tags,
          skills: data.skills,
          alignment: data.alignment,
          image: data.image,
          creator: data.creator,
          issuer: data.issuer
        }
      } as Badge
    })
  } catch (error) {
    console.error('Error loading badges:', error)
    badgeError.value = 'Failed to load badges'
    badges.value = []
  }
  finally {
    isLoadingBadges.value = false
  }
}

function selectBadge(badge: Badge) {
  selectedBadge.value = badge
}

function addEvidenceEntry() {
  evidenceEntries.value.push({ name: '', description: '', url: '' })
}

function removeEvidenceEntry(index: number) {
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
  issuanceError.value = undefined

  try {
    const recipient = {
      name: recipientName.value,
      email: recipientEmail.value
    }

    await apiClient.issueBadge(
      selectedBadge.value.id,
      recipient,
      evidenceEntries.value.filter(e => e.name && e.description && e.url)
    )

    issuanceSuccess.value = true

    // Reset form
    recipientName.value = ''
    recipientEmail.value = ''
    evidenceEntries.value = [{ name: '', description: '', url: '' }]
  }
  catch (error) {
    console.error('Error issuing badge:', error)
    issuanceError.value = error instanceof Error ? error.message : 'Failed to issue badge'
  }
  finally {
    issuingBadge.value = false
  }
}

async function handleBatchSubmit(recipients: Recipient[]) {
  if (!selectedBadge.value || !recipients.length) {
    batchError.value = 'Please select a badge and provide recipients'
    return
  }

  batchIssuing.value = true
  batchError.value = undefined
  batchResults.value = []

  try {
    await apiClient.batchIssueBadges(selectedBadge.value.id, recipients)
    batchSuccess.value = true

    // Reset form
    csvFile.value = null
    csvResults.value = []
  }
  catch (error) {
    console.error('Error in batch issuance:', error)
    batchError.value = error instanceof Error ? error.message : 'Failed to issue badges'
  }
  finally {
    batchIssuing.value = false
  }
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) { return }

  const file = input.files[0]
  csvFile.value = file

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const content = reader.result as string
      const rows = content.split('\n')
      const parsedRecipients: Recipient[] = []

      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',')
        if (row.length >= 2) {
          const name = row[0]?.trim()
          const email = row[1]?.trim()
          const organization = row[2]?.trim()

          if (name && email) {
            parsedRecipients.push({
              name,
              email,
              organization
            })
          }
        }
      }

      handleBatchSubmit(parsedRecipients)
    }
    catch (error) {
      console.error('Error parsing CSV:', error)
      batchError.value = 'Failed to parse CSV file'
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <NAlert v-if="badgeError" variant="error" class="mb-6">
      {{ badgeError }}
    </NAlert>

    <div v-if="isLoadingBadges" class="flex justify-center py-12">
      <div class="i-lucide-loader animate-spin w-8 h-8" />
    </div>

    <NAlert v-if="issuanceSuccess" variant="success" class="mb-6">
      <div>
        <p class="font-medium">
          Badge issued successfully!
        </p>
        <template v-if="emailSent === true">
          <p class="text-sm mt-1">
            ✓ Notification email sent to {{ recipientEmail }}
          </p>
        </template>
        <template v-else-if="emailSent === false">
          <p class="text-sm mt-1 text-amber-600">
            ⚠️ Notification email could not be sent to the recipient.
          </p>
          <p v-if="emailError" class="text-xs mt-1 text-amber-700">
            {{ emailError }}
          </p>
        </template>
        <template v-else>
          <p class="text-sm mt-1">
            Recipient will be notified.
          </p>
        </template>
      </div>
    </NAlert>

    <NAlert v-if="issuanceError" variant="error" class="mb-6">
      {{ issuanceError }}
    </NAlert>

    <form @submit.prevent="handleSubmit">
      <!-- Step 1: Select Badge -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">
          Step 1: Select Badge
        </h2>

        <!-- Badge Preview (when selected) -->
        <div v-if="selectedBadge" class="mb-6 p-6 border border-primary-200 bg-primary-50 rounded-lg">
          <div class="flex flex-col sm:flex-row gap-6">
            <!-- Badge Image -->
            <div class="w-32 h-32 bg-white rounded-lg shadow-sm p-2 flex items-center justify-center">
              <img
                v-if="getBadgeImageUrl(selectedBadge)"
                :src="getBadgeImageUrl(selectedBadge)"
                :alt="selectedBadge.attributes?.name || selectedBadge.name || 'Selected Badge'"
                class="max-w-full max-h-full object-contain"
              >
              <div v-else class="i-lucide-award text-primary-400 w-16 h-16" />
            </div>

            <!-- Badge Details -->
            <div class="flex-1">
              <h3 class="text-lg font-semibold">
                {{ selectedBadge.attributes?.name || selectedBadge.name || 'Selected Badge' }}
              </h3>
              <p class="text-sm text-gray-600 mt-2">
                {{ selectedBadge.attributes?.description || selectedBadge.description || 'No description available' }}
              </p>

              <!-- Badge Metadata -->
              <div class="mt-4 space-y-2">
                <!-- Type -->
                <div class="flex items-center text-sm">
                  <span class="text-gray-500 w-24">Type:</span>
                  <span>{{ selectedBadge.attributes?.achievementType || selectedBadge.achievementType || 'Achievement' }}</span>
                </div>

                <!-- Issuer -->
                <div class="flex items-center text-sm">
                  <span class="text-gray-500 w-24">Issuer:</span>
                  <span>{{ selectedBadge.attributes?.creator?.data?.attributes?.name || selectedBadge.creator?.data?.attributes?.name || 'Unknown Issuer' }}</span>
                </div>

                <!-- Criteria -->
                <div v-if="selectedBadge.attributes?.criteria?.narrative || selectedBadge.criteria?.narrative" class="text-sm">
                  <span class="text-gray-500">Criteria:</span>
                  <p class="mt-1 pl-4">
                    {{ selectedBadge.attributes?.criteria?.narrative || selectedBadge.criteria?.narrative }}
                  </p>
                  <a
                    v-if="selectedBadge.attributes?.criteria?.url || selectedBadge.criteria?.url"
                    :href="selectedBadge.attributes?.criteria?.url || selectedBadge.criteria?.url"
                    target="_blank"
                    class="text-primary-600 hover:text-primary-700 mt-1 inline-block"
                  >
                    View Detailed Criteria
                  </a>
                </div>

                <!-- Skills -->
                <div v-if="(selectedBadge.attributes?.skills || selectedBadge.skills || []).length > 0" class="text-sm">
                  <span class="text-gray-500">Skills:</span>
                  <ul class="mt-1 pl-4">
                    <li v-for="skill in (selectedBadge.attributes?.skills || selectedBadge.skills || [])" :key="skill.skillName">
                      {{ skill.skillName }}
                      <span v-if="skill.level" class="text-gray-500">({{ skill.level }})</span>
                    </li>
                  </ul>
                </div>

                <!-- Tags -->
                <div v-if="(selectedBadge.attributes?.tags || selectedBadge.tags || []).length > 0" class="text-sm">
                  <span class="text-gray-500">Tags:</span>
                  <div class="mt-1 flex flex-wrap gap-2">
                    <span
                      v-for="tag in (selectedBadge.attributes?.tags || selectedBadge.tags || [])"
                      :key="tag"
                      class="px-2 py-1 bg-gray-100 rounded text-xs"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>

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

        <!-- Badge Selection Grid -->
        <div v-else-if="!selectedBadge" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="border rounded-lg p-4 cursor-pointer transition-all hover:border-primary-200 hover:bg-primary-50/5"
            @click="selectBadge(badge)"
          >
            <!-- Badge Card -->
            <div class="flex flex-col items-center">
              <!-- Image -->
              <div class="w-24 h-24 mb-3 bg-white rounded-lg shadow-sm p-2 flex items-center justify-center">
                <img
                  v-if="getBadgeImageUrl(badge)"
                  :src="getBadgeImageUrl(badge)"
                  :alt="badge.attributes?.name || badge.name || 'Badge'"
                  class="max-w-full max-h-full object-contain"
                  loading="lazy"
                >
                <div v-else class="i-lucide-award text-primary-400 w-12 h-12" />
              </div>

              <!-- Badge Info -->
              <div class="text-center">
                <h3 class="font-medium">
                  {{ badge.attributes?.name || badge.name || 'Unnamed Badge' }}
                </h3>
                <p class="text-xs text-gray-500 mt-1">
                  {{ badge.attributes?.creator?.data?.attributes?.name || badge.creator?.data?.attributes?.name || 'Unknown Issuer' }}
                </p>
                <p class="text-xs text-gray-600 mt-2 line-clamp-2">
                  {{ badge.attributes?.description || badge.description }}
                </p>

                <!-- Skills Preview -->
                <div v-if="(badge.attributes?.skills || badge.skills || []).length > 0" class="mt-2">
                  <div class="flex flex-wrap gap-1 justify-center">
                    <span
                      v-for="skill in (badge.attributes?.skills || badge.skills || []).slice(0, 2)"
                      :key="skill.skillName"
                      class="px-2 py-0.5 bg-primary-50 rounded-full text-xs"
                    >
                      {{ skill.skillName }}
                    </span>
                    <span
                      v-if="(badge.attributes?.skills || badge.skills || []).length > 2"
                      class="text-xs text-gray-500"
                    >
                      +{{ (badge.attributes?.skills || badge.skills || []).length - 2 }} more
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="badges.length === 0 && !isLoadingBadges && !badgeError" class="text-center py-8">
          <p class="text-gray-500 mb-4">
            No badges available for issuance.
          </p>
          <NButton variant="outline" @click="loadBadges">
            Refresh
          </NButton>
        </div>
      </div>

      <!-- Step 2: Recipient Details -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">
          Step 2: Recipient Details
        </h2>

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
        <h2 class="text-xl font-semibold mb-4">
          Step 3: Evidence (Optional)
        </h2>
        <p class="text-gray-600 mb-4">
          Add evidence to support this credential issuance.
        </p>

        <div class="space-y-6">
          <div
            v-for="(evidence, index) in evidenceEntries"
            :key="index"
            class="p-4 border border-gray-200 rounded-lg"
          >
            <div class="flex justify-between items-center mb-3">
              <h3 class="font-medium">
                Evidence #{{ index + 1 }}
              </h3>
              <NButton
                v-if="evidenceEntries.length > 1"
                size="sm"
                variant="outline"
                class="text-red-600 hover:bg-red-50"
                @click="removeEvidenceEntry(index)"
              >
                <div class="i-lucide-trash-2 w-4 h-4" />
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
              variant="outline"
              type="button"
              @click="addEvidenceEntry"
            >
              <div class="i-lucide-plus mr-2" />
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
        <h2 class="text-xl font-semibold mb-4">
          Batch Issue via CSV
        </h2>
        <p class="text-gray-600 mb-4">
          Import a CSV file of recipients to issue this badge to multiple people at once.<br>
          <NButton size="xs" variant="outline" class="mt-2" @click="handleFileUpload">
            Upload CSV File
          </NButton>
        </p>
        <NAlert v-if="batchError" variant="error" class="mt-4">
          {{ batchError }}
        </NAlert>
        <NAlert v-if="batchSuccess" variant="success" class="mt-4">
          Batch issuance complete.
        </NAlert>
        <div v-if="batchResults.length > 0" class="mt-6 overflow-x-auto">
          <table class="min-w-full text-sm border rounded-lg">
            <thead>
              <tr class="bg-primary-50">
                <th class="px-4 py-2 text-left">
                  Name
                </th>
                <th class="px-4 py-2 text-left">
                  Email
                </th>
                <th class="px-4 py-2 text-left">
                  Status
                </th>
                <th class="px-4 py-2 text-left">
                  Error
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in batchResults" :key="row.recipient.email">
                <td class="px-4 py-2">
                  {{ row.recipient.name }}
                </td>
                <td class="px-4 py-2">
                  {{ row.recipient.email }}
                </td>
                <td class="px-4 py-2">
                  <span v-if="row.success" class="text-green-600">Success</span>
                  <span v-else class="text-red-600">Failed</span>
                </td>
                <td class="px-4 py-2 text-xs text-red-500">
                  {{ row.error || '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </form>
  </div>
</template>
