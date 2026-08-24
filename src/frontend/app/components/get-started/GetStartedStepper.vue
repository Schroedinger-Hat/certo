<script setup lang="ts">
defineProps<{
  steps: string[]
}>()
</script>

<template>
  <div class="relative flex flex-col justify-center items-center lg:flex-row">
    <div class="hidden lg:block absolute left-0 right-0 top-8 h-0.5 bg-gray-200 z-0" style="top:44px" />
    <div v-for="(step, index) in steps" :key="step" class="flex-1 flex flex-col items-center z-10">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 flex items-center justify-center rounded-full border-2 border-gray-400 bg-white text-2xl font-bold mb-2">
          {{ index + 1 }}
        </div>
      </div>
      <div class="mt-6 text-center">
        <div class="text-3xl font-bold leading-tight mb-2">
          {{ step }}
        </div>
      </div>
    </div>
  </div>
</template>
