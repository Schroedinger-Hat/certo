// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import Footer from '@/components/Footer.vue'

describe('footer', () => {
  it('renders footer', async () => {
    const wrapper = await mountSuspended(Footer)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain('footer')
  })
})
