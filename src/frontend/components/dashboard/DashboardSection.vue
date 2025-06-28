<script setup lang="ts">
import type { DashboardSection } from '~/components/dashboard/schemas.ts'

defineProps<{
  section: DashboardSection
  reverse?: boolean
}>()
</script>

<template>
  <div class="border border-gray-300/40 rounded-xl">
    <div class="relative grid md:grid-cols-2 gap-8 items-center p-6 md:p-8 lg:p-12">
      <div class="grow" :class="{ 'order-last': reverse }">
        <slot />
      </div>
      <div>
        <span class="inline-flex mb-6 px-6 py-2 bg-primary text-white rounded-full text-sm font-medium uppercase">
          {{ section.header }}
        </span>
        <h2 class="text-4xl md:text-5xl font-bold mb-8 text-balance">
          {{ section.title }}
        </h2>
        <ul class="space-y-4 mb-8">
          <li v-for="(feature, index) in section.features" :key="index" class="flex items-start gap-3">
            <div class="text-primary mt-1">
              <div class="i-heroicons-check-circle w-5 h-5" />
            </div>
            <span class="text-lg text-text-secondary">{{ feature }}</span>
          </li>
        </ul>
        <slot v-if="$slots.content" name="content" />
      </div>
    </div>
  </div>
</template>
