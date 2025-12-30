<template>
  <button :class="['btn', `btn-${variant}`]">
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary';
}

withDefaults(defineProps<Props>(), {
  variant: 'primary'
});
</script>

<style scoped>
button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-primary {
  background: #5AB69F;
  color: white;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: #FFE5AE;
  color: #2D3436;
}

.btn-secondary:hover {
  opacity: 0.9;
}
</style>
