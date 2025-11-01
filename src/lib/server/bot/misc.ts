import { translate } from '$lib/i18n/translate';
import type { AvailableLocale } from '$lib/i18n/translations';

export const botMessageReplyTextOptions = {
	force_reply: true
};

export const botMessageReplyYNTextOptions = {
	force_reply: true,
	input_field_placeholder: '✅'
};

export const botMessageInlineKeyboardOptions = (
	lang: AvailableLocale,
	allowsPlusOne: boolean = false
) => {
	const inlineButtons = allowsPlusOne
		? [
				{ text: translate('buttons.yes', lang), callback_data: 0 },
				{ text: translate('buttons.plusOne', lang), callback_data: 1 },
				{ text: translate('buttons.no', lang), callback_data: 2 }
			]
		: [
				{ text: translate('buttons.yes', lang), callback_data: 0 },
				{ text: translate('buttons.no', lang), callback_data: 2 }
			];

	return {
		inline_keyboard: [inlineButtons],
		force_reply: true
	};
};
