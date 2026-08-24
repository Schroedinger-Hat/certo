<script setup lang="ts">
const { architectureSections } = useDocsContent()

useSeoMeta({
  title: 'Architecture',
  description: 'Understand the frontend/backend split, the credential lifecycle, and the standards the platform is designed around.',
})
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
    <div class="mb-10">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-3">
        Architecture
      </p>
      <h1 class="text-4xl font-bold tracking-tight mb-4">
        How Certo is organized
      </h1>
      <p class="text-lg text-text-secondary max-w-3xl">
        Certo combines a Nuxt frontend with a Strapi backend to create a credential platform that focuses on verification, secure issuance, and open standards.
      </p>
    </div>

    <div class="space-y-8 mb-12">
      <div
        v-for="section in architectureSections"
        :key="section.title"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 class="text-2xl font-semibold mb-4">
          {{ section.title }}
        </h2>
        <ul class="space-y-3 text-text-secondary text-lg leading-relaxed">
          <li v-for="item in section.content" :key="item" class="flex gap-3">
            <span class="mt-2 h-2 w-2 rounded-full bg-primary shrink-0" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h2 class="text-2xl font-semibold mb-4">
        High-level flow
      </h2>
      <ol class="space-y-3 text-text-secondary text-lg leading-relaxed list-decimal list-inside">
        <li>Issuers create achievement definitions and issue credentials from the application.</li>
        <li>The backend validates permissions, issues the credential, and records the necessary lifecycle metadata.</li>
        <li>Recipients can view, share, and verify the credential from the frontend.</li>
        <li>Verification checks the credential structure and trust signals against the platform and standards expectations.</li>
      </ol>
    </div>
  </section>
</template>
