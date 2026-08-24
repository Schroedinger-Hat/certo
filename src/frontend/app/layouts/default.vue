<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-b from-white to-[#FFE5AE]/20">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:text-text-primary focus:shadow-lg"
    >
      Skip to main content
    </a>

    <!-- Navigation -->
    <Header />

    <!-- Main Content -->
    <main id="main-content" class="pt-16 flex-grow flex flex-col mb-32" tabindex="-1">
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
