<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const availableLocales = computed(() =>
  (locales.value as Array<{ code: string; name: string }>).filter(l => l.code !== locale.value)
)

const currentLocale = computed(() =>
  (locales.value as Array<{ code: string; name: string }>).find(l => l.code === locale.value)
)

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

onClickOutside(dropdownRef, () => { isOpen.value = false })
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <button
      class="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
      :aria-label="`Language: ${currentLocale?.name}`"
      @click="isOpen = !isOpen"
    >
      <span class="i-lucide-globe w-4 h-4" />
      <span class="hidden sm:inline">{{ currentLocale?.name }}</span>
      <span class="i-lucide-chevron-down w-3 h-3 transition-transform" :class="{ 'rotate-180': isOpen }" />
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-1 w-40 rounded-xl bg-white border border-gray-200 shadow-lg z-50 overflow-hidden"
    >
      <!-- Current locale (shown for reference) -->
      <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
        {{ currentLocale?.name }}
      </div>
      <!-- Other locales -->
      <button
        v-for="l in availableLocales"
        :key="l.code"
        class="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        @click="setLocale(l.code); isOpen = false"
      >
        {{ l.name }}
      </button>
    </div>
  </div>
</template>
