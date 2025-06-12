<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

// Don't import useAuthStore directly in the component
// const authStore = useAuthStore() // This would cause the error
const router = useRouter()
const isDark = ref(false)
const isMenuOpen = ref(false)
const showUserMenu = ref(false)
const userMenuRef = ref(null)
const isStoreReady = ref(false)
const authStore = ref(null)
const userName = ref('')
const isAuthenticated = ref(false)

// Safely initialize the auth store
onMounted(() => {
  // Check if dark mode was previously set
  const isDarkMode = localStorage.getItem('darkMode') === 'true'
  if (isDarkMode) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  
  // Add click event listener for click-outside detection
  document.addEventListener('click', handleClickOutside)
  
  // Safe initialization of auth store
  // Using setTimeout to ensure it runs after Pinia and plugins are initialized
  setTimeout(() => {
    try {
      // Try to dynamically import the store
      import('~/stores/auth').then(module => {
        const { useAuthStore } = module
        authStore.value = useAuthStore()
        isStoreReady.value = true
        
        // Set up computed values now that store is available
        isAuthenticated.value = authStore.value.isAuthenticated
        if (authStore.value.user) {
          userName.value = authStore.value.user.username || 
            `${authStore.value.user.email.split('@')[0]}`
        }
        
        console.log('Auth store successfully accessed in layout')
      }).catch(err => {
        console.error('Error importing auth store:', err)
      })
    } catch (error) {
      console.error('Could not access auth store in layout:', error)
    }
  }, 100)
})

onBeforeUnmount(() => {
  // Remove event listener when component is unmounted
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

const toggleDark = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('darkMode', 'true')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', 'false')
  }
}

const handleLogout = () => {
  if (isStoreReady.value && authStore.value) {
    authStore.value.logout()
    isAuthenticated.value = false
    userName.value = ''
    router.push('/')
    showUserMenu.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-gray-200 dark:border-gray-800">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <NuxtLink to="/" class="text-xl font-bold">Certo</NuxtLink>
        
        <nav class="flex gap-6">
          <NuxtLink to="/" class="hover:text-primary-600">Home</NuxtLink>
          <NuxtLink to="/verify" class="hover:text-primary-600">Verify</NuxtLink>
          <NuxtLink to="/dashboard" class="hover:text-primary-600">Dashboard</NuxtLink>
        </nav>
        
        <!-- Auth actions -->
        <div class="flex items-center gap-4">
          <!-- Show when authenticated -->
          <div v-if="isStoreReady && isAuthenticated" class="relative" ref="userMenuRef">
            <button 
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 hover:text-primary-600 focus:outline-none"
            >
              <div class="i-lucide-user-circle w-5 h-5"></div>
              <span>{{ userName }}</span>
              <div :class="[
                'w-4 h-4 transition-transform', 
                showUserMenu ? 'rotate-180 i-lucide-chevron-up' : 'i-lucide-chevron-down'
              ]"></div>
            </button>
            
            <!-- User dropdown menu -->
            <div 
              v-if="showUserMenu" 
              class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700"
            >
              <NuxtLink 
                to="/dashboard" 
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="showUserMenu = false"
              >
                <div class="i-lucide-layout-dashboard w-4 h-4 inline-block mr-2"></div>
                Dashboard
              </NuxtLink>
              <NuxtLink 
                to="/dashboard/profile" 
                class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="showUserMenu = false"
              >
                <div class="i-lucide-user w-4 h-4 inline-block mr-2"></div>
                Profile
              </NuxtLink>
              <hr class="my-1 border-gray-200 dark:border-gray-700" />
              <button 
                @click="handleLogout"
                class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <div class="i-lucide-log-out w-4 h-4 inline-block mr-2"></div>
                Logout
              </button>
            </div>
          </div>
          
          <!-- Show when not authenticated -->
          <template v-else>
            <NuxtLink to="/login" class="hover:text-primary-600">Log In</NuxtLink>
            <NuxtLink to="/register" class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Register</NuxtLink>
          </template>
          
          <!-- Dark mode toggle -->
          <button @click="toggleDark" class="text-gray-600 dark:text-gray-400 hover:text-primary-600 ml-2">
            <div v-if="isDark" class="i-lucide-sun w-5 h-5"></div>
            <div v-else class="i-lucide-moon w-5 h-5"></div>
          </button>
        </div>
      </div>
    </header>
    
    <main class="flex-1">
      <slot />
    </main>
    
    <footer class="bg-gray-100 dark:bg-gray-900 py-8">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center">
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              &copy; {{ new Date().getFullYear() }} Certo. All rights reserved.
            </p>
          </div>
          <div class="flex gap-4">
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-primary-600">
              <div class="i-lucide-github w-5 h-5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-primary-600">
              <div class="i-lucide-twitter w-5 h-5"></div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template> 