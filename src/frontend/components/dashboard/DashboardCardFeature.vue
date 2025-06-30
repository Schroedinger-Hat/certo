<script setup lang="ts">
import type { DashboardFeatureCard } from './schemas'

defineProps<{
  feature: DashboardFeatureCard
}>()
</script>

<template>
  <NCard
    :key="feature.title"
    class="group transition-all duration-300 hover:shadow-lg p-4 border border-gray-200 rounded-xl"
  >
    <div class="text-primary mb-4 size-8">
      <div :class="feature.icon" class="size-full" />
    </div>
    <h3 class="text-xl font-bold mb-2">
      {{ feature.title }}
    </h3>
    <p class="text-text-secondary">
      {{ feature.description }}
    </p>
  </NCard>
</template>
