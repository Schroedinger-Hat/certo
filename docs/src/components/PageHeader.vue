<template>
  <div class="page-header">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string;
  description: string;
}

defineProps<Props>();
</script>

<style scoped>
.page-header h1 {
  font-size: 2.5rem;
  margin: 0 0 1rem 0;
  color: #2D3436;
}

.page-header p {
  font-size: 1.1rem;
  color: #495265;
  margin: 0;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.8rem;
  }
}
</style>
