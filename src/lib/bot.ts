import { env } from '$env/dynamic/private';
import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern';
import { newEventState, settingDescriptionState, settingNameState } from '../bot/botStates.ts';
import {
	botActionErrorCallback,
	deleteExistingMessagesAndReply,
	getEventDescriptionHtml
} from '../bot/utils.ts';
import { eventCollection, getEvent } from '../db/mongo.ts';
import { RSVPEvent, RSVPEventState } from '../db/types.ts';
import { logger } from '../logger.ts';

export const bot = new TelegramBot(env.BOT_TOKEN);

bot.onText('\/event', async (message: TelegramBot.Message) => {
	await createNewEvent(bot, message);
});

bot.on('message', async (message: TelegramBot.Message) => {
	try {
		const existingEvent: RSVPEvent | undefined =
			message.reply_to_message &&
			(await getEvent(message.chat.id, message.reply_to_message.message_id));

		if (!existingEvent) {
			logger.debug('Could not find event or parse message: {message}', {
				message: JSON.stringify(message)
			});
			return;
		}

		await match(existingEvent.state)
			.with(RSVPEventState.NewEvent, async () => await setEventName(bot, message, existingEvent))
			.with(
				RSVPEventState.NameSet,
				async () => await setEventDescription(bot, message, existingEvent)
			)
			.with(
				RSVPEventState.DescriptionSet,
				async () => await setParticipantLimit(bot, message, existingEvent)
			)
			.otherwise(() =>
				logger.debug('Could not match event: {event} with message {message}', {
					message: JSON.stringify(message),
					eventId: existingEvent?._id
				})
			);
	} catch (e) {
		console.error(e);
	}
});

bot.on('callback_query', (query: TelegramBot.CallbackQuery) => {
	logger.info('Received callback: {query}', { query });
});

const botMessageTextOptions = JSON.stringify({
	force_reply: true
});

const botMessageInlineKeyboardOptions = JSON.stringify({
	inline_keyboard: [
		[
			{ text: 'Yey', callback_data: 'yay' },
			{ text: 'Nay', callback_data: 'nay' }
		]
	],
	force_reply: true
});

const createNewEvent = async (bot: TelegramBot, message: TelegramBot.Message) => {
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, newEventState.messageToSend, {
			reply_markup: botMessageTextOptions
		})
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().insertOne({
				chatId: message.chat.id,
				lastMessageId: replyMessage.message_id,
				state: newEventState.nextState
			});
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

const setEventName = async (bot: TelegramBot, message: TelegramBot.Message, event: RSVPEvent) => {
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: {
					name: message.text
				}
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(message)}`;
			}
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				settingNameState.messageToSend,
				botMessageTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

const setEventDescription = async (
	bot: TelegramBot,
	message: TelegramBot.Message,
	event: RSVPEvent
) => {
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: {
					description: message.text
				}
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(message)}`;
			}
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				settingDescriptionState.messageToSend,
				botMessageTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

const setParticipantLimit = async (
	bot: TelegramBot,
	message: TelegramBot.Message,
	event: RSVPEvent
) => {
	const participantLimit = Number(message.text) || 0;
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: { participantLimit }
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(message)}`;
			}
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				getEventDescriptionHtml(event),
				botMessageInlineKeyboardOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};
