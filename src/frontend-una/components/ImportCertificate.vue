<script setup>
defineOptions({
  name: 'ImportCertificate'
})

import { ref } from 'vue'
import { apiClient } from '~/api/api-client'

const jsonInput = ref('')
const file = ref(null)
const isImporting = ref(false)
const importSuccess = ref(false)
const importError = ref(null)
const importedCertificate = ref(null)

const emit = defineEmits(['import-success'])

function handleFileChange(event) {
  if (!process.client) return
  
  const selectedFile = event.target.files[0]
  if (!selectedFile) return
  
  // Check if it's a JSON file
  if (selectedFile.type !== 'application/json') {
    importError.value = 'Only JSON files are supported'
    return
  }
  
  file.value = selectedFile
  
  // Read the file content
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target.result
      jsonInput.value = content
      
      // Try to parse to validate it's proper JSON
      JSON.parse(content)
      importError.value = null
    } catch (error) {
      importError.value = 'Invalid JSON file'
    }
  }
  reader.onerror = () => {
    importError.value = 'Error reading file'
  }
  reader.readAsText(selectedFile)
}

async function handleImport() {
  if (!jsonInput.value.trim()) {
    importError.value = 'Please enter or upload credential JSON'
    return
  }
  
  isImporting.value = true
  importError.value = null
  importSuccess.value = false
  importedCertificate.value = null
  
  try {
    // Parse the JSON input
    let credentialData
    try {
      credentialData = JSON.parse(jsonInput.value)
    } catch (e) {
      throw new Error('Invalid JSON format. Please check your input.')
    }
    
    // Import the credential
    const result = await apiClient.importCertificate(credentialData)
    console.log('Import result:', result)
    
    importSuccess.value = true
    
    // Format the imported certificate for display
    if (result.data) {
      // Handle Strapi format
      importedCertificate.value = apiClient.formatCredential(result.data)
    } else {
      // Handle direct format
      importedCertificate.value = result
    }
    
    // Reset the form
    jsonInput.value = ''
    file.value = null
    
    // Emit success event
    emit('import-success', result)
    
  } catch (error) {
    console.error('Error importing certificate:', error)
    importError.value = error instanceof Error ? error.message : 'Failed to import credential'
  } finally {
    isImporting.value = false
  }
}

function resetForm() {
  jsonInput.value = ''
  file.value = null
  importError.value = null
  importSuccess.value = false
  importedCertificate.value = null
  
  // Reset file input
  if (process.client) {
    const fileInput = document.getElementById('certificate-file')
    if (fileInput) {
      fileInput.value = ''
    }
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <NCard>
      <template #header>
        <h2 class="text-xl font-bold">Import Certificate</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Import a credential by uploading a JSON file or pasting JSON content
        </p>
      </template>
      
      <form @submit.prevent="handleImport" class="space-y-6">
        <NAlert v-if="importError" variant="error" class="mb-4">
          {{ importError }}
        </NAlert>
        
        <NAlert v-if="importSuccess" variant="success" class="mb-4">
          Certificate imported successfully!
        </NAlert>
        
        <div class="space-y-4">
          <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <input
              type="file"
              id="certificate-file"
              accept="application/json"
              class="hidden"
              @change="handleFileChange"
            />
            <label 
              for="certificate-file"
              class="cursor-pointer block"
            >
              <div class="i-lucide-upload-cloud w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2"></div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                <span class="text-primary">Click to upload</span> or drag and drop
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">JSON files only</p>
            </label>
            
            <div v-if="file" class="mt-4 text-left p-3 bg-gray-50 dark:bg-gray-800 rounded flex items-center">
              <div class="i-lucide-file-json w-5 h-5 text-yellow-600 mr-2"></div>
              <span class="text-sm">{{ file.name }}</span>
              <button 
                type="button"
                class="ml-auto text-gray-500 hover:text-red-500"
                @click="resetForm"
              >
                <div class="i-lucide-x w-4 h-4"></div>
              </button>
            </div>
          </div>
          
          <div class="text-center">
            <span class="text-sm text-gray-500">OR</span>
          </div>
          
          <NFormItem label="Paste JSON">
            <NTextarea
              v-model="jsonInput"
              placeholder="Paste credential JSON here"
              rows="10"
              class="font-mono text-sm"
            />
          </NFormItem>
        </div>
        
        <div class="flex justify-end">
          <NButton
            type="submit"
            :loading="isImporting"
            :disabled="!jsonInput.trim()"
          >
            {{ isImporting ? 'Importing...' : 'Import Certificate' }}
          </NButton>
        </div>
      </form>
      
      <template v-if="importedCertificate" #footer>
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <h3 class="font-medium mb-2">Imported Certificate Details:</h3>
          <div class="space-y-2 text-sm">
            <div v-if="importedCertificate.name" class="flex justify-between">
              <span class="font-medium">Name:</span>
              <span>{{ importedCertificate.name }}</span>
            </div>
            <div v-if="importedCertificate.issuer?.name" class="flex justify-between">
              <span class="font-medium">Issuer:</span>
              <span>{{ importedCertificate.issuer.name }}</span>
            </div>
            <div v-if="importedCertificate.id" class="flex justify-between">
              <span class="font-medium">ID:</span>
              <span class="truncate max-w-xs">{{ importedCertificate.id }}</span>
            </div>
          </div>
          
          <div class="mt-4">
            <NuxtLink 
              :to="`/verify?id=${encodeURIComponent(importedCertificate.id || '')}`"
              class="text-primary hover:underline text-sm"
            >
              Verify this credential
            </NuxtLink>
          </div>
        </div>
      </template>
    </NCard>
  </div>
</template> 