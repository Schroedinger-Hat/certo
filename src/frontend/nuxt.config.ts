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
    '@nuxt/icon',
    ['nuxt-gtag', {
      id: process.env.NUXT_PUBLIC_GA4_ID || '', // No ID = no analytics sent
      config: {
        anonymize_ip: true,
        send_page_view: true
      },
      debug: false
    }],
    ['@nuxtjs/sitemap', {
      hostname: 'https://certo.schroedinger-hat.org',
      gzip: true,
      trailingSlash: false,
      // Only include public routes. Authenticated dashboards and admin flows
      // should not be presented as indexable content.
      staticRoutes: [
        '/',
        '/about',
        '/get-started',
        '/verify',
        '/privacy-policy',
        '/terms-and-conditions',
      ],
      // Dynamic credential pages fetched from the public verify endpoint
      // Each public credential URL is independently indexable
      routes: async () => {
        try {
          const apiUrl = process.env['NUXT_PUBLIC_API_URL'] || 'http://localhost:1337'
          const res = await fetch(`${apiUrl}/api/credentials?fields[0]=credentialId&pagination[pageSize]=1000`)
          if (!res.ok) return []
          const data = await res.json() as { data?: Array<{ credentialId?: string }> }
          return (data.data ?? [])
            .filter((c) => c.credentialId)
            .map((c) => `/credentials/${encodeURIComponent(c.credentialId!)}`)
        } catch {
          return []
        }
      },
    }],
  ],
  svgo: {
    autoImportPath: './assets/svg/'
  },
  colorMode: {
    preference: 'light',
    fallback: 'light',
  },
  icon: {
    serverBundle: {
      collections: ['heroicons', 'lucide', 'radix-icons', 'simple-icons', 'tabler']
    }
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

        { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
        { rel: 'describedby', type: 'text/plain', href: '/llms.txt' },

        { rel: 'canonical', href: 'https://certo.schroedinger-hat.org' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap'
        },
      ],
      script: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            'name': 'Certo',
            'description': 'Open-source platform for issuing, managing, and verifying digital credentials based on Open Badges 3.0 and W3C Verifiable Credentials.',
            'url': 'https://certo.schroedinger-hat.org',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Linux, macOS, Windows',
            'isAccessibleForFree': true,
            'license': 'https://www.gnu.org/licenses/agpl-3.0.html',
            'codeRepository': 'https://github.com/Schroedinger-Hat/certo',
            'author': {
              '@type': 'Organization',
              'name': 'Schroedinger Hat',
              'url': 'https://github.com/Schroedinger-Hat',
            },
            'featureList': [
              'Digital credential issuance',
              'Open Badges 3.0 verification',
              'W3C Verifiable Credentials',
              'Credential revocation',
              'Self-hosted Docker and Kubernetes deployment',
            ],
          }),
        },
      ],
      htmlAttrs: {
        // lang is updated dynamically per-request in app.vue via useHead()
        lang: 'en'
      }
    }
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL,
    }
  },
  imports: {
    dirs: ['stores', 'constants'],
  },
  css: [
    '~/assets/css/main.css',
  ],
  plugins: [
    '~/plugins/api.ts',
    '~/plugins/auth.ts',
    // The auth-init plugin is client-only and will be auto-imported
    '~/plugins/i18n.client.ts',
  ],
})
