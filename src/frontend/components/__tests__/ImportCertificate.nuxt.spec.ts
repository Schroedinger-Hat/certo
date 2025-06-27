// @vitest-environment nuxt
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ImportCertificate from '@/components/ImportCertificate.vue'

describe('importCertificate', () => {
  it('renders the import certificate title', async () => {
    const wrapper = await mountSuspended(ImportCertificate)
    expect(wrapper.text()).toContain('Import Certificate') // Adjust to match actual title
  })
})
