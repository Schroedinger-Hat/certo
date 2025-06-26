// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ImportCertificate from '@/components/ImportCertificate.vue'
import { describe, it, expect } from 'vitest'

describe('ImportCertificate', () => {
  it('renders the import certificate title', async () => {
    const wrapper = await mountSuspended(ImportCertificate)
    expect(wrapper.text()).toContain('Import Certificate') // Adjust to match actual title
  })
}) 