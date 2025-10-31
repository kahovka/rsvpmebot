import { availableLocales, translations } from '$lib/i18n/translations';
import type { AvailableLocale } from '$lib/i18n/translations';

const DEFAULT_LOCALE: AvailableLocale = 'en';

export const translate = (key: string, locale: AvailableLocale): string => {
	const usedLocale = availableLocales.includes(locale) ? locale : DEFAULT_LOCALE;

	return translations[key]?.[usedLocale] ?? key;
};
