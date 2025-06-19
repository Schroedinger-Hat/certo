<script setup lang="ts">
import { ref } from 'vue'

interface Certificate {
  id: string
  title: string
  description: string
  issueDate: string
  recipientCount: number
  status: 'active' | 'draft' | 'archived'
  issuer?: {
    name: string
    url: string
  }
}

const fileInput = ref<HTMLInputElement | null>(null)
const jsonInput = ref('')
const isDragging = ref(false)
const isLoading = ref(false)
const importedCertificate = ref<Certificate | null>(null)

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  
  if (!e.dataTransfer?.files.length) return
  
  const file = e.dataTransfer.files[0]
  await handleFileUpload(file)
}

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files?.length) return
  
  await handleFileUpload(target.files[0])
}

const handleFileUpload = async (file: File) => {
  if (file.type !== 'application/json') {
    alert('Please upload a JSON file')
    return
  }

  isLoading.value = true
  try {
    const text = await file.text()
    const json = JSON.parse(text)
    importedCertificate.value = json
  } catch (error) {
    alert('Invalid JSON file')
    importedCertificate.value = null
  }
  isLoading.value = false
}

const handleJsonPaste = () => {
  try {
    const json = JSON.parse(jsonInput.value)
    importedCertificate.value = json
  } catch (error) {
    alert('Invalid JSON format')
    importedCertificate.value = null
  }
}

const clearImport = () => {
  importedCertificate.value = null
  jsonInput.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-text-primary">Import Certificate</h2>
      <p class="mt-2 text-text-secondary">Upload your certificate file or paste JSON data</p>
    </div>

    <!-- Import Form -->
    <form @submit.prevent="handleJsonPaste" class="space-y-6">
      <!-- Import Method Tabs -->
      <div class="flex justify-center space-x-4">
        <button
          type="button"
          @click="handleFileSelect"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="[
            'text-text-secondary hover:text-text-primary'
          ]"
        >
          Upload File
        </button>
        <button
          type="button"
          @click="handleJsonPaste"
          class="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          :class="[
            'text-text-secondary hover:text-text-primary'
          ]"
        >
          Paste JSON
        </button>
      </div>

      <!-- File Upload -->
      <div v-if="importedCertificate" class="text-center">
        <div class="flex flex-col items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#00E5C5] transition-colors">
          <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-full flex items-center justify-center mb-4">
            <div class="w-6 h-6 i-heroicons-cloud-arrow-up text-[#00E5C5]"></div>
          </div>
          <div class="text-sm text-text-secondary">
            <label 
              for="file-upload" 
              class="relative cursor-pointer rounded-md font-medium text-[#00E5C5] hover:text-[#00E5C5]/80 focus-within:outline-none"
            >
              <span>Upload a file</span>
              <input 
                id="file-upload" 
                name="file-upload" 
                type="file" 
                class="sr-only"
                @change="handleFileSelect"
                accept=".json,.pdf"
              />
            </label>
            <p class="pl-1">or drag and drop</p>
          </div>
          <p class="text-xs text-text-secondary mt-2">
            Supports JSON files containing Open Badges or Verifiable Credentials
          </p>
        </div>
      </div>

      <!-- JSON Input -->
      <div v-else>
        <label for="json" class="block text-sm font-medium text-text-primary mb-2">
          Certificate JSON
        </label>
        <textarea
          id="json"
          v-model="jsonInput"
          rows="8"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent font-mono text-sm"
          placeholder="Paste your certificate JSON here..."
        ></textarea>
      </div>

      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-white bg-[#00E5C5] hover:bg-[#00E5C5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!isLoading">Import Certificate</span>
          <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </button>
      </div>
    </form>

    <!-- Import Result -->
    <div v-if="importedCertificate" class="mt-8">
      <div 
        class="p-6 rounded-lg"
        :class="{
          'bg-green-50': importedCertificate,
          'bg-red-50': !importedCertificate
        }"
      >
        <!-- Result Header -->
        <div class="flex items-center">
          <div 
            class="w-12 h-12 rounded-full flex items-center justify-center"
            :class="{
              'bg-green-100': importedCertificate,
              'bg-red-100': !importedCertificate
            }"
          >
            <div 
              class="w-6 h-6"
              :class="{
                'i-heroicons-check-circle text-green-600': importedCertificate,
                'i-heroicons-x-circle text-red-600': !importedCertificate
              }"
            ></div>
          </div>
          <div class="ml-4">
            <h3 
              class="text-lg font-medium"
              :class="{
                'text-green-800': importedCertificate,
                'text-red-800': !importedCertificate
              }"
            >
              {{ importedCertificate ? 'Import Successful' : 'Import Failed' }}
            </h3>
            <p 
              class="text-sm"
              :class="{
                'text-green-600': importedCertificate,
                'text-red-600': !importedCertificate
              }"
            >
              {{ importedCertificate ? '' : 'Please upload or paste a valid certificate JSON' }}
            </p>
          </div>
        </div>

        <!-- Certificate Details -->
        <div v-if="importedCertificate" class="mt-6 space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-text-secondary">Title</span>
            <span class="font-medium text-text-primary">{{ importedCertificate.title }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-text-secondary">Issuer</span>
            <span class="font-medium text-text-primary">{{ importedCertificate.issuer?.name }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-text-secondary">Issue Date</span>
            <span class="font-medium text-text-primary">{{ formatDate(importedCertificate.issueDate) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-text-secondary">ID</span>
            <span class="font-medium text-text-primary">{{ importedCertificate.id }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 