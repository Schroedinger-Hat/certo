<script setup lang="ts">
const pageDescription = ref('Verify your badges with Certo')
const faqs = ref([
  {
    question: 'How does certificate verification work?',
    answer: 'Our verification system checks the certificate\'s digital signature and metadata according to the Open Badges 3.0 standard. This ensures the certificate is authentic, untampered, and issued by a legitimate authority.',
    isOpen: false
  },
  {
    question: 'What types of certificates can I verify?',
    answer: 'You can verify any digital certificate issued through Certo, including Open Badges 3.0 and other compatible verifiable credentials. We support various formats to ensure compatibility with different certification standards.',
    isOpen: false
  },
  {
    question: 'Is the verification process secure?',
    answer: 'Yes, our verification process is completely secure. We use the Open Badges 3.0 standard, which ensures each credential is tamper-evident and verifiable. All data is processed securely and transparently.',
    isOpen: false
  },
  {
    question: 'How long does verification take?',
    answer: 'Verification is instant in most cases. Once you submit a certificate for verification, our system immediately checks its authenticity and validity using the Open Badges 3.0 protocol and provides results within seconds.',
    isOpen: false
  },
  {
    question: 'What information is shown in the verification results?',
    answer: 'Verification results include the certificate\'s status, issuer details, issue date, expiration date (if applicable), and Open Badges 3.0 verification proof. You can also view the full certificate details if available.',
    isOpen: false
  }
])

useSeoMeta({
  description: pageDescription.value,
  ogDescription: pageDescription.value,
  ogUrl: `${WEBSITE_URL}/verify`
})

useHead({
  title: 'Verify your badge',
  link: [
    { rel: 'canonical', href: `${WEBSITE_URL}/verify` }
  ]
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-white to-[#FFE5AE]/20 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-text-primary">
          Verify Certificate
        </h1>
        <p class="mt-2 text-text-secondary">
          Verify the authenticity of any certificate or badge
        </p>
      </div>

      <!-- Main Content -->
      <div class="max-w-3xl mx-auto">
        <BadgeVerifier />
      </div>

      <!-- Features -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-text-primary text-center mb-8">
          Why Verify with Certo?
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
            <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-full flex items-center justify-center mb-4">
              <div class="w-6 h-6 i-heroicons-cube-transparent text-[#5AB69F]" />
            </div>
            <h3 class="text-lg font-medium text-text-primary mb-2">
              Open Badges 3.0
            </h3>
            <p class="text-text-secondary">
              Open Badges 3.0 is a standard for digital credentials. It is a open standard for digital credentials that is not tied to any specific platform or organization.
            </p>
          </div>

          <!-- Instant Results -->
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
            <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-full flex items-center justify-center mb-4">
              <div class="w-6 h-6 i-heroicons-bolt text-[#5AB69F]" />
            </div>
            <h3 class="text-lg font-medium text-text-primary mb-2">
              Instant Results
            </h3>
            <p class="text-text-secondary">
              Get immediate verification results with detailed certificate information
            </p>
          </div>

          <!-- Multiple Formats -->
          <div class="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
            <div class="w-12 h-12 bg-[#00E5C5]/10 rounded-full flex items-center justify-center mb-4">
              <div class="w-6 h-6 i-heroicons-document-duplicate text-[#5AB69F]" />
            </div>
            <h3 class="text-lg font-medium text-text-primary mb-2">
              Multiple Formats
            </h3>
            <p class="text-text-secondary">
              Support for various certificate formats including Open Badges and Verifiable Credentials
            </p>
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="mt-16">
        <h2 class="text-2xl font-bold text-text-primary text-center mb-8">
          Frequently Asked Questions
        </h2>

        <div class="max-w-3xl mx-auto space-y-4">
          <div
            v-for="(faq, index) in faqs"
            :key="index"
            class="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden"
          >
            <button
              class="w-full px-6 py-4 text-left flex items-center justify-between"
              @click="faq.isOpen = !faq.isOpen"
            >
              <span class="font-medium text-text-primary">{{ faq.question }}</span>
              <div
                class="w-5 h-5 transform transition-transform"
                :class="[faq.isOpen ? 'rotate-180' : '']"
              >
                <div class="w-5 h-5 i-heroicons-chevron-down text-[#00E5C5]" />
              </div>
            </button>
            <div
              v-show="faq.isOpen"
              class="px-6 pb-4 text-text-secondary"
            >
              {{ faq.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
