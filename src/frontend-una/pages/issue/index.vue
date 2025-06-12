<script setup>
import BadgeIssuanceForm from '~/components/BadgeIssuanceForm.vue'

definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'Issue Badge | Certo',
  meta: [
    { name: 'description', content: 'Issue digital badges using the Open Badges 3.0 standard.' }
  ]
})
</script>

<template>
  <main class="flex min-h-screen flex-col py-12 px-6">
    <div class="container mx-auto max-w-6xl">
      <h1 class="text-3xl font-bold mb-8 text-center">Issue Badge</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-10 text-center max-w-2xl mx-auto">
        Issue digital badges to recipients following the Open Badges 3.0 standard.
        Recipients will receive an email with their badge that they can share on
        social media platforms.
      </p>

      <BadgeIssuanceForm />
    </div>
  </main>
</template> 