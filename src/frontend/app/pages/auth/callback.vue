<script setup lang="ts">
// Lands after Strapi's users-permissions OAuth/OIDC provider flow
// (/api/connect/:provider/redirect -> provider -> /api/connect/:provider/callback)
// completes and redirects here with ?access_token=<jwt>, per the callback
// URL configured in the admin panel - see docs/oauth-setup.md.
const router = useRouter()
const route = useRoute()

const errorMessage = ref<string | null>(null)
const isProcessing = ref(true)

useHead({
  title: 'Signing you in…'
})

onMounted(() => {
  setTimeout(async () => {
    const accessToken = route.query.access_token as string | undefined
    const providerError = route.query.error as string | undefined

    if (providerError) {
      errorMessage.value = `Sign-in was cancelled or failed: ${providerError}`
      isProcessing.value = false
      return
    }

    if (!accessToken) {
      errorMessage.value = 'No access token was returned by the identity provider.'
      isProcessing.value = false
      return
    }

    try {
      const { useAuthStore } = await import('~/stores/auth')
      const authStore = useAuthStore()
      const success = await authStore.loginWithOAuthToken(accessToken)

      if (success) {
        router.push('/dashboard')
      }
      else {
        errorMessage.value = authStore.error || 'Failed to complete sign-in.'
        isProcessing.value = false
      }
    }
    catch (error) {
      console.error('OAuth callback error:', error)
      errorMessage.value = 'Failed to complete sign-in.'
      isProcessing.value = false
    }
  }, 100)
})
</script>

<template>
  <div class="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 h-full flex-grow-1">
    <div class="max-w-md w-full space-y-8 text-center">
      <div v-if="errorMessage" class="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-lg">
        <div class="rounded-lg bg-red-50 p-4 mb-6">
          <p class="text-sm text-red-800">
            {{ errorMessage }}
          </p>
        </div>
        <NuxtLink to="/login" class="text-[#5AB69F] underline">
          Back to login
        </NuxtLink>
      </div>
      <div v-else-if="isProcessing">
        <p class="text-text-secondary">
          Signing you in…
        </p>
      </div>
    </div>
  </div>
</template>
