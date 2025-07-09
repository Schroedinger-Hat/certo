<script setup lang="ts">
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
  issuedCertificates: number
  receivedCertificates: number
  verifiedBadges: number
  certificatesIssued: number
  templatesCreated: number
  memberSince: string
}

const loading = ref(false)
const profilePicture = ref<string>('')
const fileInput = ref<HTMLInputElement | null>(null)
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
  issuedCertificates: 45,
  receivedCertificates: 12,
  verifiedBadges: 8,
  certificatesIssued: 45,
  templatesCreated: 15,
  memberSince: '2023-01-01'
})

// Initialize form with profile data
form.value = {
  name: profile.value.name,
  email: profile.value.email,
  organization: profile.value.organization || '',
  bio: profile.value.bio || '',
}

function handleImageUpload() {
  fileInput.value?.click()
}

function onImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) {
    return
  }

  const file = input.files[0]
  const reader = new FileReader()

  reader.onload = () => {
    profilePicture.value = reader.result as string
  }
  reader.readAsDataURL(file)
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
  // TODO: Implement password change flow
  console.log('Change password clicked')
}

function handleExportData() {
  // TODO: Implement data export
  console.log('Export data clicked')
}

function handleDeleteAccount() {
  // TODO: Implement account deletion
  console.log('Delete account clicked')
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
  title: 'Profile',
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
          Profile Settings
        </h1>
        <p class="mt-2 text-text-secondary">
          Manage your account and preferences
        </p>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Profile Info -->
        <div class="lg:col-span-2">
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <!-- Profile Picture -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Profile Picture
                </label>
                <div class="flex items-center">
                  <div class="relative">
                    <img
                      :src="profilePicture || '/default-avatar.png'"
                      alt="Profile picture"
                      class="w-20 h-20 rounded-full object-cover"
                    >
                    <button
                      type="button"
                      class="absolute bottom-0 right-0 w-8 h-8 bg-[#00E5C5] rounded-full flex items-center justify-center shadow-lg"
                      @click="handleImageUpload"
                    >
                      <div class="w-4 h-4 i-heroicons-pencil text-white" />
                    </button>
                    <input
                      ref="fileInput"
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="onImageSelected"
                    >
                  </div>
                  <div class="ml-4">
                    <p class="text-sm text-text-secondary">
                      Upload a new profile picture or change the existing one
                    </p>
                    <p class="text-xs text-text-secondary mt-1">
                      Recommended size: 400x400px
                    </p>
                  </div>
                </div>
              </div>

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
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Certificates Issued</span>
                <span class="font-medium text-text-primary">{{ stats.certificatesIssued }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Templates Created</span>
                <span class="font-medium text-text-primary">{{ stats.templatesCreated }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-text-secondary">Member Since</span>
                <span class="font-medium text-text-primary">{{ formatDate(stats.memberSince) }}</span>
              </div>
            </div>
          </div>

          <!-- Account Actions -->
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
            <h2 class="text-lg font-medium text-text-primary mb-4">
              Account Actions
            </h2>
            <div class="space-y-3">
              <button
                class="w-full flex items-center justify-between px-4 py-2 text-text-primary hover:bg-gray-50 rounded-lg transition-colors"
                @click="handleChangePassword"
              >
                <span>Change Password</span>
                <div class="w-5 h-5 i-heroicons-key" />
              </button>
              <button
                class="w-full flex items-center justify-between px-4 py-2 text-text-primary hover:bg-gray-50 rounded-lg transition-colors"
                @click="handleExportData"
              >
                <span>Export Data</span>
                <div class="w-5 h-5 i-heroicons-arrow-down-tray" />
              </button>
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
