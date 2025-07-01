<script setup lang="ts">
import type { DashboardTrustee } from '~/components/dashboard/schemas'

defineProps<{
  trustee: DashboardTrustee
}>()
</script>

<template>
  <NuxtLink :href="trustee.url" target="_blank">
    <NuxtImg :src="trustee.img.src" :alt="trustee.img.alt" class="h-12 w-auto grayscale" />
  </NuxtLink>
</template>
