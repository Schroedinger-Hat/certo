<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHead } from '#imports'

const email = ref('')
const isLoading = ref(false)
const success = ref(false)
const error = ref('')
const router = useRouter()

useHead({
  title: 'Forgot Password | Certo',
  meta: [
    { name: 'description', content: 'Reset your Certo account password.' }
  ]
})

async function handleSubmit() {
  error.value = ''
  isLoading.value = true
  success.value = false
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error?.message || 'Failed to send reset email')
    }
    success.value = true
  } catch (e: any) {
    error.value = e.message || 'Failed to send reset email'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow p-8">
      <h1 class="text-2xl font-bold mb-4 text-center">Forgot Password</h1>
      <p class="mb-6 text-gray-600 dark:text-gray-400 text-center">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600"
            autocomplete="email"
            :disabled="isLoading"
          />
        </div>
        <button
          type="submit"
          class="w-full py-2 px-4 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>
      <div v-if="success" class="mt-4 text-green-600 text-center">
        If an account exists for this email, a reset link has been sent.
      </div>
      <div v-if="error" class="mt-4 text-red-600 text-center">
        {{ error }}
      </div>
      <div class="mt-6 text-center">
        <NuxtLink to="/login" class="text-primary-600 hover:underline">Back to Login</NuxtLink>
      </div>
    </div>
  </main>
</template> 