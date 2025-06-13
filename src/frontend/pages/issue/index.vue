<script setup>
import BadgeIssuanceForm from '~/components/BadgeIssuanceForm.vue'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Issue Badge | Certo',
  meta: [
    { name: 'description', content: 'Issue digital badges using the Open Badges 3.0 standard.' }
  ]
})

const authStore = useAuthStore()
</script>

<template>
  <main class="flex min-h-screen flex-col py-12 px-6">
    <div class="container mx-auto max-w-6xl">
      <h1 class="text-3xl font-bold mb-8 text-center">Issue Badge</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-10 text-center max-w-2xl mx-auto">
        Issue digital badges to recipients following the Open Badges 3.0 standard.
        Recipients will receive an email with their badge that they can share on
        social media platforms.
      </p>

      <template v-if="authStore.isLoading">
        <div class="flex justify-center py-12">
          <div class="i-lucide-loader animate-spin w-8 h-8"></div>
        </div>
      </template>
      
      <template v-else-if="!authStore.isAuthenticated">
        <NAlert variant="warning" class="mb-6">
          <div class="flex flex-col items-center text-center">
            <p class="font-medium">You need to be logged in to issue badges.</p>
            <NButton class="mt-4" @click="() => navigateTo('/login')">
              Log In
            </NButton>
          </div>
        </NAlert>
      </template>
      
      <template v-else-if="!authStore.isIssuer">
        <NAlert variant="warning" class="mb-6">
          <div class="flex flex-col items-center text-center">
            <p class="font-medium">You need to have an Issuer profile to issue badges.</p>
            <p class="text-sm mt-2">Please contact an administrator to upgrade your account.</p>
          </div>
        </NAlert>
      </template>
      
      <template v-else>
        <BadgeIssuanceForm />
      </template>
    </div>
  </main>
</template> 