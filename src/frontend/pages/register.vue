<script setup lang="ts">
definePageMeta({
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
const pageDescription = ref('Create a Certo account to issue, manage, and verify digital credentials.')

onMounted(() => {
  // Safely initialize auth store with a delay
  setTimeout(async () => {
    try {
      const { useAuthStore } = await import('~/stores/auth')
      authStore.value = useAuthStore()
      isStoreReady.value = true

      // If user is already authenticated, redirect to dashboard
      if (authStore.value.isAuthenticated) {
        router.push('/dashboard')
      }
    }
    catch (error) {
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
      }
      else {
        validationError.value = authStore.value.error || 'Registration failed'
      }
    }
    catch (error) {
      console.error('Registration error:', error)
      validationError.value = 'Registration failed. Please try again.'
    }
    finally {
      isLoading.value = false
    }
  }
}

useSeoMeta({
  description: pageDescription.value,
  ogDescription: pageDescription.value,
  ogUrl: `${WEBSITE_URL}/register`
})

useHead({
  title: 'Register',
  link: [
    { rel: 'canonical', href: `${WEBSITE_URL}/register` }
  ]
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-4xl font-bold text-text-primary">
          Create account
        </h2>
        <p class="mt-2 text-text-secondary">
          Start your journey with Certo
        </p>
      </div>

      <!-- Form -->
      <div class="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-text-primary">
              Username
            </label>
            <div class="mt-1">
              <input
                id="username"
                v-model="firstName"
                name="username"
                type="text"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                placeholder="Choose a username"
              >
            </div>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-text-primary">
              Email address
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                placeholder="Enter your email"
              >
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-text-primary">
              Password
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                name="password"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                placeholder="Create a strong password"
              >
            </div>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-text-primary">
              Confirm password
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00E5C5] focus:border-transparent"
                placeholder="Confirm your password"
              >
            </div>
          </div>

          <!-- Terms -->
          <div class="flex items-center">
            <input
              id="terms"
              v-model="acceptTerms"
              name="terms"
              type="checkbox"
              required
              class="h-4 w-4 text-[#00E5C5] focus:ring-[#00E5C5] border-gray-300 rounded"
            >
            <label for="terms" class="ml-2 block text-sm text-text-secondary">
              I agree to the
              <NuxtLink to="/terms-and-conditions" class="font-medium text-[#00E5C5] hover:text-[#00E5C5]/80">Terms and Conditions</NuxtLink>
              and
              <NuxtLink to="/privacy-policy" class="font-medium text-[#00E5C5] hover:text-[#00E5C5]/80">Privacy Policy</NuxtLink>
            </label>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-white bg-[#00E5C5] hover:bg-[#00E5C5]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!isLoading">Create account</span>
              <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </button>
          </div>
        </form>

        <!-- Sign in link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-text-secondary">
            Already have an account?
            <NuxtLink to="/login" class="font-medium text-[#00E5C5] hover:text-[#00E5C5]/80">
              Sign in
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
