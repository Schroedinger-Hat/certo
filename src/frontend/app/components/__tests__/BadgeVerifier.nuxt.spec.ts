// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import BadgeVerifier from '@/components/BadgeVerifier.vue'

describe('badgeVerifier', () => {
  it('renders the verifier title', async () => {
    const wrapper = await mountSuspended(BadgeVerifier)
    expect(wrapper.text()).toContain('Verify Certificate')
  })
})
