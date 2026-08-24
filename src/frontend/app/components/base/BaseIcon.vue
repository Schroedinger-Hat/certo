<script setup lang="ts">
type Collections = 'heroicons' | 'lucide' | 'radix-icons' | 'simple-icons' | 'tabler'

defineProps<{
  collection: Collections
  name: string
}>()
</script>

<template>
  <Icon :name="`${collection}:${name}`" />
</template>
