<script setup lang="ts">
import { useHead } from '#imports'
import { onMounted, ref } from 'vue'
import { apiClient } from '~/api/api-client'
import CertificateCard from '~/components/CertificateCard.vue'
import { useAuthStore } from '~/stores/auth'

useHead({
  title: 'Dashboard | Certo',
  meta: [
    { name: 'description', content: 'Your Certo dashboard: manage your issued and received digital credentials.' },
    { name: 'og:title', property: 'og:title', content: 'Dashboard | Certo' },
    { name: 'og:description', property: 'og:description', content: 'Your Certo dashboard: manage your issued and received digital credentials.' },
    { name: 'og:image', property: 'og:image', content: 'https://certo.schroedinger-hat.org/og-default.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: 'https://certo.schroedinger-hat.org/og-default.png' },
    { property: 'og:url', content: 'https://certo.schroedinger-hat.org/dashboard' }
  ],
  link: [
    { rel: 'canonical', href: 'https://certo.schroedinger-hat.org/dashboard' }
  ]
})

definePageMeta({
  middleware: ['auth']
})

interface Certificate {
  id: string
  title: string
  description: string
  issueDate: string
  recipientCount: number
  status: 'active' | 'draft' | 'archived'
  type?: string
  recipient?: {
    name: string
    email: string
  }
  issuer?: {
    name: string
    url: string
  }
}

const authStore = useAuthStore()
const loading = ref(false)
const error = ref<string | null>(null)

const receivedCertificates = ref<Certificate[]>([])
const issuedCertificates = ref<Certificate[]>([])

onMounted(async () => {
  if (!authStore.isAuthenticated) { return }

  loading.value = true
  error.value = null

  try {
    const [receivedResponse, issuedResponse] = await Promise.all([
      apiClient.getReceivedCertificates(),
      authStore.isIssuer ? apiClient.getIssuedCertificates() : Promise.resolve({ data: [] })
    ])

    receivedCertificates.value = receivedResponse.data || []
    issuedCertificates.value = issuedResponse.data || []
  }
  catch (err) {
    console.error('Error fetching dashboard data:', err)
    error.value = 'Failed to load dashboard data. Please try again.'
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="w-8 h-8 border-4 border-[#00E5C5] border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
      <p class="text-red-800">
        {{ error }}
      </p>
      <button
        class="mt-2 text-sm text-red-600 hover:text-red-800"
        @click="$router.go(0)"
      >
        Try Again
      </button>
    </div>

    <template v-else>
      <!-- Received Certificates Section -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">
            Received Certificates
          </h2>
        </div>
        <div v-if="receivedCertificates.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
          <div class="i-heroicons-inbox w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 class="text-lg font-medium mb-2">
            No Certificates Yet
          </h3>
          <p class="text-gray-600">
            You haven't received any certificates yet.
          </p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CertificateCard
            v-for="cert in receivedCertificates"
            :key="cert.id"
            :certificate="cert"
            :show-recipient="false"
          />
        </div>
      </div>

      <!-- Issued Certificates Section (Only for issuers) -->
      <div v-if="authStore.isIssuer">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold">
            Issued Certificates
          </h2>
          <div class="flex items-center gap-4">
            <NuxtLink
              to="/issue"
              class="px-4 py-2 bg-[#00E5C5] text-white rounded-full hover:bg-[#00E5C5]/90 transition-colors"
            >
              Issue New
            </NuxtLink>
          </div>
        </div>
        <div v-if="issuedCertificates.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
          <div class="i-heroicons-document-plus w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 class="text-lg font-medium mb-2">
            No Issued Certificates
          </h3>
          <p class="text-gray-600 mb-4">
            You haven't issued any certificates yet.
          </p>
          <NuxtLink
            to="/issue"
            class="inline-flex items-center px-4 py-2 bg-[#00E5C5] text-white rounded-full hover:bg-[#00E5C5]/90 transition-colors"
          >
            <div class="i-heroicons-plus w-5 h-5 mr-2" />
            Issue Your First Certificate
          </NuxtLink>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CertificateCard
            v-for="cert in issuedCertificates"
            :key="cert.id"
            :certificate="cert"
          />
        </div>
      </div>
    </template>
  </div>
</template>
