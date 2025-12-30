<template>
  <h2 class="section-title">{{ title }}</h2>
</template>

<script setup lang="ts">
interface Props {
  title: string;
}

defineProps<Props>();
</script>

<style scoped>
.section-title {
  font-size: 1.8rem;
  color: #2D3436;
  margin-bottom: 2rem;
  font-weight: 700;
}
</style>
