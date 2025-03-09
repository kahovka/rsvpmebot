import TelegramBot from 'npm:node-telegram-bot-api';
import { eventCollection } from '../db/mongo.ts';
import { RSVPEvent } from '../db/types.ts';
import { newEventState, setDescriptionState, setNameState } from './botStates.ts';
import { botMessageInlineKeyboardOptions, botMessageTextOptions } from './misc.ts';
import {
	botActionErrorCallback,
	deleteExistingMessagesAndReply,
	getEventDescriptionHtml
} from './utils.ts';
import { BotTextMessage } from './schemata.ts';

export const createNewEvent = async (bot: TelegramBot, message: BotTextMessage) => {
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, newEventState.messageToSend(message.from.language_code), {
			reply_markup: botMessageTextOptions
		})
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().insertOne({
				chatId: message.chat.id,
				ownerId: message.from.id,
				lastMessageId: replyMessage.message_id,
				state: newEventState.nextState,
				lang: message.from.language_code
			});
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setEventName = async (bot: TelegramBot, message: BotTextMessage, event: RSVPEvent) => {
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
				setNameState.messageToSend(updatedEvent.lang),
				botMessageTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setEventDescription = async (
	bot: TelegramBot,
	message: BotTextMessage,
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
				setDescriptionState.messageToSend(updatedEvent.lang),
				botMessageTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setParticipantLimit = async (
	bot: TelegramBot,
	message: BotTextMessage,
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
				getEventDescriptionHtml(updatedEvent),
				botMessageInlineKeyboardOptions(updatedEvent.lang)
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};
