<script setup lang="ts">
const { gettingStartedSections } = useDocsContent()

useSeoMeta({
  title: 'Getting started',
  description: 'Set up Certo locally, run the frontend and backend, and get the platform ready for issuing credentials.',
})
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
    <div class="mb-10">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-3">
        Get started
      </p>
      <h1 class="text-4xl font-bold tracking-tight mb-4">
        Set up Certo locally
      </h1>
      <p class="text-lg text-text-secondary max-w-3xl">
        Certo is a Strapi backend + Nuxt frontend stack. The local development flow is straightforward: install dependencies, configure environment variables, start the backend, then start the frontend.
      </p>
    </div>

    <div class="space-y-8 mb-12">
      <div
        v-for="(section, index) in gettingStartedSections"
        :key="section.title"
        class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <p class="text-sm font-semibold uppercase tracking-[0.18em] text-primary mb-3">
          Step {{ index + 1 }}
        </p>
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

    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 mb-10">
      <h2 class="text-2xl font-semibold mb-4">
        Example setup commands
      </h2>
      <pre class="overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-slate-100"><code>cd certo
cd src/frontend && npm install
cd ../backend && npm install

# Start backend
cd ../backend && npm run develop

# Start frontend in another terminal
cd ../frontend && npm run dev</code></pre>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 class="text-2xl font-semibold mb-4">
        Default app behavior
      </h2>
      <p class="text-text-secondary leading-relaxed">
        On first run, the development backend seeds sample data for testing, including the default admin account and example certificate content. The project docs describe the default login credentials and expected sample data in more detail, which is useful before you start issuing credential workflows.
      </p>
    </div>
  </section>
</template>
