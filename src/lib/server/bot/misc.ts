export const botMessageTextOptions = JSON.stringify({
	force_reply: true
});

export const botMessageInlineKeyboardOptions = JSON.stringify({
	inline_keyboard: [
		[
			{ text: '👍', callback_data: 0 },
			{ text: '➕1️', callback_data: 1 },
			{ text: '❌', callback_data: 2 }
		]
	],
	force_reply: true
});
