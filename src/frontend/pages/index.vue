<script setup lang="ts">
const { t } = useI18n()
const { sections, features, trustees } = useHomeContent()
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
    <div class="max-w-4xl mx-auto text-center mb-16 mt-16">
      <h1 class="text-5xl md:text-7xl font-display font-bold mb-6">
        {{ t('home.heroTitle').split(t('home.heroHighlight'))[0] }}<span class="text-primary">{{ t('home.heroHighlight') }}</span>{{ t('home.heroTitle').split(t('home.heroHighlight'))[1] }}
      </h1>
      <p class="text-text-secondary text-xl md:text-2xl mb-12 max-w-2xl mx-auto">
        {{ t('home.heroSubtitle') }}
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
        <NuxtLink
          to="/get-started"
          class="inline-flex items-center px-8 py-4 rounded-full bg-secondary text-text-primary hover:bg-opacity-90 transition-all text-lg font-medium"
        >
          {{ t('home.heroButton') }}
          <span class="i-heroicons-arrow-right ml-2 w-5 h-5" />
        </NuxtLink>
        <NuxtLink
          to="/docs"
          class="inline-flex items-center px-8 py-4 rounded-full border border-slate-300 bg-white text-text-primary hover:border-primary hover:text-primary transition-all text-lg font-medium"
        >
          Documentation
        </NuxtLink>
      </div>
    </div>

    <div class="text-center mb-8 md:mb-16">
      <h2 class="text-text-secondary text-xl mb-12">
        {{ t('home.trustedBy') }}
      </h2>
      <div class="flex justify-center gap-8 items-center opacity-70 md:gap-16 h-auto">
        <HomeTrustees v-for="trustee in trustees" :key="trustee.url" :trustee="trustee" />
      </div>
    </div>

    <div class="relative mb-16">
      <div class="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl" />
      <div class="relative p-6 md:p-8 lg:p-12">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <HomeCardFeature
            v-for="feature in features"
            :key="feature.title"
            :feature="feature"
          />
        </div>
      </div>
    </div>

    <div class="space-y-8">
      <HomeSection
        v-for="(section, sectionIndex) in sections"
        :key="section.id"
        :section="section"
        :reverse="sectionIndex % 2 === 0"
      />
    </div>
  </div>
</template>
