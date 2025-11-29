interface TermsSection {
  title: string
  type: 'paragraph' | 'list'
  content: string | string[]
  // optional structured contact email used so callers can render a NuxtLink
  contactEmail?: string
}

interface TermsContent {
  title: string
  lastUpdated: string
  sections: TermsSection[]
}

export function useTermsContent() {
  const termsContent: TermsContent = {
    title: 'Terms and conditions',
    lastUpdated: '2025-06-25',
    sections: [
      {
        title: '1. Acceptance of Terms',
        type: 'paragraph',
        content: 'By accessing or using Certo, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.'
      },
      {
        title: '2. Changes to Terms',
        type: 'paragraph',
        content: 'We may update these Terms from time to time. Continued use of our services after changes constitutes acceptance of the new terms.'
      },
      {
        title: '3. Use of Services',
        type: 'list',
        content: [
          'You must be at least the age of majority in your jurisdiction to use our services.',
          'You agree not to use our services for any unlawful or prohibited purpose.',
          'You are responsible for maintaining the confidentiality of your account information.'
        ]
      },
      {
        title: '4. User Content',
        type: 'paragraph',
        content: 'You retain ownership of content you submit, but grant us a license to use, display, and distribute it as needed to provide our services. You must not post unlawful, offensive, or infringing content.'
      },
      {
        title: '5. Intellectual Property',
        type: 'paragraph',
        content: 'All content and materials provided by Certo are protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without permission.'
      },
      {
        title: '6. Third-Party Links',
        type: 'paragraph',
        content: 'Our services may contain links to third-party sites. We are not responsible for their content or practices.'
      },
      {
        title: '7. Disclaimer of Warranties',
        type: 'paragraph',
        content: 'Our services are provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted or error-free service.'
      },
      {
        title: '8. Limitation of Liability',
        type: 'paragraph',
        content: 'To the fullest extent permitted by law, Certo and its affiliates are not liable for any indirect, incidental, or consequential damages arising from your use of our services.'
      },
      {
        title: '9. Indemnification',
        type: 'paragraph',
        content: 'You agree to indemnify and hold harmless Certo and its affiliates from any claims or damages arising from your violation of these Terms.'
      },
      {
        title: '10. Governing Law',
        type: 'paragraph',
        content: 'These Terms are governed by the laws of Italy. Any disputes will be resolved in the courts of Florence, Italy.'
      },
      {
        title: '11. Contact',
        type: 'paragraph',
        content: 'For questions about these Terms, contact us at dpo@schroedinger-hat.org or Via Pino Arpioni 1, Pelago (FI).',
        contactEmail: 'dpo@schroedinger-hat.org'
      }
    ]
  }

  return {
    termsContent: readonly(termsContent)
  }
}
