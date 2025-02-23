import TelegramBot from 'npm:node-telegram-bot-api';
import { saveMessage } from './botHistory.ts';
//import 'dotenv/config';

export const bot = new TelegramBot(Deno.env.get('BOT_TOKEN'));

bot.on('message', async (message: TelegramBot.Message) => {
	try {
		await bot.sendMessage(message.chat.id, 'Roger');
		saveMessage({ loggedAt: new Date(), message });
	} catch (e) {
		console.error(e);
	}
});
