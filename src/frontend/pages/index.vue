<script setup lang="ts">
useHead({
  title: 'Certo - Digital Credential Platform',
  meta: [
    { name: 'description', content: 'Open source platform for digital credentials. Issue, verify, and share certificates using the Open Badges standard.' },
    { name: 'og:title', property: 'og:title', content: 'Certo - Digital Credential Platform' },
    { name: 'og:description', property: 'og:description', content: 'Open source platform for digital credentials. Issue, verify, and share certificates using the Open Badges standard.' },
    { name: 'og:image', property: 'og:image', content: 'https://certo.schroedinger-hat.org/og-default.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: 'https://certo.schroedinger-hat.org/og-default.png' },
    { property: 'og:url', content: 'https://certo.schroedinger-hat.org/' }
  ],
  link: [
    { rel: 'canonical', href: 'https://certo.schroedinger-hat.org/' }
  ]
})

const { sections, features } = useDashboardSections()
</script>

<template>
  <!-- Main Content Container -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
    <!-- Hero Section -->
    <div class="max-w-4xl mx-auto text-center mb-16 mt-16">
      <h1 class="text-5xl md:text-7xl font-display font-bold mb-6">
        Design
        <span class="text-primary">certificates</span>
        <br>
        & send to anyone
      </h1>
      <p class="text-text-secondary text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
        Issue, verify and manage digital credentials using the Open Badges standard. Secure, transparent and verifiable
      </p>
      <NuxtLink
        to="/get-started"
        class="inline-flex items-center px-8 py-4 rounded-full bg-secondary text-text-primary hover:bg-opacity-90 transition-all text-lg font-medium"
      >
        Get Started
        <span class="i-heroicons-arrow-right ml-2 w-5 h-5" />
      </NuxtLink>
    </div>

    <!-- Trusted By Section -->
    <div class="text-center mb-8 md:mb-16">
      <h2 class="text-text-secondary text-xl mb-12">
        Trusted by
      </h2>
      <div class="flex justify-center gap-8 items-center opacity-70 md:gap-16 h-auto">
        <a href="https://strapi.io" target="_blank" rel="noopener noreferrer">
          <img src="/strapi.png" alt="Strapi logo" class="h-8 md:h-12 w-auto grayscale">
        </a>
        <a href="https://schroedinger-hat.org" target="_blank" rel="noopener noreferrer">
          <img src="/schroedinger-hat.png" alt="Schroedinger Hat logo" class="h-8 md:h-12 w-auto grayscale">
        </a>
        <a href="https://osday.dev" target="_blank" rel="noopener noreferrer">
          <img src="/osday.png" alt="OSDay logo" class="h-8 md:h-12 w-auto grayscale">
        </a>
      </div>
    </div>

    <div class="relative mb-16">
      <div class="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl" />

      <div class="relative p-6 md:p-8 lg:p-12">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCardFeature
            v-for="feature in features"
            :key="feature.title"
            :feature="feature"
          />
        </div>
      </div>
    </div>

    <div class="space-y-8">
      <DashboardSection
        v-for="(section, sectionIndex) in sections"
        :key="section.id"
        :section="section"
        :reverse="sectionIndex % 2 === 0"
      />
    </div>
  </div>
</template>
