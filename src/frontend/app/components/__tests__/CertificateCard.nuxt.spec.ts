// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CertificateCard from '@/components/CertificateCard.vue'

describe('certificateCard', () => {
  it('renders certificate card', async () => {
    const wrapper = await mountSuspended(CertificateCard, {
      props: {
        certificate: {
          id: 1,
          credentialId: 'cred-1',
          achievement: { name: 'Test Achievement' },
          issuedOn: '2024-01-01',
          recipient: { name: 'Test User' },
          issuer: { name: 'Test Issuer' },
          status: 'active'
        }
      }
    })
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Achievement')
  })
})
