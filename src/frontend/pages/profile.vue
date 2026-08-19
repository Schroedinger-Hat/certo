<script setup lang="ts">
import Cookies from 'js-cookie'
import { apiClient } from '~/api/api-client'
import { useAuthStore } from '~/stores/auth'

const { t } = useI18n()
interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  organization?: string
  bio?: string
  website?: string
  social?: {
    twitter?: string
    linkedin?: string
    github?: string
  }
}

interface Stats {
  credentialsIssued: number
  credentialsRevoked: number
  credentialsExpired: number
  credentialsReceived: number
  achievementsCreated: number
  uniqueRecipients: number
  topAchievements: { id: number, name: string, count: number }[]
  issuanceTrend: { month: string, count: number }[]
  memberSince: string
}

const loading = ref(false)
const pageDescription = ref('Everything regarding your profile from your Certo account')

const form = ref({
  name: '',
  email: '',
  organization: '',
  bio: '',
})

const profile = ref<UserProfile>({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Issuer',
  organization: 'Tech Academy',
  bio: 'Passionate about education and technology',
  website: 'https://johndoe.com',
  social: {
    twitter: '@johndoe',
    linkedin: 'johndoe',
    github: 'johndoe'
  }
})

const stats = ref<Stats>({
  credentialsIssued: 0,
  credentialsRevoked: 0,
  credentialsExpired: 0,
  credentialsReceived: 0,
  achievementsCreated: 0,
  uniqueRecipients: 0,
  topAchievements: [],
  issuanceTrend: [],
  memberSince: new Date().toISOString(),
})
const statsLoading = ref(false)
const maxIssuance = computed(() => Math.max(1, ...stats.value.issuanceTrend.map(month => month.count)))

// Change password
const showPasswordForm = ref(false)
const passwordForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passwordLoading = ref(false)
const passwordError = ref<string | null>(null)
const passwordSuccess = ref(false)

// Export data
const exportLoading = ref(false)
const exportError = ref<string | null>(null)

// Fetch real stats from the backend
onMounted(async () => {
  statsLoading.value = true
  try {
    const result = await apiClient.getDashboardStats()
    if (result.data) {
      stats.value = result.data
    }
  }
  catch (err) {
    console.error('Failed to load dashboard stats', err)
  }
  finally {
    statsLoading.value = false
  }
})

// Initialize form with profile data
form.value = {
  name: profile.value.name,
  email: profile.value.email,
  organization: profile.value.organization || '',
  bio: profile.value.bio || '',
}

async function handleSubmit() {
  loading.value = true
  try {
    // TODO: Implement API call to update profile
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update profile with form data
    profile.value = {
      ...profile.value,
      name: form.value.name,
      email: form.value.email,
      organization: form.value.organization,
      bio: form.value.bio,
    }

    // TODO: Show success message
  }
  catch (error) {
    console.error('Failed to update profile:', error)
    // TODO: Show error message
  }
  finally {
    loading.value = false
  }
}

function handleChangePassword() {
  showPasswordForm.value = !showPasswordForm.value
  passwordError.value = null
  passwordSuccess.value = false
  passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
}

async function submitPasswordChange() {
  passwordError.value = null
  passwordSuccess.value = false

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'New passwords do not match'
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'New password must be at least 6 characters'
    return
  }

  passwordLoading.value = true
  try {
    const response = await apiClient.post<{ jwt: string }>('/api/auth/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      password: passwordForm.value.newPassword,
    })
    // Strapi returns a fresh JWT — update the stored token so the session stays alive
    if (response?.jwt) {
      const authStore = useAuthStore()
      authStore.token = response.jwt
      apiClient.setToken(response.jwt)
      Cookies.set('token', response.jwt, { expires: 7 })
    }
    passwordSuccess.value = true
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  }
  catch (err: any) {
    passwordError.value = err?.message || 'Failed to change password'
  }
  finally {
    passwordLoading.value = false
  }
}

async function handleExportData() {
  exportError.value = null
  exportLoading.value = true
  try {
    const data = await apiClient.get<any>('/api/profiles/me/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certo-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  catch (err: any) {
    exportError.value = err?.message || 'Export failed'
  }
  finally {
    exportLoading.value = false
  }
}

function handleDeleteAccount() {
  // TODO: Implement account deletion
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

useSeoMeta({
  description: pageDescription.value,
  ogDescription: pageDescription.value,
  ogUrl: `${WEBSITE_URL}/profile`
})

useHead({
  title: t('profile.title'),
  link: [
    { rel: 'canonical', href: `${WEBSITE_URL}/profile` }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-[#FFE5AE]/20 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-text-primary">
          {{ t('profile.title') }}
        </h1>
        <p class="mt-2 text-text-secondary">
          {{ t('profile.account') }}
        </p>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Profile Info -->
        <div class="lg:col-span-2">
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <!-- Personal Information -->
              <div class="space-y-4">
                <div>
                  <label for="name" class="block text-sm font-medium text-text-primary mb-2">
                    Full Name
                  </label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                    placeholder="Enter your full name"
                  >
                </div>

                <div>
                  <label for="email" class="block text-sm font-medium text-text-primary mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                    placeholder="Enter your email"
                  >
                </div>

                <div>
                  <label for="organization" class="block text-sm font-medium text-text-primary mb-2">
                    Organization
                  </label>
                  <input
                    id="organization"
                    v-model="form.organization"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                    placeholder="Enter your organization"
                  >
                </div>

                <div>
                  <label for="bio" class="block text-sm font-medium text-text-primary mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    v-model="form.bio"
                    rows="4"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>

              <!-- Submit Button -->
              <div>
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-white bg-[#00E5C5] hover:bg-[#00E5C5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span v-if="!loading">Save Changes</span>
                  <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-8">
          <!-- Account Stats -->
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
            <h2 class="text-lg font-medium text-text-primary mb-4">
              Account Overview
            </h2>
            <div v-if="statsLoading" class="py-4 text-center text-text-secondary text-sm">
              Loading…
            </div>
            <div v-else class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Credentials Issued</span>
                <span class="font-medium text-text-primary">{{ stats.credentialsIssued }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Credentials Received</span>
                <span class="font-medium text-text-primary">{{ stats.credentialsReceived }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Achievements Created</span>
                <span class="font-medium text-text-primary">{{ stats.achievementsCreated }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Unique Recipients</span>
                <span class="font-medium text-text-primary">{{ stats.uniqueRecipients }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Revoked</span>
                <span class="font-medium text-text-primary">{{ stats.credentialsRevoked }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Member Since</span>
                <span class="font-medium text-text-primary">{{ formatDate(stats.memberSince) }}</span>
              </div>
            </div>
          </div>

          <!-- Issuance Trend -->
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
            <h2 class="text-lg font-medium text-text-primary mb-1">
              Issuance Trend
            </h2>
            <p class="text-sm text-text-secondary mb-5">
              Credentials issued over the last 12 months
            </p>
            <div v-if="statsLoading" class="h-32 flex items-center justify-center text-text-secondary text-sm">
              Loading…
            </div>
            <div v-else-if="stats.issuanceTrend.length" class="h-32 flex items-end gap-1.5" role="img" aria-label="Credential issuance trend for the last 12 months">
              <div
                v-for="month in stats.issuanceTrend"
                :key="month.month"
                class="flex-1 h-full flex flex-col items-center justify-end gap-1"
                :title="`${month.month}: ${month.count} credentials`"
              >
                <span class="text-[10px] text-text-secondary">{{ month.count || '' }}</span>
                <div
                  class="w-full max-w-5 rounded-t bg-[var(--brand-primary)] transition-all"
                  :style="{ height: `${Math.max(6, (month.count / maxIssuance) * 88)}%` }"
                />
                <span class="text-[9px] text-text-secondary rotate-[-45deg] origin-top-right whitespace-nowrap">{{ month.month }}</span>
              </div>
            </div>
            <p v-else class="py-8 text-center text-text-secondary text-sm">
              No issuance data yet.
            </p>
          </div>

          <!-- Account Actions -->
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
            <h2 class="text-lg font-medium text-text-primary mb-4">
              Account Actions
            </h2>
            <div class="space-y-3">
              <!-- Change Password -->
              <button
                class="w-full flex items-center justify-between px-4 py-2 text-text-primary hover:bg-gray-50 rounded-lg transition-colors"
                @click="handleChangePassword"
              >
                <span>Change Password</span>
                <div class="w-5 h-5" :class="showPasswordForm ? 'i-heroicons-chevron-up' : 'i-heroicons-key'" />
              </button>
              <div v-if="showPasswordForm" class="border border-gray-100 rounded-lg p-4 space-y-3">
                <div v-if="passwordSuccess" class="text-sm text-green-600 font-medium">
                  Password changed successfully.
                </div>
                <div v-if="passwordError" class="text-sm text-red-600">
                  {{ passwordError }}
                </div>
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  placeholder="Current password"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5AB69F]"
                  autocomplete="current-password"
                />
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="New password"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5AB69F]"
                  autocomplete="new-password"
                />
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5AB69F]"
                  autocomplete="new-password"
                />
                <button
                  class="w-full py-2 bg-[#5AB69F] text-white rounded-lg text-sm font-medium hover:bg-[#5AB69F]/90 transition-colors disabled:opacity-50"
                  :disabled="passwordLoading"
                  @click="submitPasswordChange"
                >
                  {{ passwordLoading ? 'Saving…' : 'Update Password' }}
                </button>
              </div>

              <!-- Export Data -->
              <div v-if="exportError" class="text-sm text-red-600 px-4">
                {{ exportError }}
              </div>
              <button
                class="w-full flex items-center justify-between px-4 py-2 text-text-primary hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                :disabled="exportLoading"
                @click="handleExportData"
              >
                <span>{{ exportLoading ? 'Exporting…' : 'Export Data' }}</span>
                <div class="w-5 h-5 i-heroicons-arrow-down-tray" />
              </button>

              <!-- Delete Account -->
              <button
                class="w-full flex items-center justify-between px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                @click="handleDeleteAccount"
              >
                <span>Delete Account</span>
                <div class="w-5 h-5 i-heroicons-trash" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
