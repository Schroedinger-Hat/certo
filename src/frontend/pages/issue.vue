<script setup lang="ts">
import type { Recipient } from '../composables/useApiClient'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useApiClient } from '../composables/useApiClient'

definePageMeta({
  middleware: ['auth']
})

interface Template {
  id: string
  title: string
  description: string
  image?: {
    data?: {
      attributes?: {
        url?: string
      }
    }
  }
  type: 'badge' | 'certificate'
  attributes?: {
    name?: string
    description?: string
    image?: {
      data?: {
        attributes?: {
          url?: string
        }
      }
    }
    creator?: {
      data?: {
        attributes?: {
          name?: string
        }
      }
    }
  }
}

const router = useRouter()
const authStore = useAuthStore()
const apiClient = useApiClient()
const templates = ref<Template[]>([])
const selectedTemplate = ref<Template | null>(null)
const recipients = ref<Recipient[]>([{ name: '', email: '' }])
const issueDate = ref(new Date().toISOString().split('T')[0])
const isLoading = ref(false)
const isSuccess = ref(false)
const error = ref<string | null>(null)
const submissionError = ref<string | null>(null)
const isLoadingTemplates = ref(false)
const csvUploaded = ref(false)
const isDev = computed(() => process.env.NODE_ENV === 'development')

// Load available badges
async function loadTemplates() {
  isLoadingTemplates.value = true
  error.value = null

  try {
    // Wait for auth store to be ready
    if (authStore.isLoading) {
      await new Promise<void>((resolve) => {
        const unwatch = watch(
          () => authStore.isLoading,
          (loading) => {
            if (!loading) {
              unwatch()
              resolve()
            }
          },
          { immediate: true }
        )
      })
    }

    // Check authentication using Pinia store
    if (!authStore.isAuthenticated) {
      router.push('/login')
      return
    }

    // Check if user is an issuer
    if (!authStore.isIssuer) {
      router.push('/dashboard')
      return
    }

    const response = await apiClient.getAvailableBadges()

    if (response?.data) {
      templates.value = response.data.map((badge: any) => {
        return {
          id: String(badge.id),
          title: badge.name || '',
          description: badge.description || '',
          image: {
            data: {
              attributes: {
                url: badge.image?.url,
              },
            },
          },
          type: 'badge',
          attributes: {
            name: badge.name || '',
            description: badge.description || '',
            image: {
              data: {
                attributes: {
                  url: badge.image?.url,
                },
              },
            },
            creator: badge.creator,
          },
        }
      })
    }
    else {
      console.warn('No data in response:', response)
      error.value = 'No templates available'
    }
  }
  catch (err) {
    console.error('Error loading templates:', err)
    if (err instanceof Error) {
      if (err.message === 'Authentication required' || err.message === 'Authentication failed') {
        router.push('/login')
        return
      }
      error.value = err.message
    }
    else {
      error.value = 'Failed to load available templates'
    }
  }
  finally {
    isLoadingTemplates.value = false
  }
}

onMounted(async () => {
  await loadTemplates()
})

function selectTemplate(template: Template) {
  selectedTemplate.value = template
}

// Helper function to get image URL
function getImageUrl(template: Template): string {
  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl

  let url: string | undefined

  // Check all possible image URL paths
  if (template.attributes?.image?.data?.attributes?.url) {
    url = template.attributes.image.data.attributes.url
    console.log('Found URL in attributes.image:', url)
  }
  else if (template.image?.data?.attributes?.url) {
    url = template.image.data.attributes.url
    console.log('Found URL in root image:', url)
  }
  else if (typeof template.image === 'string') {
    url = template.image
  }

  if (!url) {
    console.warn('No image URL found in template. Template data:', template)
    return '/placeholder-badge.png'
  }

  // Handle different URL formats
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Ensure we have an API URL
  if (!apiUrl) {
    console.warn('No API URL configured, using default')
  }

  // Handle relative URLs
  const finalUrl = url.startsWith('/') ? `${apiUrl}${url}` : `${apiUrl}/${url}`
  return finalUrl
}

function addRecipient() {
  recipients.value.push({ name: '', email: '' })
}

function removeRecipient(index: number) {
  recipients.value.splice(index, 1)
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) { return }

  const file = input.files[0]
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const content = reader.result as string
      const rows = content.split(/\r?\n/).slice(1) // Skip header row
      const parsedRecipients: Recipient[] = rows
        .map(row => row.split(','))
        .filter(([name, email]) => name && name.trim() && email && email.trim())
        .map(([name, email, organization]) => ({
          name: name.trim(),
          email: email.trim(),
          organization: organization?.trim() || '',
        }))

      if (parsedRecipients.length === 0) {
        throw new Error('CSV file is empty or invalid. Please check the file and try again.')
      }

      recipients.value = parsedRecipients
      csvUploaded.value = true
      error.value = null
    }
    catch (err) {
      console.error('Error parsing CSV:', err)
      error.value = err instanceof Error ? err.message : 'Failed to parse CSV file'
      recipients.value = [{ name: '', email: '' }]
      csvUploaded.value = false
    }
  }
  reader.onerror = () => {
    console.error('Error reading file:', reader.error)
    error.value = 'Failed to read CSV file'
    csvUploaded.value = false
  }
  reader.readAsText(file)
}

function clearCsvRecipients() {
  recipients.value = [{ name: '', email: '' }]
  csvUploaded.value = false
}

async function handleIssue() {
  if (!selectedTemplate.value || !recipients.value.length) {
    console.warn('Cannot issue: missing template or recipients')
    return
  }

  isLoading.value = true
  submissionError.value = null
  isSuccess.value = false

  try {
    await apiClient.batchIssueBadges(
      selectedTemplate.value.id,
      recipients.value
    )
    isSuccess.value = true
    clearForm()
  }
  catch (err) {
    console.error('Error issuing badges:', err)
    if (err instanceof Error) {
      submissionError.value = err.message
    }
    else {
      submissionError.value = 'Failed to issue credentials'
    }
    isSuccess.value = false
  }
  finally {
    isLoading.value = false
  }
}

function clearForm() {
  selectedTemplate.value = null
  recipients.value = [{ name: '', email: '' }]
  csvUploaded.value = false
  isSuccess.value = false
  error.value = null
  submissionError.value = null
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-[#FFE5AE]/20 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-text-primary">
          Issue Certificate
        </h1>
        <p class="mt-2 text-text-secondary">
          Create and issue new certificates to recipients
        </p>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Form Section -->
        <div class="lg:col-span-2">
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
            <!-- Loading State -->
            <div v-if="isLoadingTemplates" class="text-center py-8">
              <div class="w-12 h-12 border-4 border-[#00E5C5] border-t-transparent rounded-full animate-spin mx-auto" />
              <p class="mt-4 text-text-secondary">
                Loading available templates...
              </p>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="text-center py-8">
              <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div class="w-6 h-6 i-heroicons-exclamation-triangle text-red-500" />
              </div>
              <p class="text-red-500">
                {{ error }}
              </p>
              <button
                class="mt-4 text-[#00E5C5] hover:text-[#00E5C5]/80"
                @click="loadTemplates"
              >
                Try Again
              </button>
            </div>

            <!-- Content -->
            <form v-else class="space-y-6" @submit.prevent="handleIssue">
              <!-- Template Selection -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Certificate Template
                </label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    v-for="template in templates"
                    :key="template.id"
                    class="relative border rounded-lg p-4 cursor-pointer transition-all"
                    :class="[
                      selectedTemplate?.id === template.id
                        ? 'border-[#00E5C5] bg-[#00E5C5]/5'
                        : 'border-gray-200 hover:border-[#00E5C5]/50',
                    ]"
                    @click="selectTemplate(template)"
                  >
                    <div class="flex items-start">
                      <div class="w-16 h-16 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          v-if="getImageUrl(template)"
                          :src="getImageUrl(template)"
                          :alt="template.title"
                          class="max-w-full max-h-full object-contain"
                        >
                        <div v-else class="w-8 h-8 i-heroicons-document-text text-[#00E5C5]" />
                      </div>
                      <div class="ml-4">
                        <h3 class="text-sm font-medium text-text-primary">
                          {{ template.title }}
                        </h3>
                        <p class="text-xs text-text-secondary mt-1">
                          {{ template.description }}
                        </p>
                        <p v-if="template.attributes?.creator?.data?.attributes?.name" class="text-xs text-[#00E5C5] mt-1">
                          By {{ template.attributes.creator.data.attributes.name }}
                        </p>
                      </div>
                    </div>
                    <div
                      v-if="selectedTemplate?.id === template.id"
                      class="absolute top-2 right-2 w-5 h-5 bg-[#00E5C5] rounded-full flex items-center justify-center"
                    >
                      <div class="w-3 h-3 i-heroicons-check text-white" />
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-if="templates.length === 0" class="text-center py-8">
                  <div class="w-16 h-16 bg-[#00E5C5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div class="w-8 h-8 i-heroicons-document-text text-[#00E5C5]" />
                  </div>
                  <p class="text-text-secondary">
                    No templates available
                  </p>
                  <button
                    class="mt-4 text-[#00E5C5] hover:text-[#00E5C5]/80"
                    @click="loadTemplates"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <!-- Recipients -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Recipients
                </label>
                <div class="space-y-4">
                  <!-- CSV Upload -->
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-[#00E5C5] transition-colors">
                    <div class="flex flex-col items-center">
                      <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-full flex items-center justify-center mb-4">
                        <div class="w-6 h-6 i-heroicons-cloud-arrow-up text-[#00E5C5]" />
                      </div>
                      <div class="text-sm text-text-secondary">
                        <label
                          for="csv-upload"
                          class="relative cursor-pointer rounded-md font-medium text-[#00E5C5] hover:text-[#00E5C5]/80 focus-within:outline-none"
                        >
                          <span>Upload CSV</span>
                          <input
                            id="csv-upload"
                            name="csv-upload"
                            type="file"
                            class="sr-only"
                            accept=".csv"
                            :disabled="csvUploaded"
                            @change="handleFileUpload"
                          >
                        </label>
                        <p class="pl-1">
                          or drag and drop
                        </p>
                      </div>
                      <p class="text-xs text-text-secondary mt-2">
                        Download our <a href="/recipients-template.csv" download class="text-[#00E5C5] hover:text-[#00E5C5]/80">CSV template</a>
                      </p>
                    </div>
                  </div>

                  <!-- If CSV uploaded, show summary and clear button -->
                  <div v-if="csvUploaded" class="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-2">
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-medium text-text-primary">{{ recipients.length }} recipients loaded from CSV</span>
                      <button type="button" class="text-red-500 hover:text-red-600 text-sm" @click="clearCsvRecipients">
                        Clear
                      </button>
                    </div>
                    <ul class="max-h-32 overflow-y-auto text-xs text-gray-600">
                      <li v-for="(r, i) in recipients" :key="i">
                        {{ r.name }} &lt;{{ r.email }}&gt;
                      </li>
                    </ul>
                  </div>

                  <!-- If no CSV, show single manual entry -->
                  <div v-else class="flex gap-4">
                    <div class="flex-1">
                      <input
                        v-model="recipients[0].name"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                        placeholder="Recipient name"
                      >
                    </div>
                    <div class="flex-1">
                      <input
                        v-model="recipients[0].email"
                        type="email"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                        placeholder="Email address"
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Issue Date -->
              <div>
                <label for="issueDate" class="block text-sm font-medium text-text-primary mb-2">
                  Issue Date
                </label>
                <input
                  id="issueDate"
                  v-model="issueDate"
                  type="date"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                >
              </div>

              <!-- Success & Error Messages -->
              <div class="space-y-4">
                <!-- Success Message -->
                <div v-if="isSuccess" class="rounded-lg bg-green-50 p-4">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <div class="w-5 h-5 i-heroicons-check-circle text-green-400" />
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-green-800">
                        Certificates issued successfully!
                      </p>
                    </div>
                    <div class="ml-auto pl-3">
                      <div class="-mx-1.5 -my-1.5">
                        <button type="button" class="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600" @click="isSuccess = false">
                          <span class="sr-only">Dismiss</span>
                          <div class="w-5 h-5 i-heroicons-x-mark" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Error Message -->
                <div v-if="submissionError" class="rounded-lg bg-red-50 p-4">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <div class="w-5 h-5 i-heroicons-x-circle text-red-400" />
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium text-red-800">
                        {{ submissionError }}
                      </p>
                    </div>
                    <div class="ml-auto pl-3">
                      <div class="-mx-1.5 -my-1.5">
                        <button type="button" class="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600" @click="submissionError = null">
                          <span class="sr-only">Dismiss</span>
                          <div class="w-5 h-5 i-heroicons-x-mark" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <div>
                <button
                  type="submit"
                  :disabled="isLoading || !selectedTemplate || recipients.length === 0"
                  class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-white bg-[#00E5C5] hover:bg-[#00E5C5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!isLoading">Issue Certificates</span>
                  <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Preview Section -->
        <div class="lg:col-span-1">
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
            <h2 class="text-lg font-medium text-text-primary mb-4">
              Preview
            </h2>

            <div v-if="selectedTemplate" class="space-y-4">
              <div class="aspect-[3/4] bg-white rounded-lg shadow-md p-4 flex items-center justify-center">
                <img
                  :src="getImageUrl(selectedTemplate)"
                  :alt="selectedTemplate.title"
                  class="max-w-full max-h-full object-contain"
                  @error="(e) => console.error('Image failed to load:', (e.target as HTMLImageElement)?.src)"
                  @load="() => console.log('Image loaded successfully')"
                >
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-text-secondary">Template</span>
                  <span class="font-medium text-text-primary">{{ selectedTemplate.title }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-text-secondary">Recipients</span>
                  <span class="font-medium text-text-primary">{{ recipients.length }}</span>
                </div>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-text-secondary">Issue Date</span>
                  <span class="font-medium text-text-primary">{{ formatDate(issueDate) }}</span>
                </div>
                <div v-if="selectedTemplate.attributes?.creator?.data?.attributes?.name" class="flex items-center justify-between text-sm">
                  <span class="text-text-secondary">Issuer</span>
                  <span class="font-medium text-text-primary">{{ selectedTemplate.attributes.creator.data.attributes.name }}</span>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8">
              <div class="w-16 h-16 bg-[#00E5C5]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <div class="w-8 h-8 i-heroicons-document-text text-[#00E5C5]" />
              </div>
              <p class="text-text-secondary">
                Select a template to preview
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
