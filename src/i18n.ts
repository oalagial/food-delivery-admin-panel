import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { it } from './locales/it'

const STORAGE_KEY = 'i18nextLng'

function storedLng(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'en' || v === 'it') return v
  } catch {
    /* ignore */
  }
  return 'en'
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    it: { translation: it },
  },
  lng: storedLng(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'it'],
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng)
    if (typeof document !== 'undefined') document.documentElement.lang = lng
  } catch {
    /* ignore */
  }
})

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language
}

export default i18n
