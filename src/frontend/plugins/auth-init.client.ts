import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/stores/auth'

// This plugin runs on the client side only and initializes auth
export default defineNuxtPlugin({
  name: 'auth-init',
  setup(nuxtApp) {
    let authInitialized = false

    // Function to safely initialize auth
    const initAuth = async () => {
      if (authInitialized) {
        return
      }

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

    // Use app:created hook (async is safe here)
    nuxtApp.hook('app:created', async () => {
      await initAuth()
    })

    // Use app:mounted for client-side initialization (async is safe here)
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
