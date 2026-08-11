/**
 * Lightweight i18n composable — no @nuxtjs/i18n dependency needed.
 * Reads locale JSON files directly; locale is stored in a Nuxt state ref
 * (SSR-compatible) and persisted in the certo_locale cookie.
 */

// Statically import all locale files so they are bundled with no async load
import en from '../locales/en.json'
import fr from '../locales/fr.json'
import it from '../locales/it.json'
import es from '../locales/es.json'
import de from '../locales/de.json'
import pt from '../locales/pt.json'

type LocaleCode = 'en' | 'fr' | 'it' | 'es' | 'de' | 'pt'

const MESSAGES: Record<LocaleCode, Record<string, any>> = { en, fr, it, es, de, pt }

export const LOCALES = [
  { code: 'en' as LocaleCode, name: 'English' },
  { code: 'fr' as LocaleCode, name: 'Français' },
  { code: 'it' as LocaleCode, name: 'Italiano' },
  { code: 'es' as LocaleCode, name: 'Español' },
  { code: 'de' as LocaleCode, name: 'Deutsch' },
  { code: 'pt' as LocaleCode, name: 'Português' },
]

/** Resolve a dot-separated key path in a nested object */
function resolve(obj: Record<string, any>, key: string): string | undefined {
  const parts = key.split('.')
  let cur: any = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function useI18n() {
  const locale = useState<LocaleCode>('locale', () => 'en')
  const localeCookie = useCookie<LocaleCode>('certo_locale', { maxAge: 60 * 60 * 24 * 365 })

  /** Translate a dot-notation key, with optional `{param}` interpolation */
  function t(key: string, params?: Record<string, string>): string {
    const messages = MESSAGES[locale.value] ?? MESSAGES.en
    let value = resolve(messages, key) ?? resolve(MESSAGES.en, key) ?? key
    if (params) {
      value = value.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`)
    }
    return value
  }

  function setLocale(code: LocaleCode | string) {
    const safe = (code in MESSAGES ? code : 'en') as LocaleCode
    locale.value = safe
    localeCookie.value = safe
  }

  return {
    t,
    locale: readonly(locale),
    locales: readonly(ref(LOCALES)),
    setLocale,
  }
}
