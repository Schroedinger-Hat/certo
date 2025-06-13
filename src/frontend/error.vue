<script setup>
defineProps({
  error: Object
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <div class="text-red-500 text-6xl mb-6 i-lucide-alert-triangle mx-auto"></div>
      
      <h1 class="text-4xl font-bold mb-4">Oops! Something went wrong</h1>
      
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ error?.message || 'An unexpected error occurred' }}
      </p>
      
      <div class="flex justify-center gap-4">
        <NButton @click="handleError">
          Back to Home
        </NButton>
      </div>
    </div>
  </div>
</template> 