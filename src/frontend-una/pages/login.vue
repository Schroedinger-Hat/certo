<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  title: 'Login - Certo',
  middleware: ['route-guard']
})

// Don't import useAuthStore directly
const router = useRouter()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const authStore = ref(null)
const isStoreReady = ref(false)
const authError = ref(null)
const isLoading = ref(false)

onMounted(() => {
  // Safely initialize auth store with a delay
  setTimeout(async () => {
    try {
      const { useAuthStore } = await import('~/stores/auth')
      authStore.value = useAuthStore()
      isStoreReady.value = true
      
      // If user is already authenticated, redirect to dashboard
      if (authStore.value.isAuthenticated) {
        console.log('User already authenticated, redirecting to dashboard')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error accessing auth store:', error)
    }
  }, 100)
})

async function handleSubmit() {
  if (!isStoreReady.value || !authStore.value) {
    authError.value = 'Authentication system not ready. Please try again in a moment.'
    return
  }
  
  if (email.value && password.value) {
    isLoading.value = true
    authError.value = null
    
    try {
      const success = await authStore.value.login(email.value, password.value)
      
      if (success) {
        router.push('/dashboard')
      } else {
        authError.value = authStore.value.error
      }
    } catch (error) {
      console.error('Login error:', error)
      authError.value = 'Login failed. Please try again.'
    } finally {
      isLoading.value = false
    }
  }
}
</script>

<template>
  <div class="flex justify-center items-center min-h-[calc(100vh-12rem)]">
    <NCard class="w-full max-w-md p-6">
      <template #header>
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold">Sign In</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Enter your credentials to access your account
          </p>
        </div>
      </template>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <NAlert v-if="authError" variant="error" class="mb-4">
          {{ authError }}
        </NAlert>
        
        <NFormItem label="Email" required>
          <NInput
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
        </NFormItem>
        
        <NFormItem label="Password" required>
          <NInput
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </NFormItem>
        
        <div class="flex items-center justify-between">
          <NCheckbox v-model="rememberMe" label="Remember me" />
          <NuxtLink to="/forgot-password" class="text-sm text-primary hover:underline">
            Forgot password?
          </NuxtLink>
        </div>
        
        <NButton
          type="submit"
          size="lg"
          block
          :loading="isLoading"
        >
          Sign In
        </NButton>
      </form>
      
      <template #footer>
        <div class="text-center mt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?
            <NuxtLink to="/register" class="text-primary hover:underline">
              Create one
            </NuxtLink>
          </p>
        </div>
      </template>
    </NCard>
  </div>
</template> 