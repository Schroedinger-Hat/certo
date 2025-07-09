<script setup lang="ts">
const pageDescription = ref('Open source platform for digital credentials. Issue, verify, and share certificates using the Open Badges standard.')

const pageTitle = ref('Certo - Digital Credential Platform')

useHead({
  title: 'Digital Credential Platform',
  titleTemplate: '%s | Certo',
})

useSeoMeta({
  description: pageDescription.value,
  ogDescription: pageDescription.value,
  ogImage: `${WEBSITE_URL}/og-default.png`,
  ogTitle: pageTitle.value,
  ogUrl: WEBSITE_URL,
  twitterCard: 'summary_large_image',
  twitterImage: `${WEBSITE_URL}/og-default.png`,
})
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
    <SimpleToast />
  </div>
</template>

<style>
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
    Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
