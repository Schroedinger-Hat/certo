<script setup lang="ts">
import type { Trustee } from '~/composables/useHomeContent'

defineProps<{
  trustee: Trustee
}>()
</script>

<template>
  <NuxtLink :href="trustee.url" target="_blank">
    <NuxtImg :src="trustee.img.src" :alt="trustee.img.alt" class="h-8 md:h-12 w-auto grayscale" />
  </NuxtLink>
</template>
