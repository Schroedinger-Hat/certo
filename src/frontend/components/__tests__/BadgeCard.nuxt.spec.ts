// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import BadgeCard from '@/components/BadgeCard.vue'

describe('badgeCard', () => {
  it('renders badge card', async () => {
    const wrapper = await mountSuspended(BadgeCard, {
      props: {
        badge: {
          id: 1,
          title: 'Test Badge',
          description: 'A badge for testing',
          issueDate: '2024-01-01',
          recipient: 'Test User',
          issuer: 'Test Issuer',
          status: 'active'
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Badge')
  })
})
