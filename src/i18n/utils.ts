import { en } from './en';
import { ar } from './ar';

export const languages = {
  en: { label: 'English', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
};

export const defaultLang = 'en';

// Map the imported dictionaries
const ui = {
  en,
  ar,
} as const;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as keyof typeof languages;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof languages) {
  return function t(key: keyof typeof en) {
    // Return the translation for the current language, 
    // fallback to English if missing, 
    // or return the raw key if it doesn't exist in either.
    return ui[lang][key] || ui[defaultLang][key] || key;
  }
}