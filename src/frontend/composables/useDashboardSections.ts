import type { DashboardSection } from '~/components/dashboard/schemas'

export default () => {
  const certificateSection: DashboardSection = {
    id: 'certificate',
    header: 'Create certificates',
    title: 'Create & Design Certificates',
    features: [
      'Professionally designed certificates templates',
      'The possibility to design a certificate from scratch',
      'Personalized text, branding, and attributes',
      'Compliant with Open Badges 3.0 standard for verifiable credentials'
    ],
    content: {
      title: 'Open Badges 3.0',
      features: [
        'Verifiable digital credentials',
        'Portable across platforms',
        'Cryptographically secure'
      ]
    }
  }

  const recipientSection: DashboardSection = {
    id: 'recipient',
    header: 'Upload the list',
    title: 'Add recipients & create lists',
    features: [
      'Create courses, groups, and recipient lists',
      'Upload recipients list via CSV format',
      'Manage and organize recipients efficiently'
    ]
  }

  const exportSection: DashboardSection = {
    id: 'export',
    header: 'Issue in bulk',
    title: 'Export & send issued certificates',
    features: [
      'Send emails with PDF certificates automatically',
      'Export certificates in PNG, JPG and SVG formats',
      'Manage issued certificates'
    ]
  }

  const sections = [
    certificateSection,
    recipientSection,
    exportSection,
  ]

  return {
    sections
  }
}
