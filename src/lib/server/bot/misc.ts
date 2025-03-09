import { translate } from '../../i18n/translate.ts';

export const botMessageTextOptions = JSON.stringify({
	force_reply: true
});

export const ynKeyboardOptions = JSON.stringify({
	one_time_keyboard: true,
	input_field_placeholder: '✅',
	keyboard: [['✅'], ['❌']],
	force_reply: true,
	resize_keyboard: true
});

export const botMessageInlineKeyboardOptions = (lang: string, allowsPlusOne: boolean = false) => {
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
