import type { DashboardFeatureCard, DashboardSection, DashboardTrustee } from '~/components/dashboard/schemas'

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

  const features: DashboardFeatureCard[] = [
    {
      title: 'Secure Verification',
      description: 'Verify the authenticity of any credential using our powerful verification engine.',
      icon: 'i-heroicons-shield-check'
    },
    {
      title: 'Badge Issuance',
      description: 'Create and issue badges to recognize achievements, skills and credentials.',
      icon: 'i-heroicons-identification'
    },
    {
      title: 'Credential Management',
      description: 'Manage your digital credentials in one place, with easy export and sharing options.',
      icon: 'i-heroicons-briefcase'
    }
  ]

  const trustees: DashboardTrustee[] = [
    {
      url: 'https://strapi.io',
      img: {
        src: '/strapi.png',
        alt: 'Strapi Logo'
      }
    },
    {
      url: 'https://schroedinger-hat.org',
      img: {
        src: '/schroedinger-hat.png',
        alt: 'Schroedinger Hat Logo'
      }
    },
    {
      url: 'https://osday.dev',
      img: {
        src: '/osday.png',
        alt: 'OSDay Logo'
      }
    }
  ]

  return {
    sections,
    features,
    trustees
  }
}
