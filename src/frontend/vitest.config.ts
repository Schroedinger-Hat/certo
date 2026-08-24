import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineVitestProject({
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
    include: [
      'app/components/__tests__/**/*.nuxt.spec.ts',
      'app/middleware/__tests__/**/*.spec.ts',
      'app/api/__tests__/**/*.spec.ts',
    ]
  }
})
