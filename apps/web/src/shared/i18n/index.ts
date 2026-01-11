import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './ko-KR.json';
import en from './en-US.json';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: 'ko',
  fallbackLng: 'ko',
  interpolation: {
    escapeValue: false,
  },
});

export { i18n };
