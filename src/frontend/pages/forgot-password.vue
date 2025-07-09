<script setup lang="ts">
const email = ref('')
const isLoading = ref(false)
const success = ref(false)
const error = ref('')
const config = useRuntimeConfig()
const apiUrl = config.public.apiUrl
const pageDescription = ref('Reset your Certo account password')

async function handleSubmit() {
  error.value = ''
  isLoading.value = true
  success.value = false
  try {
    const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error?.message || 'Failed to send reset email')
    }
    success.value = true
  }
  catch (e: any) {
    error.value = e.message || 'Failed to send reset email'
  }
  finally {
    isLoading.value = false
  }
}

useHead({
  title: 'Forgot Password',
  link: [
    { rel: 'canonical', href: `${WEBSITE_URL}/forgot-password` }
  ]
})

useSeoMeta({
  ogDescription: pageDescription.value,
  description: pageDescription.value,
})
</script>

<template>
  <div class="bg-gradient-to-b from-white to-[#FFE5AE]/20 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 h-full flex-grow-1">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-4xl font-bold text-text-primary">
          Reset password
        </h2>
        <p class="mt-2 text-text-secondary">
          We'll send you instructions to reset your password
        </p>
      </div>

      <!-- Form -->
      <div class="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-text-primary">
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                placeholder="Enter your email"
                :disabled="isLoading"
                autocomplete="email"
              >
            </div>
          </div>

          <!-- Success Message -->
          <div v-if="success" class="rounded-lg bg-green-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <div class="w-5 h-5 i-heroicons-check-circle text-green-400" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-800">
                  If an account exists for this email, a reset link has been sent.
                </p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="rounded-lg bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <div class="w-5 h-5 i-heroicons-x-circle text-red-400" />
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-800">
                  {{ error }}
                </p>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-black bg-[#5AB69F] hover:bg-[#5AB69F]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Send reset link</span>
            <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </button>
        </form>

        <!-- Back to login -->
        <div class="mt-6 text-center">
          <p class="text-sm text-text-secondary">
            Remember your password?
            <NuxtLink to="/login" class="font-medium text-[#5AB69F] hover:text-[#5AB69F]/80">
              Sign in
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
