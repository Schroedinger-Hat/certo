<template>
  <transition name="fade">
    <div
      v-if="toast.visible"
      class="fixed bottom-8 left-1/2 z-50 transform -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center min-w-[260px] max-w-xs"
      :class="toast.type === 'success' ? 'bg-green-50 text-green-800' : toast.type === 'error' ? 'bg-red-50 text-red-800' : 'bg-gray-900 text-white'"
      role="status"
      aria-live="polite"
    >
      <span class="mr-3">
        <span v-if="toast.type === 'success'" class="i-lucide-check-circle w-6 h-6 text-green-500"></span>
        <span v-else-if="toast.type === 'error'" class="i-lucide-x-circle w-6 h-6 text-red-500"></span>
        <span v-else class="i-lucide-info w-6 h-6 text-blue-400"></span>
      </span>
      <div>
        <div class="font-semibold">{{ toast.message }}</div>
        <div v-if="toast.description" class="text-sm opacity-80 mt-0.5">{{ toast.description }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSimpleToast } from '~/composables/useSimpleToast'

const { toastState } = useSimpleToast()
const toast = computed(() => toastState.value)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style> 