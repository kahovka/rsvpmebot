import { translate } from '$lib/i18n/translate';
import type { AvailableLocale } from '$lib/i18n/translations';

export const botMessageReplyTextOptions = JSON.stringify({
	force_reply: true
});

export const botMessageReplyYNTextOptions = JSON.stringify({
	force_reply: true,
	input_field_placeholder: '✅'
});

export const ynKeyboardOptions = JSON.stringify({
	one_time_keyboard: true,
	input_field_placeholder: '✅',
	keyboard: [['✅', '❌']],
	force_reply: true,
	resize_keyboard: true
});

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

	return JSON.stringify({
		inline_keyboard: [inlineButtons],
		force_reply: true
	});
};
