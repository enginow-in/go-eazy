import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Custom lightweight backend that uses dynamic import() to lazy load local JSON translation files.
// This splits language bundles into separate chunks in the production build, saving bandwidth.
const resourcesBackend = {
  type: 'backend',
  init(services, backendOptions, i18nextOptions) {},
  read(language, namespace, callback) {
    import(`./locales/${language}.json`)
      .then((resources) => {
        callback(null, resources.default)
      })
      .catch((err) => {
        callback(err, null)
      })
  }
}

i18n
  .use(LanguageDetector)
  .use(resourcesBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false // Prevents initial page-load crashes if layouts are not wrapped in Suspense
    }
  })

export default i18n
