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

const features = [
  {
    title: 'Secure Verification',
    description: 'Verify the authenticity of any credential using our powerful verification engine.',
    icon: 'i-heroicons-shield-check'
  },
  {
    title: 'Badge Issuance',
    description: 'Create and issue badges to recognize achievements, skills and credentials.',
    icon: 'i-heroicons-identification'
  },
  {
    title: 'Credential Management',
    description: 'Manage your digital credentials in one place, with easy export and sharing options.',
    icon: 'i-heroicons-briefcase'
  }
]

const certificateFeatures = [
  'Professionally designed certificates templates',
  'The possibility to design a certificate from scratch',
  'Personalized text, branding, and attributes',
  'Compliant with Open Badges 3.0 standard for verifiable credentials'
]

const badgeStandard = {
  title: 'Open Badges 3.0',
  features: [
    'Verifiable digital credentials',
    'Portable across platforms',
    'Cryptographically secure'
  ]
}

const recipientFeatures = [
  'Create courses, groups, and recipient lists',
  'Upload recipients list via CSV format',
  'Manage and organize recipients efficiently'
]

const exportFeatures = [
  'Send emails with PDF certificates automatically',
  'Export certificates in PNG, JPG and SVG formats',
  'Manage issued certificates'
]
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

    <!-- Features Grid -->
    <div class="relative mb-16">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl" />

      <!-- Content -->
      <div class="relative p-6 md:p-8 lg:p-12">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NCard
            v-for="feature in features"
            :key="feature.title"
            class="group transition-all duration-300 hover:shadow-lg p-4 border border-gray-200 rounded-xl"
          >
            <div class="text-primary mb-4 size-8">
              <div :class="feature.icon" class="size-full" />
            </div>
            <h3 class="text-xl font-bold mb-2">
              {{ feature.title }}
            </h3>
            <p class="text-text-secondary">
              {{ feature.description }}
            </p>
          </NCard>
        </div>
      </div>
    </div>

    <!-- Create & Design Section -->
    <div class="relative mb-16">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl" />

      <!-- Content -->
      <div class="relative grid md:grid-cols-2 gap-8 items-center p-6 md:p-8 lg:p-12">
        <GraduationIllustration />
        <div>
          <!-- CTA Button -->
          <button class="mb-6 px-6 py-2 bg-primary text-white rounded-full text-sm font-medium">
            CREATE CERTIFICATES
          </button>

          <!-- Heading -->
          <h2 class="text-4xl md:text-5xl font-bold mb-8">
            Create & Design
            <br>
            Certificates
          </h2>

          <!-- Feature List -->
          <ul class="space-y-4 mb-8">
            <li v-for="(feature, index) in certificateFeatures" :key="index" class="flex items-start gap-3">
              <div class="text-primary mt-1">
                <div class="i-heroicons-check-circle w-5 h-5" />
              </div>
              <span class="text-lg text-text-secondary">{{ feature }}</span>
            </li>
          </ul>

          <!-- Open Badges Standard Info -->
          <div class="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-primary/20">
            <div class="flex items-center gap-2 mb-3">
              <div class="i-heroicons-shield-check w-5 h-5 text-primary" />
              <h3 class="font-bold text-text-primary">
                {{ badgeStandard.title }}
              </h3>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="(feature, index) in badgeStandard.features" :key="index"
                class="flex items-center gap-2 text-sm text-text-secondary"
              >
                <div class="i-heroicons-check w-4 h-4 text-primary" />
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recipients Section -->
    <div class="relative mt-16 mb-16">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-[#F4F1FF] rounded-3xl" />

      <!-- Content -->
      <div class="relative grid md:grid-cols-2 gap-8 items-center p-6 md:p-8 lg:p-12">
        <div>
          <!-- CTA Button -->
          <span class="inline-flex mb-6 px-6 py-2 bg-[#8B5CF6] text-white rounded-full text-sm font-medium capitalize">
            UPLOAD THE LIST
          </span>

          <!-- Heading -->
          <h2 class="text-4xl md:text-5xl font-bold mb-8">
            Add Recipients
            <br>
            & Lists
          </h2>

          <!-- Feature List -->
          <ul class="space-y-4 mb-8">
            <li v-for="(feature, index) in recipientFeatures" :key="index" class="flex items-start gap-3">
              <div class="text-[#8B5CF6] mt-1">
                <div class="i-heroicons-check-circle w-5 h-5" />
              </div>
              <span class="text-lg text-text-secondary">{{ feature }}</span>
            </li>
          </ul>
        </div>
        <CsvIllustration />
      </div>
    </div>

    <!-- Export & Send Section -->
    <div class="relative mt-16">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-[#E6F7FF] rounded-3xl" />

      <div class="relative grid md:grid-cols-2 gap-8 place-content-between p-6 md:p-8 lg:p-12">
        <PaperPlane />
        <div>
          <span class="inline-flex mb-6 px-6 py-2 bg-[#00B4D8] text-white rounded-full text-sm font-medium uppercase">
            Issue in bulk
          </span>

          <h2 class="text-4xl md:text-5xl font-bold mb-8">
            Export & Send
            <br>
            Issued Certificates
          </h2>

          <ul class="space-y-4">
            <li v-for="(feature, index) in exportFeatures" :key="index" class="flex items-start gap-3">
              <div class="text-[#00B4D8] mt-1">
                <div class="i-heroicons-check-circle w-5 h-5" />
              </div>
              <span class="text-lg text-text-secondary">{{ feature }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
