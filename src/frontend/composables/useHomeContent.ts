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
  const { t } = useI18n()

  const certificateSection: Section = {
    id: 'certificate',
    title: t('home.section1Title'),
    header: t('home.section1Header'),
    features: [
      t('home.section1Feature1'),
      t('home.section1Feature2'),
      t('home.section1Feature3'),
      t('home.section1Feature4'),
    ],
    content: {
      title: 'Open Badges 3.0',
      features: [
        'Verifiable digital credentials',
        'Portable across platforms',
        'Cryptographically secure',
      ],
    },
  }

  const recipientSection: Section = {
    id: 'recipient',
    title: t('home.section2Title'),
    header: t('home.section2Header'),
    features: [
      t('home.section2Feature1'),
      t('home.section2Feature2'),
      t('home.section2Feature3'),
    ],
  }

  const exportSection: Section = {
    id: 'export',
    title: t('home.section3Title'),
    header: t('home.section3Header'),
    features: [
      t('home.section3Feature1'),
      t('home.section3Feature2'),
      t('home.section3Feature3'),
    ],
  }

  const sections: Section[] = [
    certificateSection,
    recipientSection,
    exportSection,
  ]

  const features: CardFeature[] = [
    {
      title: t('home.feature1Title'),
      description: t('home.feature1Desc'),
      icon: 'shield-check',
    },
    {
      title: t('home.feature2Title'),
      description: t('home.feature2Desc'),
      icon: 'identification',
    },
    {
      title: t('home.feature3Title'),
      description: t('home.feature3Desc'),
      icon: 'briefcase',
    },
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
