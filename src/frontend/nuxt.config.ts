// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-06-12',
  devtools: { enabled: true },
  modules: [
    '@una-ui/nuxt',
    '@pinia/nuxt',
    '@unocss/nuxt',
    '@nuxtjs/color-mode'
  ],
  unocss: {
    // UnoCSS configuration
    preflight: true,
    icons: {
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    },
    safelist: [
      // Simple Icons for sponsors
      'i-simple-icons-slack',
      'i-simple-icons-netflix',
      'i-simple-icons-fitbit',
      'i-simple-icons-google',
      'i-simple-icons-airbnb',
      'i-simple-icons-uber',
    ]
  },
  app: {
    head: {
      title: 'Certo - Digital Credential Platform',
      meta: [
        { name: 'description', content: 'Issue, manage, and verify digital credentials and badges using the Open Badges standard' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
        }
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
