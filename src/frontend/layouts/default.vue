<script setup lang="ts">
import Footer from '~/components/Footer.vue'
import Header from '~/components/Header.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#FFE5AE]/20">
    <!-- Navigation -->
    <Header />

    <!-- Main Content -->
    <main class="pt-16 flex-grow flex flex-col mb-32">
      <slot />
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<style>
:root {
  --text-primary: #2D3436;
  --text-secondary: #636E72;
}

body {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--text-primary);
}

.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
