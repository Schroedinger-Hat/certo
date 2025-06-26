// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BadgeIssuanceForm from '@/components/BadgeIssuanceForm.vue'
import { describe, it, expect } from 'vitest'

describe('BadgeIssuanceForm', () => {
  it('renders the form title', async () => {
    const wrapper = await mountSuspended(BadgeIssuanceForm)
    expect(wrapper.text()).toContain('Select Badge')
  })
}) 