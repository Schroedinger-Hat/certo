<script setup lang="ts">
const pageDescription = ref('Get started with Certo, learn how it works')

const { list, title, subtitle, steps, listTitle } = useGetStartedContent()

useSeoMeta({
  description: pageDescription.value,
  ogDescription: pageDescription.value,
  ogUrl: `${WEBSITE_URL}/get-started`
})

useHead({
  title: 'Get started',
  link: [
    { rel: 'canonical', href: `${WEBSITE_URL}/get-started` }
  ]
})
</script>

<template>
  <section class="relative max-w-6xl mx-auto py-16 px-4 overflow-hidden">
    <div class="absolute inset-0 -z-10 bg-gradient-to-br from-[#FFE5AE] via-white to-white" style="opacity:0.7" />
    <GetStartedCloudsIllustration class="hidden md:block" />
    <h1 class="text-5xl font-bold text-center mb-4 tracking-tight">
      {{ title }}
    </h1>
    <p class="text-center text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
      {{ subtitle }}
    </p>
    <GetStartedStepper :steps class="mb-12" />
    <div class="mb-16">
      <h2 class="text-2xl font-semibold mb-6 text-center">
        {{ listTitle }}
      </h2>
      <GetStartedList :list />
    </div>
    <div class="flex justify-center mb-8">
      <NuxtLink :href="HELLO_SH_MAIL" class="inline-flex items-center px-6 py-3 rounded-xl bg-[#FFE5AE] text-gray-900 font-semibold text-lg shadow hover:bg-[#FFD580] transition-colors">
        Contact Us
        <span class="i-heroicons-arrow-right ml-2 w-5 h-5" />
      </NuxtLink>
    </div>
  </section>
</template>
