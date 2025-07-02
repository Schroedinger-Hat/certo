// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-06-12',
  devtools: { enabled: true },
  modules: [
    '@nuxt/test-utils/module',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@una-ui/nuxt',
    '@unocss/nuxt',
    'nuxt-svgo',
    '@nuxt/image',
    ['nuxt-gtag', {
      id: 'G-FLSJZHYM3M', // TODO: Replace with your real GA4 ID
      config: {
        anonymize_ip: true,
        send_page_view: true
      },
      debug: false
    }],
    ['@nuxtjs/sitemap', {
      hostname: 'https://certo.schroedinger-hat.org',
      gzip: true,
      trailingSlash: true
    }],
  ],
  svgo: {
    autoImportPath: './assets/svg/'
  },
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
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
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: 'https://certo.schroedinger-hat.org' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
        },

      ]
    }
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL,
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
