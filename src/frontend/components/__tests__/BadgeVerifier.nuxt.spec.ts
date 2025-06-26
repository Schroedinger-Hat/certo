// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BadgeVerifier from '@/components/BadgeVerifier.vue'
import { describe, it, expect } from 'vitest'

describe('BadgeVerifier', () => {
  it('renders the verifier title', async () => {
    const wrapper = await mountSuspended(BadgeVerifier)
    expect(wrapper.text()).toContain('Verify Certificate')
  })
}) 