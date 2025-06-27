import { resolve } from 'node:path'
import { defineVitestConfig } from '@nuxt/test-utils/config'

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
      'middleware/__tests__/**/*.spec.ts',
      'api/__tests__/**/*.spec.ts',
    ]
  }
})
