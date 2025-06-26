// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Footer from '@/components/Footer.vue'
import { describe, it, expect } from 'vitest'

describe('Footer', () => {
  it('renders footer', async () => {
    const wrapper = await mountSuspended(Footer)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.html()).toContain('footer')
  })
}) 