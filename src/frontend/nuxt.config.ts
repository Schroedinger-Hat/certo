// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-06-12',
  devtools: { enabled: true },
  modules: [
    '@una-ui/nuxt',
    '@pinia/nuxt',
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    '@nuxt/test-utils/module',
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
      titleTemplate: '%s | Certo',
      meta: [
        { name: 'description', content: 'Open source platform for digital credentials. Issue, verify, and share certificates using the Open Badges standard.' },
        { name: 'og:site_name', property: 'og:site_name', content: 'Certo' },
        { name: 'og:type', property: 'og:type', content: 'website' },
        { name: 'twitter:card', property: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', property: 'twitter:site', content: '@schroedinger_hat' },
        { name: 'theme-color', property: 'theme-color', content: '#00E5C5' }
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
        },
        { rel: 'icon', type: 'image/png', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: 'https://certo.schroedinger-hat.org' }
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
