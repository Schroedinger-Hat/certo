<script setup lang="ts">
const { t } = useI18n()
const router = useRouter()
const email = ref('')
const password = ref('')
const authStore = ref(null)
const isStoreReady = ref(false)
const authError = ref(null)
const isLoading = ref(false)
const pageDescription = ref('Sign in to your Certo account to access your credentials and dashboard.')

// OAuth / OIDC providers enabled via NUXT_PUBLIC_OAUTH_PROVIDERS env var
// (comma-separated list of Strapi users-permissions provider names).
const oauthProviders = computed(() => {
  const raw = import.meta.env?.NUXT_PUBLIC_OAUTH_PROVIDERS
    ?? process.env.NUXT_PUBLIC_OAUTH_PROVIDERS
    ?? ''
  return raw.split(',').map((p: string) => p.trim()).filter(Boolean)
})

const apiBaseUrl = import.meta.env?.NUXT_PUBLIC_API_URL
  ?? process.env.NUXT_PUBLIC_API_URL
  ?? 'http://localhost:1337'

function startOAuth(provider: string) {
  // Redirect to Strapi's users-permissions connect endpoint, which
  // redirects to the provider, then back to /auth/callback with
  // ?access_token=<jwt> (see docs/oauth-setup.md).
  window.location.href = `${apiBaseUrl}/api/connect/${provider}`
}

useSeoMeta({
  description: pageDescription.value,
  ogDescription: pageDescription.value,
})

useHead({
  title: 'Login',
  link: [
    { rel: 'canonical', href: `${WEBSITE_URL}/login` }
  ]
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
      }
      else {
        authError.value = authStore.value.error
      }
    }
    catch (error) {
      console.error('Login error:', error)
      authError.value = 'Login failed. Please try again.'
    }
    finally {
      isLoading.value = false
    }
  }
}

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
</script>

<template>
  <div class="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 h-full flex-grow-1">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-4xl font-bold text-text-primary">
          {{ t('auth.signInTitle') }}
        </h2>
        <p class="mt-2 text-text-secondary">
          {{ t('auth.signInSubtitle') }}
        </p>
      </div>

      <!-- Form -->
      <div class="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
        <!-- Error Message -->
        <div v-if="authError" class="rounded-lg bg-red-50 p-4 mb-6">
          <div class="flex">
            <div class="flex-shrink-0">
              <div class="w-5 h-5 i-heroicons-x-circle text-red-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-800">
                {{ authError }}
              </p>
            </div>
          </div>
        </div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-text-primary">
              {{ t('auth.email') }}
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5AB69F] focus:border-transparent"
                placeholder="Enter your email"
              >
            </div>
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-text-primary">
              {{ t('auth.password') }}
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                name="password"
                type="password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5AB69F] focus:border-transparent"
                placeholder="Enter your password"
              >
            </div>
          </div>

          <!-- Remember & Forgot -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-[#00E5C5] focus:ring-[#5AB69F] border-gray-300 rounded"
              >
              <label for="remember-me" class="ml-2 block text-sm text-text-secondary">
                {{ t('auth.rememberMe') }}
              </label>
            </div>

            <div class="text-sm">
              <NuxtLink to="/forgot-password" class="font-medium text-text-secondary hover:text-[#5AB69F]/80">
                {{ t('auth.forgotPassword') }}
              </NuxtLink>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-white bg-[#5AB69F] hover:bg-[#5AB69F]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!isLoading" class="text-[#000]">{{ t('nav.login') }}</span>
              <div v-else class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </button>
          </div>
        </form>

        <!-- OAuth / OIDC providers (optional, env-driven) -->
        <div v-if="oauthProviders.length > 0" class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white/80 text-text-secondary">
                {{ t('auth.orContinueWith') }}
              </span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 gap-3">
            <button
              v-for="provider in oauthProviders"
              :key="provider"
              type="button"
              class="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-text-primary hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00E5C5]"
              @click="startOAuth(provider)"
            >
              <span class="capitalize">{{ provider }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
