import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
};

const initI18n = async () => {
  let lang = 'en'; // Default language
  try {
    const storedLang = await AsyncStorage.getItem('userLanguage');
    if (storedLang) {
      lang = storedLang;
    } else if (Localization.locale) {
      lang = Localization.locale.split('-')[0];
    }
  } catch (error) {
    console.error("Failed to load language from AsyncStorage", error);
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: lang,
      fallbackLng: 'en',

      interpolation: {
        escapeValue: false,
      },
      returnObjects: true, // Add this line
      compatibilityJSON: 'v3',
    });
};

initI18n();

export default i18n;