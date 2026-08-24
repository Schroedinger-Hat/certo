<script setup lang="ts">
const { selfHostingSections, environmentVariables } = useDocsContent()

useSeoMeta({
  title: 'Self-hosting',
  description: 'Deploy Certo in production, configure environment variables, and operate it securely in your own environment.',
})
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
    <div class="mb-10">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-3">
        Self-hosting
      </p>
      <h1 class="text-4xl font-bold tracking-tight mb-4">
        Deploy Certo in your own environment
      </h1>
      <p class="text-lg text-text-secondary max-w-3xl">
        The project is designed to be self-hostable. The main production concerns are environment configuration, persistence, secrets handling, and reverse proxy setup.
      </p>
    </div>

    <div class="space-y-8 mb-12">
      <div
        v-for="section in selfHostingSections"
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

    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6 mb-10">
      <h2 class="text-2xl font-semibold mb-4">
        Required environment variables
      </h2>
      <div class="grid gap-6 lg:grid-cols-2">
        <div v-for="example in environmentVariables" :key="example.label" class="rounded-xl border border-slate-200 bg-white p-4">
          <h3 class="font-semibold mb-2">
            {{ example.label }}
          </h3>
          <pre class="overflow-x-auto text-sm text-slate-100 rounded-lg bg-slate-900 p-3"><code>{{ example.code }}</code></pre>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 class="text-2xl font-semibold mb-4">
        Production deployment notes
      </h2>
      <p class="text-text-secondary leading-relaxed">
        For production, prefer a managed secret layer, durable storage for uploads and the database, and reverse proxy termination for TLS. The repository includes Docker Compose and Helm examples, as well as docs for reverse proxy and Kubernetes deployment patterns.
      </p>
    </div>
  </section>
</template>
