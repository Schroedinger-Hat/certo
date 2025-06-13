import { defineNuxtPlugin } from '#app'

// This plugin just sets up the auth provider
// Initialization is handled by auth-init.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  console.log('Running auth.ts plugin - setting up auth provider')
  
  // Make auth available via $auth in templates
  // but don't actually try to use the store here
  nuxtApp.provide('auth', {
    isAuthenticated: false,
    user: null,
  })
  
  // We'll update this with the real store in auth-init.client.ts
  console.log('Basic auth provider setup completed')
}) 