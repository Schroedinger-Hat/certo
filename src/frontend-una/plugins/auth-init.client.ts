import { useAuthStore } from '~/stores/auth'
import { defineNuxtPlugin } from '#app'

// This plugin runs on the client side only and initializes auth
export default defineNuxtPlugin({
  name: 'auth-init',
  enforce: 'default', // Run after pinia-init.client.ts
  setup(nuxtApp) {
    console.log('Running auth-init.client.ts plugin')
    
    let authInitialized = false
    
    // Function to safely initialize auth
    const initAuth = async () => {
      if (authInitialized) return
      
      try {
        console.log('Initializing auth store')
        const authStore = useAuthStore()
        
        // Initialize auth state
        await authStore.init()
        authInitialized = true
        
        // Log authentication status
        if (authStore.isAuthenticated) {
          console.log('User is authenticated:', authStore.user?.username || authStore.user?.email)
        } else {
          console.log('User is not authenticated')
        }
      } catch (error) {
        console.error('Error initializing auth store:', error)
      }
    }
    
    // First try at the "app:created" hook
    nuxtApp.hook('app:created', async () => {
      console.log('App created hook - attempting auth init')
      await initAuth()
    })
    
    // Try again at "vue:setup"
    nuxtApp.hook('vue:setup', async () => {
      console.log('Vue setup hook - attempting auth init')
      await initAuth()
    })
    
    // Final attempt at "app:mounted"
    nuxtApp.hook('app:mounted', async () => {
      console.log('App mounted hook - attempting auth init')
      await initAuth()
    })
    
    return {
      provide: {
        authInit: true
      }
    }
  }
}) 