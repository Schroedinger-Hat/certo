/**
 * URL of the Certo website.
 *
 * Defaults to the production URL for convenience but can be overridden
 * via the NUXT_PUBLIC_WEBSITE_URL env var for self-hosted deployments.
 * This powers canonical links, OG images, shareable URLs, and QR codes
 * on certificates.
 *
 * @see docs/known-issues-and-dev-notes.md item 33
 */
export const WEBSITE_URL = import.meta.env?.NUXT_PUBLIC_WEBSITE_URL
  ?? process.env.NUXT_PUBLIC_WEBSITE_URL
  ?? 'https://certo.schroedinger-hat.org'

export const HEADER_NAV_LINKS = [
  { name: 'Home',         href: '/',          i18nKey: 'home' },
  { name: 'About',        href: '/about',      i18nKey: 'about' },
  { name: 'Docs',         href: '/docs',      i18nKey: 'docs' },
  { name: 'Dashboard',    href: '/dashboard',  i18nKey: 'dashboard' },
  { name: 'Issue Badges', href: '/issue',      i18nKey: 'issue' },
  { name: 'Verify',       href: '/verify',     i18nKey: 'verify' },
]
export const HELLO_SH_MAIL = 'mailto:hello@schroedinger-hat.org'
