<script setup lang="ts">
const { contributionSections } = useDocsContent()

useSeoMeta({
  title: 'Contributing',
  description: 'Learn the project structure, validation flow, and PR expectations for contributing to Certo.',
})
</script>

<template>
  <section class="max-w-5xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
    <div class="mb-10">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary mb-3">
        Contributing
      </p>
      <h1 class="text-4xl font-bold tracking-tight mb-4">
        Contribute to Certo responsibly
      </h1>
      <p class="text-lg text-text-secondary max-w-3xl">
        Contributions are easiest to review when they stay scoped, are grounded in project docs, and clearly describe the operational impact of the change.
      </p>
    </div>

    <div class="space-y-8 mb-12">
      <div
        v-for="section in contributionSections"
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
        Contribution checklist
      </h2>
      <ol class="space-y-3 text-text-secondary text-lg leading-relaxed list-decimal list-inside">
        <li>Read the root documentation and any relevant architecture or security notes before proposing a change.</li>
        <li>Keep the patch focused on one user journey, bug fix, or feature area.</li>
        <li>Document any configuration or deployment changes that affect operators.</li>
        <li>Validate the relevant frontend or backend checks before requesting review.</li>
        <li>Reference the project issue or roadmap context when the work touches product or security concerns.</li>
      </ol>
    </div>
  </section>
</template>
