import { en } from './en';
import { ar } from './ar';

export const languages = {
  en: 'English',
  ar: 'العربية',
};

export const defaultLang = 'en';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in languages) return lang as keyof typeof languages;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof languages) {
  return function t(key: keyof typeof en | string) {
    const keys = key.split('.');
    let result: any = lang === 'ar' ? ar : en;
    for (const k of keys) {
      if (result[k] === undefined) return key;
      result = result[k];
    }
    return result;
  }
}