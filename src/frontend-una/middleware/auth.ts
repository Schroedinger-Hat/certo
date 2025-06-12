import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware if it's a server route
  if (process.server) return
  
  const authStore = useAuthStore()
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile', '/issue']
  const isProtectedRoute = protectedRoutes.some(route => 
    to.path === route || to.path.startsWith(`${route}/`)
  )
  
  // If user is not authenticated and trying to access a protected route
  if (!authStore.isAuthenticated && isProtectedRoute) {
    console.log(`Redirecting unauthenticated user from ${to.path} to login`)
    return navigateTo('/login')
  }
  
  // If user is authenticated and trying to access auth pages
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    console.log(`Redirecting authenticated user from ${to.path} to dashboard`)
    return navigateTo('/dashboard')
  }
}) 