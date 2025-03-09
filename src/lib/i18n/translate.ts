import { AvailableLocales, availableLocales, translations } from './translations.ts';

const DEFAULT_LOCALE: AvailableLocales = 'en';

export const translate = (key: string, locale: string): string => {
	const usedLocale = availableLocales.includes(locale) ? locale : DEFAULT_LOCALE;

	return translations[key]?.[usedLocale] ?? key;
};
