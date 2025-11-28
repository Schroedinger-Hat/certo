export interface Section {
  features: string[]
  header: string
  id: 'certificate' | 'recipient' | 'export'
  title: string
  content?: {
    title: string
    features: string[]
  }
}

export interface Trustee {
  url: string
  img: {
    src: string
    alt: string
  }
}

export interface HeaderLogo {
  img: {
    src: string
    alt: string
  }
}

export interface CardFeature {
  description: string
  icon: string
  title: string
}

export default () => {
  const certificateSection: Section = {
    id: 'certificate',
    title: 'Create certificates',
    header: 'Create & Design Certificates',
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

  const recipientSection: Section = {
    id: 'recipient',
    title: 'Upload the list',
    header: 'Add recipients & create lists',
    features: [
      'Create courses, groups, and recipient lists',
      'Upload recipients list via CSV format',
      'Manage and organize recipients efficiently'
    ]
  }

  const exportSection: Section = {
    id: 'export',
    title: 'Issue in bulk',
    header: 'Export & send issued certificates',
    features: [
      'Send emails with PDF certificates automatically',
      'Export certificates in PNG, JPG and SVG formats',
      'Manage issued certificates'
    ]
  }

  const sections: Section[] = [
    certificateSection,
    recipientSection,
    exportSection,
  ]

  const features: CardFeature[] = [
    {
      title: 'Secure Verification',
      description: 'Verify the authenticity of any credential using our powerful verification engine.',
      icon: 'shield-check'
    },
    {
      title: 'Badge Issuance',
      description: 'Create and issue badges to recognize achievements, skills and credentials.',
      icon: 'identification'
    },
    {
      title: 'Credential Management',
      description: 'Manage your digital credentials in one place, with easy export and sharing options.',
      icon: 'briefcase'
    }
  ]

  const trustees: Trustee[] = [
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
        alt: 'Schrödinger Hat Logo'
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

  const headerLogo: HeaderLogo = {
    img: {
      src: '/certo-logo-text.png',
      alt: 'Certo Logo'
    }
  }

  return {
    features,
    sections,
    trustees,
    headerLogo
  }
}
