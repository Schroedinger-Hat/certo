import { useAuthStore } from '~/stores/auth'
import { watch } from 'vue'

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware if it's a server route
  if (process.server) return
  
  const authStore = useAuthStore()

  // Wait for store to finish loading if needed
  if (authStore.isLoading) {
    await new Promise<void>(resolve => {
      const unwatch = watch(
        () => authStore.isLoading,
        (loading) => {
          if (!loading) {
            unwatch()
            resolve()
          }
        },
        { immediate: true }
      )
    })
  }
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile']
  const isProtectedRoute = protectedRoutes.some(route => 
    to.path === route || to.path.startsWith(`${route}/`)
  )
  
  // Routes that require Issuer role
  const issuerRoutes = ['/issue']
  const isIssuerRoute = issuerRoutes.some(route => 
    to.path === route || to.path.startsWith(`${route}/`)
  )
  
  // If user is not authenticated and trying to access a protected route
  if (!authStore.isAuthenticated && (isProtectedRoute || isIssuerRoute)) {
    console.log(`Redirecting unauthenticated user from ${to.path} to login`)
    return navigateTo('/login')
  }
  
  // If user is not an issuer and trying to access issuer routes
  if (isIssuerRoute && !authStore.isIssuer) {
    console.log('isIssuerRoute', isIssuerRoute)
    console.log('authStore.isIssuer', authStore)
    console.log(`Redirecting non-issuer user from ${to.path} to dashboard`)
    return navigateTo('/dashboard')
  }
  
  // If user is authenticated and trying to access auth pages
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    console.log(`Redirecting authenticated user from ${to.path} to dashboard`)
    return navigateTo('/dashboard')
  }
}) 