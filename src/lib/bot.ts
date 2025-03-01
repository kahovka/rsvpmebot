import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern';
import { logger } from '../logger.ts';
import { eventCollection } from '../db/mongo.ts';
import { BotStates } from '../types/bot.ts';

export const bot = new TelegramBot(Deno.env.get('BOT_TOKEN') ?? 'tokenismissing');

const newEventState: BotState = {
	state: BotStates.NewEvent,
	nextState: BotStates.SetName,
	messageToSend: 'What is your event called?',
	matcher: (msg: TelegramBot.Message) => msg.text && msg.text.includes('\/event')
};

interface BotState {
	state: BotStates;
	nextState: BotStates;
	messageToSend: string | undefined;
	matcher: (message: TelegramBot.Message) => boolean;
}

bot.on('message', async (message: TelegramBot.Message) => {
	try {
		await match(message)
			.when(newEventState.matcher, async () => await createNewEvent(bot, message))
			.otherwise(() =>
				logger.debug('Logging not fitting requests: {message}', {
					message: JSON.stringify(message)
				})
			);
	} catch (e) {
		console.error(e);
	}
});

const createNewEvent = async (bot: TelegramBot, message: TelegramBot.Message) => {
	//create new event here, log last message id as the event
	const options = {
		reply_markup: {
			force_reply: true
		}
	};
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, newEventState.messageToSend, options)
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().insertOne({
				lastMessageId: replyMessage.message_id,
				state: BotStates.SetName
			});
		});
};
