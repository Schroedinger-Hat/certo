<template>
  <button :class="['px-6 py-3 rounded-3xl font-600 transition-all', 
    variant === 'primary' ? 'bg-primary text-white hover:opacity-90' : 'bg-secondary text-text-primary hover:opacity-90'
  ]">
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