// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import SimpleToast from '@/components/SimpleToast.vue'

describe('simpleToast', () => {
  it('renders toast message', async () => {
    vi.mock('@/composables/useSimpleToast', () => ({
      useSimpleToast: () => ({
        toastState: {
          value: {
            message: 'Test Toast',
            description: '',
            type: 'success',
            visible: true
          }
        }
      })
    }))
    const wrapper = await mountSuspended(SimpleToast)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Toast')
  })
})
