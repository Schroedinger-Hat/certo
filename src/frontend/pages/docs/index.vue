<script setup lang="ts">
const { overviewCards, quickLinks } = useDocsContent()

useSeoMeta({
  title: 'Documentation',
  description: 'Getting started, self-hosting, architecture, and contribution guidance for Certo.',
})

useHead({
  title: 'Documentation',
  link: [{ rel: 'canonical', href: `${WEBSITE_URL}/docs` }],
})
</script>

<template>
  <section class="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto text-center mb-12">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-4">
        Documentation
      </p>
      <h1 class="text-4xl md:text-5xl font-bold tracking-tight mb-6">
        Everything you need to get started, self-host, and contribute
      </h1>
      <p class="text-lg text-text-secondary">
        Certo’s docs are organized around the main user journeys: onboarding, operations, architecture, and contribution.
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4 mb-12">
      <NuxtLink
        v-for="card in overviewCards"
        :key="card.title"
        :to="card.href"
        class="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary hover:shadow-md"
      >
        <p class="text-sm font-semibold uppercase tracking-[0.16em] text-primary mb-3">
          Guide
        </p>
        <h2 class="text-2xl font-semibold mb-3">
          {{ card.title }}
        </h2>
        <p class="text-text-secondary leading-relaxed">
          {{ card.description }}
        </p>
      </NuxtLink>
    </div>

    <div class="rounded-3xl border border-slate-200 bg-slate-50 p-8 mb-12">
      <h2 class="text-2xl font-semibold mb-6">
        Quick links
      </h2>
      <div class="grid gap-4 md:grid-cols-3">
        <a
          v-for="link in quickLinks"
          :key="link.title"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-primary hover:shadow-sm"
        >
          <h3 class="font-semibold mb-2">
            {{ link.title }}
          </h3>
          <p class="text-sm text-text-secondary leading-relaxed">
            {{ link.description }}
          </p>
        </a>
      </div>
    </div>

    <div class="rounded-3xl border border-slate-200 bg-white p-8">
      <h2 class="text-2xl font-semibold mb-6">
        Recommended reading order
      </h2>
      <ol class="space-y-4 list-decimal list-inside text-text-secondary text-lg leading-relaxed">
        <li>Start with the <NuxtLink to="/docs/getting-started" class="text-primary underline">getting started guide</NuxtLink> to set up the project locally.</li>
        <li>Review the <NuxtLink to="/docs/self-hosting" class="text-primary underline">self-hosting guide</NuxtLink> before production deployment.</li>
        <li>Use the <NuxtLink to="/docs/architecture" class="text-primary underline">architecture overview</NuxtLink> to understand the technical boundaries.</li>
        <li>Check the <NuxtLink to="/docs/contributing" class="text-primary underline">contributing guide</NuxtLink> before opening PRs.</li>
      </ol>
    </div>
  </section>
</template>
