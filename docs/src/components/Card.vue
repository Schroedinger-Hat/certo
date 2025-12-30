<template>
  <div class="card" :class="className">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: ''
});

const className = computed(() => props.class);
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(90, 182, 159, 0.1);
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(90, 182, 159, 0.1);
}

@media (max-width: 768px) {
  .card {
    padding: 1.5rem;
  }
}
</style>
