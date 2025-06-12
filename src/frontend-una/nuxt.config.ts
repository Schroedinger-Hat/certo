// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-06-12',
  devtools: { enabled: true },
  modules: [
    '@una-ui/nuxt',
    '@pinia/nuxt',
  ],
  app: {
    head: {
      title: 'Certo - Digital Credential Platform',
      meta: [
        { name: 'description', content: 'Issue, manage, and verify digital credentials and badges using the Open Badges standard' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:1337',
    }
  },
  imports: {
    dirs: ['stores'],
  },
  css: [
    '~/assets/css/main.css',
  ],
  plugins: [
    '~/plugins/api.ts',
    '~/plugins/auth.ts',
    // The auth-init plugin is client-only and will be auto-imported
  ],
})
