export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on server side — auth state is only available
  // client-side (localStorage/cookies). On SSR the page will render
  // the public/generic view and the client-side hydration will enforce
  // the guard after mount.
  if (import.meta.server) {
    return
  }

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
