import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

import ja from '../locales/ja.json'
import en from '../locales/en.json'

const LANG_KEY = 'APP_LANG'

const resources = {
  ja: { translation: ja },
  en: { translation: en },
}

// カスタム言語検出
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLang = await AsyncStorage.getItem(LANG_KEY)
      if (savedLang) return callback(savedLang)

        const bestLang = (Localization as any).findBestAvailableLanguage(['ja', 'en']);
      callback(bestLang?.languageTag ?? 'ja')
    } catch (e) {
      callback('ja')
    }
  },
  init: () => {},
  cacheUserLanguage: async (lang: string) => {
    await AsyncStorage.setItem(LANG_KEY, lang)
  },
}

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ja',
    resources,
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
