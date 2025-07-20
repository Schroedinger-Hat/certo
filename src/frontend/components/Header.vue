<script setup lang="ts">
const { headerLogo } = useHomeContent()
const router = useRouter()
const isScrolled = ref(false)
const isStoreReady = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const showUserMenu = ref(false)
const isAuthenticated = ref(false)
const authStore = ref<ReturnType<typeof useAuthStore> | null>(null)
const userName = ref('')
const isMobileMenuOpen = ref(false)

watch(
  [isStoreReady, authStore],
  ([ready, store]) => {
    if (ready && store?.user) {
      isAuthenticated.value = store.isAuthenticated
      userName.value = store.user.username
        || (store.user.email ? store.user.email.split('@')[0] : '')
    }
    else {
      isAuthenticated.value = false
      userName.value = ''
    }
  },
  { immediate: true }
)

function updateScroll() {
  isScrolled.value = window.scrollY > 20
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (userMenuRef.value && !userMenuRef.value.contains(target)) {
    showUserMenu.value = false
  }
}

function handleLogout() {
  if (isStoreReady.value && authStore.value) {
    authStore.value.logout()
    isAuthenticated.value = false
    userName.value = ''
    router.push('/')
    showUserMenu.value = false
  }
}

onMounted(() => {
  // Add click event listener for click-outside detection
  document.addEventListener('click', handleClickOutside)

  // Safe initialization of auth store
  // Using setTimeout to ensure it runs after Pinia and plugins are initialized
  setTimeout(() => {
    try {
      // Try to dynamically import the store
      import('~/stores/auth')
        .then((module) => {
          const { useAuthStore } = module
          authStore.value = useAuthStore()
          isStoreReady.value = true
        })
        .catch((err) => {
          console.error('Error importing auth store:', err)
        })
    }
    catch (error) {
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
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="[isScrolled ? 'bg-white/80 backdrop-blur-lg shadow-sm' : '']"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <NuxtImg
            :src="headerLogo.img.src"
            :alt="headerLogo.img.alt"
            class="h-10 w-auto"
          />
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center gap-6">
          <NuxtLink
            v-for="link in HEADER_NAV_LINKS"
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
                  class="flex items-center gap-2 text-text-primary hover:text-text-secondary transition-colors"
                  @click="showUserMenu = !showUserMenu"
                >
                  <span class="font-medium">{{ userName }}</span>
                  <div
                    class="w-5 h-5 i-heroicons-chevron-down"
                    :class="{ 'rotate-180': showUserMenu }"
                  />
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
                    class="block w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-gray-50"
                    @click="handleLogout"
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
                to="/get-started"
                class="px-4 py-2 bg-[#5AB69F] rounded-full font-medium hover:bg-[#5AB69F]/90 transition-colors text-text-primary"
              >
                Get Started
              </NuxtLink>
            </template>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <button
          aria-label="Toggle mobile menu"
          class="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <div v-if="!isMobileMenuOpen" class="w-6 h-6 i-heroicons-bars-3" />
          <div v-else class="w-6 h-6 i-heroicons-x-mark" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="isMobileMenuOpen" class="lg:hidden bg-white border-t">
      <div class="px-4 py-2 space-y-1">
        <NuxtLink
          v-for="link in HEADER_NAV_LINKS"
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
              class="block w-full py-2 text-text-primary hover:text-text-secondary transition-colors"
              @click="handleLogout"
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
              to="/get-started"
              class="block w-full py-2 text-center bg-[#5AB69F] text-white rounded-full hover:bg-[#5AB69F]/90 transition-colors"
            >
              Get Started
            </NuxtLink>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>
