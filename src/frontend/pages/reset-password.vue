<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '#imports'
import { apiClient } from '~/api/api-client'

const password = ref('')
const passwordConfirmation = ref('')
const isSubmitting = ref(false)
const error = ref(null)
const success = ref(false)
const token = ref(null)
const router = useRouter()
const route = useRoute()

useHead({
  title: 'Reset Password | Certo',
})

onMounted(() => {
  token.value = route.query.code
  if (!token.value) {
    error.value = 'Reset token is missing. Please check your reset link.'
  }
})

async function handleSubmit() {
  if (password.value !== passwordConfirmation.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (!token.value) {
    error.value = 'Reset token is missing. Please check your reset link.'
    return
  }
  isSubmitting.value = true
  error.value = null
  try {
    await apiClient.post('/api/auth/reset-password', {
      code: token.value,
      password: password.value,
      passwordConfirmation: passwordConfirmation.value
    })
    success.value = true
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An error occurred while resetting password'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold text-center mb-8">Set New Password</h1>
    <NAlert v-if="success" variant="success" class="mb-4">
      <p>Your password has been reset successfully!</p>
      <p>You'll be redirected to the login page in a few seconds.</p>
      <div class="mt-4 text-center">
        <NButton @click="() => router.push('/login')" variant="outline">Go to login</NButton>
      </div>
    </NAlert>
    <template v-else>
      <NAlert v-if="error" variant="error" class="mb-4">{{ error }}</NAlert>
      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          Enter your new password below.
        </p>
        <form @submit.prevent="handleSubmit">
          <NFormItem label="New Password" required>
            <NInput
              v-model="password"
              type="password"
              placeholder="Enter new password"
              required
              minlength="6"
              :disabled="isSubmitting"
            />
          </NFormItem>
          <NFormItem label="Confirm New Password" required>
            <NInput
              v-model="passwordConfirmation"
              type="password"
              placeholder="Confirm new password"
              required
              minlength="6"
              :disabled="isSubmitting"
            />
          </NFormItem>
          <NButton
            type="submit"
            :loading="isSubmitting"
            class="w-full mt-4"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Resetting...' : 'Reset Password' }}
          </NButton>
          <div class="mt-4 text-center">
            <NButton variant="link" @click="() => router.push('/login')">Back to login</NButton>
          </div>
        </form>
      </div>
    </template>
  </div>
</template> 