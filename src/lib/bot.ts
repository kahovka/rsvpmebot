import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern';
import { saveMessage } from './botHistory.ts';
//import 'dotenv/config';
import { logger } from '../logger.ts';

export const bot = new TelegramBot(Deno.env.get('BOT_TOKEN'));

bot.on('message', async (message: TelegramBot.Message) => {
	try {
		await match(message.text)
			.with(
				'\/event',
				async () =>
					await createNewEvent(bot, message).then((reply) =>
						logger.debug('Reply: {reply}', { reply })
					)
			)
			.otherwise(
				async () =>
					await logger.debug('Logging not fitting requests: {message}', {
						message: JSON.stringify(message)
					})
			);
		saveMessage({ loggedAt: new Date(), message });
	} catch (e) {
		console.error(e);
	}
});

const createNewEvent = async (bot: TelegramBot, message: TelegramBot.Message) => {
	const options = {
		reply_to_message_id: message.message_id,
		reply_markup: {
			resize_keyboard: true,
			one_time_keyboard: true,
			keyboard: [['Click here!'], ['Click there!']]
		}
	};
	await bot.sendMessage(message.chat.id, 'Let me help to create you a new event', options);
};
