// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import BadgeIssuanceForm from '@/components/BadgeIssuanceForm.vue'

describe('badgeIssuanceForm', () => {
  it('renders the form title', async () => {
    const wrapper = await mountSuspended(BadgeIssuanceForm)
    expect(wrapper.text()).toContain('Select Badge')
  })
})
