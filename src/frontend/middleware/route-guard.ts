import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server side
  if (process.server) { return }

  const authStore = useAuthStore()
  const isAuthRoute = to.path.startsWith('/login') || to.path.startsWith('/register')
  const isProtectedRoute = to.path.startsWith('/dashboard')

  // If user is accessing a protected route without being authenticated, redirect to login
  if (isProtectedRoute && !authStore.isAuthenticated) {
    return navigateTo('/login')
  }

  // If user is authenticated and trying to access auth routes, redirect to dashboard
  if (isAuthRoute && authStore.isAuthenticated) {
    return navigateTo('/dashboard')
  }
})
