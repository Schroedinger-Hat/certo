<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import Footer from '~/components/Footer.vue'

const router = useRouter()
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const isStoreReady = ref(false)
const authStore = ref<ReturnType<typeof useAuthStore> | null>(null)
const userName = ref('')
const isAuthenticated = ref(false)
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

// Watch for auth store changes
watch([isStoreReady, authStore], ([ready, store]) => {
  if (ready && store?.user) {
    isAuthenticated.value = store.isAuthenticated
    userName.value = store.user.username || 
      (store.user.email ? store.user.email.split('@')[0] : '')
  } else {
    isAuthenticated.value = false
    userName.value = ''
  }
}, { immediate: true })

// Handle scroll events
const updateScroll = () => {
  isScrolled.value = window.scrollY > 20
}

// Safely initialize the auth store
onMounted(() => {
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
        console.log('Auth store successfully accessed in layout')
      }).catch(err => {
        console.error('Error importing auth store:', err)
      })
    } catch (error) {
      console.error('Could not access auth store in layout:', error)
    }
  }, 100)

  // Initialize scroll event listener
  window.addEventListener('scroll', updateScroll)
  updateScroll() // Check initial scroll position
})

onUnmounted(() => {
  // Remove event listeners
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updateScroll)
  
  // Clear auth store reference
  authStore.value = null
  isStoreReady.value = false
})

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (userMenuRef.value && !userMenuRef.value.contains(target)) {
    showUserMenu.value = false
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

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Issue Badges', href: '/issue' },
  { name: 'Verify', href: '/verify' }
]
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#FFE5AE]/20">
    <!-- Navigation -->
    <nav 
      :class="[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : ''
      ]"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2">
            <span class="text-2xl font-bold">Certo</span>
          </NuxtLink>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-6">
            <NuxtLink 
              v-for="link in navLinks" 
              :key="link.name"
              :to="link.href"
              class="text-text-secondary hover:text-text-primary transition-colors font-medium"
            >
              {{ link.name }}
            </NuxtLink>

            <!-- Auth Buttons -->
            <div class="flex items-center gap-4 ml-6">
              <template v-if="isAuthenticated && userName">
                <div class="relative">
                  <button
                    ref="userMenuRef"
                    @click="showUserMenu = !showUserMenu"
                    class="flex items-center gap-2 text-text-primary hover:text-text-secondary transition-colors"
                  >
                    <span class="font-medium">{{ userName }}</span>
                    <div class="w-5 h-5 i-heroicons-chevron-down" :class="{ 'rotate-180': showUserMenu }"></div>
                  </button>

                  <!-- User Menu Dropdown -->
                  <div
                    v-if="showUserMenu"
                    class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
                  >
                    <!-- <NuxtLink
                      to="/profile"
                      class="block px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-gray-50"
                      @click="showUserMenu = false"
                    >
                      Profile Settings
                    </NuxtLink> -->
                    <button
                      @click="handleLogout"
                      class="block w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </template>
              <template v-else>
                <NuxtLink 
                  to="/login"
                  class="font-medium text-text-primary hover:text-text-secondary transition-colors"
                >
                  Sign in
                </NuxtLink>
                <NuxtLink 
                  to="/register"
                  class="px-4 py-2 bg-[#00E5C5] text-white rounded-full font-medium hover:bg-[#00E5C5]/90 transition-colors"
                >
                  Get Started
                </NuxtLink>
              </template>
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <button 
            class="md:hidden p-2 rounded-lg hover:bg-gray-100"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
          >
            <div class="w-6 h-6 i-heroicons-bars-3" v-if="!isMobileMenuOpen"></div>
            <div class="w-6 h-6 i-heroicons-x-mark" v-else></div>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div 
        v-if="isMobileMenuOpen"
        class="md:hidden bg-white border-t"
      >
        <div class="px-4 py-2 space-y-1">
          <NuxtLink 
            v-for="link in navLinks" 
            :key="link.name"
            :to="link.href"
            class="block py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {{ link.name }}
          </NuxtLink>
          <div class="pt-4 space-y-2">
            <template v-if="isAuthenticated && userName">
              <!-- <NuxtLink 
                to="/profile"
                class="block w-full py-2 text-text-primary hover:text-text-secondary transition-colors"
              >
                Profile Settings
              </NuxtLink> -->
              <button
                @click="handleLogout"
                class="block w-full py-2 text-text-primary hover:text-text-secondary transition-colors"
              >
                Sign Out
              </button>
            </template>
            <template v-else>
              <NuxtLink 
                to="/login"
                class="block w-full py-2 text-center text-text-primary hover:text-text-secondary transition-colors"
              >
                Sign in
              </NuxtLink>
              <NuxtLink 
                to="/register"
                class="block w-full py-2 text-center bg-[#00E5C5] text-white rounded-full hover:bg-[#00E5C5]/90 transition-colors"
              >
                Get Started
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="pt-16 flex-grow">
      <slot />
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<style>
:root {
  --text-primary: #2D3436;
  --text-secondary: #636E72;
}

body {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--text-primary);
}

.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 