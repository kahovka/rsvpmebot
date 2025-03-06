export const botMessageTextOptions = JSON.stringify({
	force_reply: true
});

export const botMessageInlineKeyboardOptions = JSON.stringify({
	inline_keyboard: [
		[
			{ text: "I'm in!", callback_data: 0 },
			{ text: 'Pass', callback_data: 1 }
		]
	],
	force_reply: true
});
