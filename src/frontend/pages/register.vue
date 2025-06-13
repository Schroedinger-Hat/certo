<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  title: 'Register - Certo',
  middleware: ['route-guard']
})

// Don't import useAuthStore directly
const router = useRouter()
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptTerms = ref(false)
const validationError = ref('')
const authStore = ref(null)
const isStoreReady = ref(false)
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
  // Clear previous errors
  validationError.value = ''

  if (!isStoreReady.value || !authStore.value) {
    validationError.value = 'Authentication system not ready. Please try again in a moment.'
    return
  }
  
  // Form validation
  if (password.value !== confirmPassword.value) {
    validationError.value = 'Passwords do not match'
    return
  }

  if (!acceptTerms.value) {
    validationError.value = 'You must accept the terms and conditions'
    return
  }
  
  if (firstName.value && lastName.value && email.value && password.value) {
    isLoading.value = true
    
    try {
      // Use username as first name + last name for Strapi
      const username = `${firstName.value.toLowerCase()}.${lastName.value.toLowerCase()}`
      
      const success = await authStore.value.register(username, email.value, password.value)
      
      if (success) {
        router.push('/dashboard')
      } else {
        validationError.value = authStore.value.error || 'Registration failed'
      }
    } catch (error) {
      console.error('Registration error:', error)
      validationError.value = 'Registration failed. Please try again.'
    } finally {
      isLoading.value = false
    }
  }
}
</script>

<template>
  <div class="flex justify-center items-center py-12">
    <NCard class="w-full max-w-md p-6">
      <template #header>
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold">Create Account</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Register to start managing your digital credentials
          </p>
        </div>
      </template>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <NAlert v-if="validationError" variant="error" class="mb-4">
          {{ validationError }}
        </NAlert>
        
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NFormItem label="First Name" required>
            <NInput
              v-model="firstName"
              placeholder="John"
              autocomplete="given-name"
              required
            />
          </NFormItem>
          
          <NFormItem label="Last Name" required>
            <NInput
              v-model="lastName"
              placeholder="Doe"
              autocomplete="family-name"
              required
            />
          </NFormItem>
        </div>
        
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
            autocomplete="new-password"
            required
          />
        </NFormItem>
        
        <NFormItem label="Confirm Password" required>
          <NInput
            v-model="confirmPassword"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
            required
          />
        </NFormItem>
        
        <div class="mt-6">
          <NCheckbox
            v-model="acceptTerms"
            required
          >
            I agree to the
            <NuxtLink to="/terms" class="text-primary hover:underline">
              Terms of Service
            </NuxtLink>
            and
            <NuxtLink to="/privacy" class="text-primary hover:underline">
              Privacy Policy
            </NuxtLink>
          </NCheckbox>
        </div>
        
        <NButton
          type="submit"
          size="lg"
          block
          :loading="isLoading"
          :disabled="!acceptTerms"
        >
          Create Account
        </NButton>
      </form>
      
      <template #footer>
        <div class="text-center mt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
            <NuxtLink to="/login" class="text-primary hover:underline">
              Sign in
            </NuxtLink>
          </p>
        </div>
      </template>
    </NCard>
  </div>
</template> 