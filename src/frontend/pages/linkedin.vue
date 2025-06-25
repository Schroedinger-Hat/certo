<template>
  <div class="min-h-screen">
    <!-- Header Section -->
    <section class="py-20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-6">How to Add Your Certo Certificate to LinkedIn</h1>
        <p class="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
          Showcase your achievement on LinkedIn by adding your Certo certificate to your profile. Follow these simple steps to make your credential visible to your network and potential employers.
        </p>
      </div>
    </section>

    <!-- Step-by-Step Guide -->
    <section class="py-16 bg-gradient-to-b from-[#FFE5AE]/20 to-white">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <!-- Step 1 -->
        <div class="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Step 1: Go to Your LinkedIn Profile</h2>
            <p class="text-lg text-gray-600 leading-relaxed">
              Log in to your LinkedIn account and navigate to your profile page by clicking on your profile picture or name in the top navigation bar.
            </p>
          </div>
          <div class="flex justify-center">
            <img src="/linkedin-guide/step-1.svg" alt="Go to LinkedIn profile" class="rounded-xl shadow-lg max-w-full w-80" />
          </div>
        </div>
        <!-- Step 2 -->
        <div class="grid md:grid-cols-2 gap-10 items-center">
          <div class="order-2 md:order-1 flex justify-center">
            <img src="/linkedin-guide/step-2.svg" alt="Add profile section" class="rounded-xl shadow-lg max-w-full w-80" />
          </div>
          <div class="order-1 md:order-2">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Step 2: Add a New Certification</h2>
            <p class="text-lg text-gray-600 leading-relaxed">
              Click on <span class="font-semibold">"Add profile section"</span>, then select <span class="font-semibold">"Recommended" &rarr; "Add licenses & certifications"</span>.
            </p>
          </div>
        </div>
        <!-- Step 3 -->
        <div class="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Step 3: Fill in Certificate Details</h2>
            <ul class="list-disc pl-6 text-lg text-gray-600 leading-relaxed space-y-2">
              <li><span class="font-semibold">Name:</span> Enter the name of your certificate (e.g., "Certo Blockchain Credential")</li>
              <li><span class="font-semibold">Issuing Organization:</span> Enter "Certo"</li>
              <li><span class="font-semibold">Issue Date:</span> Enter the date on your certificate</li>
              <li><span class="font-semibold">Credential ID:</span> (Optional) Enter the unique ID from your Certo certificate</li>
              <li><span class="font-semibold">Credential URL:</span> Paste the verification link from Certo</li>
            </ul>
          </div>
          <div class="flex justify-center">
            <img src="/linkedin-guide/step-3.svg" alt="Fill in certificate details" class="rounded-xl shadow-lg max-w-full w-80" />
          </div>
        </div>
        <!-- Step 4 -->
        <div class="grid md:grid-cols-2 gap-10 items-center">
          <div class="order-2 md:order-1 flex justify-center">
            <img src="/linkedin-guide/step-4.svg" alt="Save certification" class="rounded-xl shadow-lg max-w-full w-80" />
          </div>
          <div class="order-1 md:order-2">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Step 4: Save and Showcase</h2>
            <p class="text-lg text-gray-600 leading-relaxed">
              Click <span class="font-semibold">"Save"</span>. Your Certo certificate will now appear in the "Licenses & Certifications" section of your LinkedIn profile. Visitors can click the credential to verify it on Certo.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-gradient-to-b from-white to-[#FFE5AE]/20">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold mb-6">Need Help?</h2>
        <p class="text-xl text-text-secondary max-w-2xl mx-auto mb-8">
          If you have any questions or need assistance, feel free to <a href="mailto:hello@schroedinger-hat.org" class="text-[#00E5C5] underline">contact us</a>.
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'

useHead({
  title: 'LinkedIn Guide | Certo',
  meta: [
    { name: 'description', content: 'Step-by-step guide to adding your Certo certificate to your LinkedIn profile.' },
    { property: 'og:title', content: 'LinkedIn Guide | Certo' },
    { property: 'og:description', content: 'Step-by-step guide to adding your Certo certificate to your LinkedIn profile.' },
    { property: 'og:image', content: 'https://certo.schroedinger-hat.org/og-default.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:image', content: 'https://certo.schroedinger-hat.org/og-default.png' },
    { property: 'og:url', content: 'https://certo.schroedinger-hat.org/linkedin' }
  ],
  link: [
    { rel: 'canonical', href: 'https://certo.schroedinger-hat.org/linkedin' }
  ]
})
// No additional logic needed for this static instructional page
</script> 