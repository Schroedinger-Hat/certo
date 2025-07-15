<script setup lang="ts">
import { format } from '@formkit/tempo'

const pageDescription = ref('Terms and conditions that apply whenever utilizing Certo')
const { termsContent } = useTermsContent()

useSeoMeta({
  description: pageDescription.value,
  ogDescription: pageDescription.value,
  ogUrl: `${WEBSITE_URL}/terms-and-conditions`
})

useHead({
  title: termsContent.title,
  link: [
    { rel: 'canonical', href: `${WEBSITE_URL}/terms-and-conditions` }
  ]
})

const lastUpdated = format(termsContent.lastUpdated, 'long')
</script>

<template>
  <div class="min-h-screen py-16">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-4xl font-bold mb-4">
        {{ termsContent.title }}
      </h1>
      <p class="text-gray-500 mb-8">
        Last updated: {{ lastUpdated }}
      </p>
      <section class="prose prose-lg max-w-none space-y-4">
        <div v-for="section in termsContent.sections" :key="section.title">
          <h2 class="text-lg font-medium">
            {{ section.title }}
          </h2>
          <p v-if="section.type === 'paragraph'" v-html="section.content" />
          <ul v-else="section.type === 'list'" class="list-disc list-inside">
            <li v-for="item in section.content as string[]" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>
