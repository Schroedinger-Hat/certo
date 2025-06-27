import { defineNuxtPlugin } from '#app'
import { createPinia } from 'pinia'

// This plugin initializes Pinia early
export default defineNuxtPlugin({
  name: 'pinia-init',
  enforce: 'pre', // Run before other plugins
  setup(nuxtApp) {
    
    // Create and use Pinia
    const pinia = createPinia()
    nuxtApp.vueApp.use(pinia)

    return {
      provide: {
        piniaInit: true
      }
    }
  }
})
