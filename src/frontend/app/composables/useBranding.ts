export interface BrandingConfig {
  name: string
  logoUrl: string
  primaryColor: string
}

const DEFAULT_BRANDING: BrandingConfig = {
  name: 'Certo',
  logoUrl: '/certo-logo-text.png',
  primaryColor: '#5AB69F',
}

function validColor(value: string | undefined): string {
  if (!value) {
    return DEFAULT_BRANDING.primaryColor
  }

  return /^#[0-9a-f]{6}$/i.test(value) ? value : DEFAULT_BRANDING.primaryColor
}

export function useBranding(): BrandingConfig {
  const config = useRuntimeConfig()
  const publicConfig = config.public as Record<string, unknown>

  return {
    name: typeof publicConfig.brandName === 'string' && publicConfig.brandName.trim()
      ? publicConfig.brandName.trim()
      : DEFAULT_BRANDING.name,
    logoUrl: typeof publicConfig.brandLogoUrl === 'string' && publicConfig.brandLogoUrl.trim()
      ? publicConfig.brandLogoUrl.trim()
      : DEFAULT_BRANDING.logoUrl,
    primaryColor: validColor(typeof publicConfig.brandPrimaryColor === 'string'
      ? publicConfig.brandPrimaryColor
      : undefined),
  }
}
