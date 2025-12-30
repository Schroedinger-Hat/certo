<template>
  <div :class="['info-box', `info-${type}`]">
    <strong>{{ title }}</strong>
    <p><slot /></p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type: 'tip' | 'warning' | 'info';
  title: string;
}

defineProps<Props>();
</script>

<style scoped>
.info-box {
  padding: 1.5rem;
  border-radius: 12px;
  margin: 2rem 0;
  border-left: 4px solid;
}

.info-tip {
  background: rgba(90, 182, 159, 0.1);
  border-left-color: #5AB69F;
}

.info-warning {
  background: rgba(255, 185, 0, 0.1);
  border-left-color: #FFB900;
}

.info-info {
  background: rgba(90, 182, 159, 0.1);
  border-left-color: #5AB69F;
}

.info-box strong {
  display: block;
  margin-bottom: 0.5rem;
}
</style>
