import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/stores/auth'

// This plugin runs on the client side only and initializes auth
export default defineNuxtPlugin({
  name: 'auth-init',
  enforce: 'default', // Run after pinia-init.client.ts
  setup(nuxtApp) {
    let authInitialized = false

    // Function to safely initialize auth
    const initAuth = async () => {
      if (authInitialized) { return }

      try {
        const authStore = useAuthStore()

        // Initialize auth state
        await authStore.init()
        authInitialized = true
      }
      catch (error) {
        console.error('Error initializing auth store:', error)
      }
    }

    // First try at the "app:created" hook
    nuxtApp.hook('app:created', async () => {
      await initAuth()
    })

    // Try again at "vue:setup"
    nuxtApp.hook('vue:setup', async () => {
      await initAuth()
    })

    // Final attempt at "app:mounted"
    nuxtApp.hook('app:mounted', async () => {
      await initAuth()
    })

    return {
      provide: {
        authInit: true
      }
    }
  }
})
