import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import zh from './locales/zh';
import ja from './locales/ja';

export const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' }
] as const;

const stored = localStorage.getItem('locale');

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    ja: { translation: ja }
  },
  lng: stored || 'zh',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
