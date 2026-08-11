/**
 * i18n client plugin — runs on first page load in the browser.
 * Reads the certo_locale cookie; if not set, detects the browser language
 * and sets the closest supported locale.
 */
import { LOCALES } from '~/composables/useI18n'

export default defineNuxtPlugin(() => {
  const { locale, setLocale } = useI18n()

  // Already have a saved preference
  const cookie = useCookie('certo_locale')
  if (cookie.value) return

  // Detect from navigator.languages
  const preferred = navigator.languages ?? [navigator.language ?? 'en']
  const supportedCodes = LOCALES.map(l => l.code)

  for (const lang of preferred) {
    const code = lang.slice(0, 2).toLowerCase()
    if (supportedCodes.includes(code as any)) {
      setLocale(code)
      return
    }
  }
})
