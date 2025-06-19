<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '#imports'

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const success = ref(false)
const error = ref('')
const code = ref('')
const router = useRouter()
const route = useRoute()

useHead({
  title: 'Reset Password | Certo',
  meta: [
    { name: 'description', content: 'Set a new password for your Certo account.' }
  ]
})

onMounted(() => {
  // Get the reset code from the URL
  code.value = route.query.code as string
  if (!code.value) {
    error.value = 'Reset code is missing. Please check your reset link.'
  }
})

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (!code.value) {
    error.value = 'Reset code is missing. Please check your reset link.'
    return
  }

  error.value = ''
  isLoading.value = true
  success.value = false

  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code.value,
        password: password.value,
        passwordConfirmation: confirmPassword.value
      })
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error?.message || 'Failed to reset password')
    }

    success.value = true
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (e: any) {
    error.value = e.message || 'Failed to reset password'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-[#FFE5AE]/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-4xl font-bold text-text-primary">Set new password</h2>
        <p class="mt-2 text-text-secondary">Enter your new password below</p>
      </div>

      <!-- Form -->
      <div class="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
        <!-- Success Message -->
        <div v-if="success" class="rounded-lg bg-green-50 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <div class="w-5 h-5 i-heroicons-check-circle text-green-400"></div>
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-800">
                Your password has been reset successfully!
              </p>
              <p class="text-sm text-green-700 mt-1">
                Redirecting to login page in a few seconds...
              </p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="rounded-lg bg-red-50 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <div class="w-5 h-5 i-heroicons-x-circle text-red-400"></div>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">{{ error }}</p>
            </div>
          </div>
        </div>

        <form v-if="!success" @submit.prevent="handleSubmit" class="space-y-6">
          <!-- New Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-text-primary">
              New password
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                type="password"
                required
                minlength="6"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                placeholder="Enter new password"
                :disabled="isLoading"
                autocomplete="new-password"
              />
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-text-primary">
              Confirm new password
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                required
                minlength="6"
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                placeholder="Confirm new password"
                :disabled="isLoading"
                autocomplete="new-password"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-white bg-[#00E5C5] hover:bg-[#00E5C5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Reset password</span>
            <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </button>
        </form>

        <!-- Back to login -->
        <div class="mt-6 text-center">
          <p class="text-sm text-text-secondary">
            Remember your password?
            <NuxtLink to="/login" class="font-medium text-[#00E5C5] hover:text-[#00E5C5]/80">
              Sign in
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template> 