<script setup lang="ts">
import { useHead } from '#imports'

useHead({
  title: 'Certo - Digital Credential Platform',
  meta: [
    { name: 'description', content: 'Open source platform for digital credentials. Issue, verify, and share certificates using the Open Badges standard.' },
    { property: 'og:title', content: 'Certo - Digital Credential Platform' },
    { property: 'og:description', content: 'Open source platform for digital credentials. Issue, verify, and share certificates using the Open Badges standard.' },
    { property: 'og:image', content: 'https://certo.schroedinger-hat.org/og-default.png' },
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
    'Blockchain-compatible format',
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
        to="/register" 
        class="inline-flex items-center px-8 py-4 rounded-full bg-secondary text-text-primary hover:bg-opacity-90 transition-all text-lg font-medium"
      >
        Get Started
        <span class="i-heroicons-arrow-right ml-2 w-5 h-5"></span>
      </NuxtLink>
    </div>

    <!-- Trusted By Section -->
    <div class="text-center mb-16">
      <h2 class="text-text-secondary text-xl mb-12">Trusted by</h2>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-60">
        <div class="h-8 w-32">
          <div class="i-simple-icons-slack w-full h-full"></div>
        </div>
        <div class="h-8 w-32">
          <div class="i-simple-icons-netflix w-full h-full"></div>
        </div>
        <div class="h-8 w-32">
          <div class="i-simple-icons-fitbit w-full h-full"></div>
        </div>
        <div class="h-8 w-32">
          <div class="i-simple-icons-google w-full h-full"></div>
        </div>
        <div class="h-8 w-32">
          <div class="i-simple-icons-airbnb w-full h-full"></div>
        </div>
        <div class="h-8 w-32">
          <div class="i-simple-icons-uber w-full h-full"></div>
        </div>
      </div>
    </div>

    <!-- Features Grid -->
    <div class="relative mb-16">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl"></div>
      
      <!-- Content -->
      <div class="relative p-6 md:p-8 lg:p-12">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NCard
            v-for="feature in features"
            :key="feature.title"
            variant="subtle"
            class="group transition-all duration-300 hover:shadow-lg"
          >
            <div class="text-primary mb-4 w-12 h-12">
              <div :class="feature.icon"></div>
            </div>
            <h3 class="text-xl font-bold mb-2">{{ feature.title }}</h3>
            <p class="text-text-secondary">{{ feature.description }}</p>
          </NCard>
        </div>
      </div>
    </div>

    <!-- Create & Design Section -->
    <div class="relative mb-16">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl"></div>
      
      <!-- Content -->
      <div class="relative grid md:grid-cols-2 gap-8 items-center p-6 md:p-8 lg:p-12">
        <div class="relative">
          <!-- Abstract shapes background -->
          <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-background-pink rounded-full blur-3xl"></div>
          
          <!-- Illustration -->
          <div class="relative">
            <svg class="w-full h-auto" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Background circle -->
              <circle cx="250" cy="250" r="200" fill="url(#grad1)" />
              
              <!-- Stylized person -->
              <!-- Graduation cap -->
              <path d="M180 180h140v30l-70-20-70 20v-30z" fill="#2D3436"/>
              <path d="M250 190l60 20v40l-60 20-60-20v-40l60-20z" fill="#2D3436"/>
              <rect x="245" y="230" width="10" height="40" fill="#2D3436"/>
              <circle cx="250" cy="270" r="8" fill="#2D3436"/>
              
              <!-- Face and neck -->
              <path d="M200 240C200 220 220 210 250 210C280 210 300 220 300 240V300C300 320 280 340 250 340C220 340 200 320 200 300V240Z" fill="#00E5C5"/>
              <path d="M220 280C220 280 235 290 250 290C265 290 280 280 280 280" stroke="#2D3436" stroke-width="3" stroke-linecap="round"/>
              
              <!-- Glasses -->
              <path d="M220 260C220 255 225 250 230 250H240C245 250 250 255 250 260C250 265 245 270 240 270H230C225 270 220 265 220 260Z" fill="#2D3436"/>
              <path d="M260 260C260 255 265 250 270 250H280C285 250 290 255 290 260C290 265 285 270 280 270H270C265 270 260 265 260 260Z" fill="#2D3436"/>
              <path d="M250 260H260" stroke="#2D3436" stroke-width="2"/>
              
              <!-- Body/Shirt -->
              <path d="M180 300C180 300 200 400 250 400C300 400 320 300 320 300" fill="#00E5C5"/>
              <path d="M180 300C180 300 200 400 250 400C300 400 320 300 320 300" stroke="#00E5C5" stroke-width="2"/>
              
              <!-- Arms -->
              <path d="M180 320C160 330 150 350 140 380" stroke="#00E5C5" stroke-width="20" stroke-linecap="round"/>
              <path d="M320 320C340 330 350 350 360 380" stroke="#00E5C5" stroke-width="20" stroke-linecap="round"/>
              
              <!-- Certificate/Paper -->
              <rect x="310" y="360" width="60" height="80" transform="rotate(-15 310 360)" fill="white" stroke="#2D3436" stroke-width="2"/>
              <path d="M320 380L360 370M320 400L360 390M320 420L360 410" stroke="#2D3436" stroke-width="2"/>

              <!-- Gradient definition -->
              <defs>
                <radialGradient id="grad1" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stop-color="#00E5C5" stop-opacity="0.2"/>
                  <stop offset="100%" stop-color="#FFE5EC" stop-opacity="0.1"/>
                </radialGradient>
              </defs>
            </svg>
          </div>
        </div>

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
                <div class="i-heroicons-check-circle w-5 h-5"></div>
              </div>
              <span class="text-lg text-text-secondary">{{ feature }}</span>
            </li>
          </ul>

          <!-- Open Badges Standard Info -->
          <div class="p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-primary/20">
            <div class="flex items-center gap-2 mb-3">
              <div class="i-heroicons-shield-check w-5 h-5 text-primary"></div>
              <h3 class="font-bold text-text-primary">{{ badgeStandard.title }}</h3>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div v-for="(feature, index) in badgeStandard.features" :key="index" 
                class="flex items-center gap-2 text-sm text-text-secondary"
              >
                <div class="i-heroicons-check w-4 h-4 text-primary"></div>
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
      <div class="absolute inset-0 bg-[#F4F1FF] rounded-3xl"></div>
      
      <!-- Content -->
      <div class="relative grid md:grid-cols-2 gap-8 items-center p-6 md:p-8 lg:p-12">
        <div>
          <!-- CTA Button -->
          <button class="mb-6 px-6 py-2 bg-[#8B5CF6] text-white rounded-full text-sm font-medium">
            UPLOAD THE LIST
          </button>

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
                <div class="i-heroicons-check-circle w-5 h-5"></div>
              </div>
              <span class="text-lg text-text-secondary">{{ feature }}</span>
            </li>
          </ul>
        </div>

        <div class="relative">
          <!-- Purple circle background -->
          <div class="absolute right-0 top-0 w-4/5 h-4/5 bg-[#8B5CF6] rounded-full opacity-90"></div>
          
          <!-- CSV Illustration -->
          <div class="relative">
            <svg class="w-full h-auto" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Main spreadsheet/CSV file -->
              <rect x="100" y="100" width="300" height="300" rx="16" fill="white" stroke="#2D3436" stroke-width="2"/>
              
              <!-- Header row -->
              <rect x="100" y="100" width="300" height="50" rx="16" fill="#8B5CF6" stroke="#2D3436" stroke-width="2"/>
              
              <!-- Column lines -->
              <line x1="175" y1="100" x2="175" y2="400" stroke="#E2E8F0" stroke-width="2"/>
              <line x1="250" y1="100" x2="250" y2="400" stroke="#E2E8F0" stroke-width="2"/>
              <line x1="325" y1="100" x2="325" y2="400" stroke="#E2E8F0" stroke-width="2"/>
              
              <!-- Row lines -->
              <line x1="100" y1="175" x2="400" y2="175" stroke="#E2E8F0" stroke-width="2"/>
              <line x1="100" y1="250" x2="400" y2="250" stroke="#E2E8F0" stroke-width="2"/>
              <line x1="100" y1="325" x2="400" y2="325" stroke="#E2E8F0" stroke-width="2"/>
              
              <!-- Data rows (simplified representation) -->
              <rect x="110" y="160" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="185" y="160" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="260" y="160" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="335" y="160" width="55" height="8" rx="4" fill="#E2E8F0"/>
              
              <rect x="110" y="235" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="185" y="235" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="260" y="235" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="335" y="235" width="55" height="8" rx="4" fill="#E2E8F0"/>
              
              <rect x="110" y="310" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="185" y="310" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="260" y="310" width="55" height="8" rx="4" fill="#E2E8F0"/>
              <rect x="335" y="310" width="55" height="8" rx="4" fill="#E2E8F0"/>
              
              <!-- Decorative elements -->
              <circle cx="420" cy="80" r="30" fill="#8B5CF6" opacity="0.2"/>
              <circle cx="80" cy="420" r="40" fill="#8B5CF6" opacity="0.2"/>
              
              <!-- CSV icon -->
              <rect x="80" y="60" width="60" height="80" rx="8" fill="#8B5CF6" opacity="0.9"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Export & Send Section -->
    <div class="relative mt-16">
      <!-- Decorative background -->
      <div class="absolute inset-0 bg-[#E6F7FF] rounded-3xl"></div>
      
      <!-- Content -->
      <div class="relative grid md:grid-cols-2 gap-8 items-center p-6 md:p-8 lg:p-12">
        <div>
          <!-- CTA Button -->
          <button class="mb-6 px-6 py-2 bg-[#00B4D8] text-white rounded-full text-sm font-medium">
            ISSUE IN BULK
          </button>

          <!-- Heading -->
          <h2 class="text-4xl md:text-5xl font-bold mb-8">
            Export & Send
            <br>
            Issued Certificates
          </h2>

          <!-- Feature List -->
          <ul class="space-y-4">
            <li v-for="(feature, index) in exportFeatures" :key="index" class="flex items-start gap-3">
              <div class="text-[#00B4D8] mt-1">
                <div class="i-heroicons-check-circle w-5 h-5"></div>
              </div>
              <span class="text-lg text-text-secondary">{{ feature }}</span>
            </li>
          </ul>
        </div>

        <div class="relative">
          <!-- Blue circle background -->
          <div class="absolute right-0 top-0 w-4/5 h-4/5 bg-[#00B4D8] rounded-full opacity-90"></div>
          
          <!-- Paper Plane Illustration -->
          <div class="relative">
            <svg class="w-full h-auto" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <!-- Paper plane -->
              <path d="M100 250L400 100L300 400L250 250L100 250Z" fill="white" stroke="#2D3436" stroke-width="4"/>
              
              <!-- Motion lines -->
              <path d="M420 80C440 60 460 40 480 20" stroke="#00B4D8" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 8"/>
              <path d="M420 100C440 80 460 60 480 40" stroke="#00B4D8" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 8"/>
              <path d="M420 120C440 100 460 80 480 60" stroke="#00B4D8" stroke-width="4" stroke-linecap="round" stroke-dasharray="8 8"/>
              
              <!-- Decorative elements -->
              <circle cx="80" cy="80" r="30" fill="#00B4D8" opacity="0.2"/>
              <circle cx="420" cy="420" r="40" fill="#00B4D8" opacity="0.2"/>
              
              <!-- Email icons -->
              <rect x="120" y="350" width="40" height="30" rx="4" fill="#00B4D8" opacity="0.3"/>
              <rect x="180" y="380" width="40" height="30" rx="4" fill="#00B4D8" opacity="0.3"/>
              <rect x="240" y="350" width="40" height="30" rx="4" fill="#00B4D8" opacity="0.3"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* ... existing styles ... */
</style> 