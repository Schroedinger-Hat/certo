<script setup lang="ts">
import type { ConcreteComponent } from 'vue'
import type { DashboardSection } from '~/components/dashboard/schemas.ts'

defineProps<{
  section: DashboardSection
  reverse?: boolean
}>()

const illustrations: Record<DashboardSection['id'], ConcreteComponent | string> = {
  certificate: resolveComponent('DashboardGraduationIllustration'),
  recipient: resolveComponent('DashboardCsvIllustration'),
  export: resolveComponent('DashboardPlaneIllustration')
}

const sectionStyle: Record<DashboardSection['id'], string> = {
  certificate: 'bg-white',
  export: 'bg-[#E6F7FF]',
  recipient: 'bg-[#F4F1FF]'
}

const titleStyle: Record<DashboardSection['id'], string> = {
  certificate: 'bg-primary',
  export: 'bg-[#00B4D8]',
  recipient: 'bg-[#8B5CF6]'
}
</script>

<template>
  <div class="rounded-xl border border-gray-300/20" :class="sectionStyle[section.id]">
    <div class="relative grid md:grid-cols-2 gap-8 items-center p-6 md:p-8 lg:p-12">
      <div class="grow" :class="{ 'order-last': reverse }">
        <component :is="illustrations[section.id]" />
      </div>
      <div>
        <span class="inline-flex mb-6 px-6 py-2 text-white rounded-full text-sm font-medium uppercase" :class="titleStyle[section.id]">
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
        <div v-if="section.content" class="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-primary/20">
          <div class="flex items-center gap-2 mb-3">
            <div class="i-heroicons-shield-check w-5 h-5 text-primary" />
            <h3 class="font-bold text-text-primary">
              {{ section.content.title }}
            </h3>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(feature, index) in section.content.features" :key="index"
              class="flex items-center gap-2 text-sm text-text-secondary"
            >
              <div class="i-heroicons-check w-4 h-4 text-primary" />
              <span>{{ feature }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
