<script setup lang="ts">
const pageDescription = ref('Read everything regarding the Certo privacy and policy')

useSeoMeta({
  description: pageDescription.value,
  ogDescription: pageDescription.value,
})

useHead({
  title: 'Privacy and Policy',
  link: [
    { rel: 'canonical', href: `${WEBSITE_URL}/privacy-policy` }
  ]
})
</script>

<template>
  <div class="min-h-screen py-16">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-4xl font-bold mb-4">
        Privacy Policy
      </h1>
      <p class="text-gray-500 mb-8">
        Last updated: 2025-06-25
      </p>
      <div class="prose prose-lg max-w-none">
        <p>
          This Privacy Policy describes how we collect, use, and disclose your personal information when you use Certo. By accessing or using our services, you agree to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree, please do not use our services.
        </p>
        <h2>1. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the "Last updated" date. Please review this page periodically for changes.
        </p>
        <h2>2. How We Collect and Use Your Personal Information</h2>
        <p>
          We collect personal information to provide and improve our services. This may include information you provide directly (such as your name, email, or contact details), information collected automatically (such as usage data, device and browser information, IP address, and cookies), and information from third parties (such as service providers or analytics partners).
        </p>
        <h2>3. What Personal Information We Collect</h2>
        <ul>
          <li>Contact details (name, email, address, phone number)</li>
          <li>Account and authentication information</li>
          <li>Usage data (device, browser, IP, interactions)</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
        <h2>4. How We Use Your Personal Information</h2>
        <ul>
          <li>To provide and maintain our services</li>
          <li>To communicate with you and provide support</li>
          <li>For marketing and promotional purposes (with your consent)</li>
          <li>For security, fraud prevention, and legal compliance</li>
        </ul>
        <h2>5. Cookies</h2>
        <p>
          We use cookies and similar technologies to enhance your experience, analyze usage, and improve our services. You can control cookies through your browser settings, but disabling cookies may affect your experience.
        </p>
        <h2>6. How We Disclose Personal Information</h2>
        <ul>
          <li>With service providers and partners who help us operate our services</li>
          <li>With your consent or at your direction</li>
          <li>To comply with legal obligations or protect our rights</li>
        </ul>
        <h2>7. User Generated Content</h2>
        <p>
          If you post content publicly on our platform, it may be accessible to others. Please do not share sensitive information in public areas.
        </p>
        <h2>8. Third Party Links</h2>
        <p>
          Our site may contain links to third-party websites. We are not responsible for their privacy practices. Please review their policies before providing information.
        </p>
        <h2>9. Children's Data</h2>
        <p>
          Our services are not intended for children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us for removal.
        </p>
        <h2>10. Security and Retention</h2>
        <p>
          We use reasonable measures to protect your information, but no system is completely secure. We retain personal data as long as necessary for the purposes described or as required by law.
        </p>
        <h2>11. Your Rights</h2>
        <ul>
          <li>Right to access, correct, or delete your personal information</li>
          <li>Right to restrict or object to processing</li>
          <li>Right to data portability</li>
          <li>Right to withdraw consent (where applicable)</li>
        </ul>
        <p>
          To exercise your rights, please contact us using the details below. We may need to verify your identity before responding.
        </p>
        <h2>12. International Users</h2>
        <p>
          Your information may be processed outside your country. We use appropriate safeguards for international transfers as required by law.
        </p>
        <h2>13. Contact</h2>
        <p>
          If you have questions or requests regarding this Privacy Policy, contact us at <a href="mailto:dpo@schroedinger-hat.org">dpo@schroedinger-hat.org</a> or Via Pino Arpioni 1, Pelago (FI).
        </p>
      </div>
    </div>
  </div>
</template>
