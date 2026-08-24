<script setup lang="ts">
import type { ListContent } from '~/composables/useGetStartedContent'

defineProps<{
  list: ListContent
}>()
</script>

<template>
  <ol class="list-decimal list-inside space-y-6 text-lg text-gray-700 max-w-2xl mx-auto">
    <li v-for="(content, key) in list" :key="key" class="space-y-2">
      <component
        :is="component" v-for="{ component, text }, index in content" :key="text"
        class="block"
        :class="{
          'font-bold !inline': component === 'span' && index === 0,
          'bg-gray-100 px-2 py-1 rounded text-base': component === 'code',
          'text-pretty': component === 'span' && index !== 0,
        }"
      >
        {{ text }}
      </component>
    </li>
  </ol>
</template>
