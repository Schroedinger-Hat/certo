import { defineVitestConfig } from '@nuxt/test-utils/config'
import { resolve } from 'path'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        mock: {
          intersectionObserver: true,
          indexedDb: true,
        }
      }
    },
    alias: {
      '@': resolve(__dirname),
    },
    include: [
      'components/__tests__/**/*.nuxt.spec.ts',
    ]
  }
}) 