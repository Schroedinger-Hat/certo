<script setup lang="ts">
import type { ConcreteComponent } from 'vue'
import type { Section } from '~/composables/useHomeContent'

defineProps<{
  section: Section
  reverse?: boolean
}>()

const illustrations: Record<Section['id'], ConcreteComponent | string> = {
  certificate: resolveComponent('HomeGraduationIllustration'),
  recipient: resolveComponent('HomeCsvIllustration'),
  export: resolveComponent('HomePlaneIllustration')
}

const sectionStyle: Record<Section['id'], string> = {
  certificate: 'bg-white',
  export: 'bg-[#E6F7FF]',
  recipient: 'bg-[#F4F1FF]'
}

const titleStyle: Record<Section['id'], string> = {
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
          {{ section.title }}
        </span>
        <h2 class="text-4xl md:text-5xl font-bold mb-8 text-balance">
          {{ section.header }}
        </h2>
        <ul class="space-y-4 mb-8">
          <li v-for="(feature, index) in section.features" :key="index" class="flex items-start gap-3">
            <BaseIcon name="check-circle" collection="heroicons" class="size-5 mt-1" :class="titleStyle[section.id]" />
            <span class="text-lg text-text-secondary">{{ feature }}</span>
          </li>
        </ul>
        <div v-if="section.content" class="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-primary/20">
          <div class="flex items-center gap-2 mb-3">
            <BaseIcon name="shield-check" collection="heroicons" class="size-5" :class="titleStyle[section.id]" />
            <h3 class="font-bold text-text-primary">
              {{ section.content.title }}
            </h3>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="(feature, index) in section.content.features" :key="index"
              class="flex items-center gap-2 text-sm text-text-secondary"
            >
              <BaseIcon name="check" collection="heroicons" class="size-4" :class="titleStyle[section.id]" />
              <span>{{ feature }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
