import TelegramBot from 'npm:node-telegram-bot-api';
import { eventCollection } from '../db/mongo.ts';
import { RSVPEvent, RSVPEventState } from '../db/types.ts';
import {
	newEventState,
	setDescriptionState,
	setNameState,
	setParticipantLimitState,
	setPlusOneState
} from './botStates.ts';
import { botMessageInlineKeyboardOptions, botMessageTextOptions } from './misc.ts';
import {
	botActionErrorCallback,
	deleteExistingMessagesAndReply,
	getEventDescriptionHtml,
	setEventState
} from './utils.ts';
import { BotTextMessage } from './schemata.ts';

export const createNewEvent = async (bot: TelegramBot, message: BotTextMessage) => {
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, newEventState.messageToSend(message.from.language_code ?? 'en'), {
			reply_markup: botMessageTextOptions
		})
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().insertOne({
				chatId: message.chat.id,
				ownerId: message.from.id,
				lastMessageId: replyMessage.message_id,
				state: RSVPEventState.NewEvent,
				lang: message.from.language_code ?? 'en'
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
			await setEventState(event, RSVPEventState.NameSet);
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
			await setEventState(event, RSVPEventState.DescriptionSet);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setPlusOneOption = async (
	bot: TelegramBot,
	message: BotTextMessage,
	event: RSVPEvent
) => {
	const allowsPlusOne = message.text ? true : false;
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: {
					allowsPlusOne
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
				setPlusOneState.messageToSend(updatedEvent.lang),
				botMessageTextOptions
			);
			await setEventState(event, RSVPEventState.PlusOneSet);
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
				$set: {
					participantLimit
				}
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(message)}`;
			}

			if (participantLimit === 0) {
				await setEventState(event, RSVPEventState.ParticipantLimitSet);
				// do not sent message, we know waitlist is not needed
				await setWaitlist(bot, { ...message, text: '' }, updatedEvent); // who needs a waiting list if you have unlimited participants?
			} else {
				await deleteExistingMessagesAndReply(
					bot,
					message,
					updatedEvent,
					setParticipantLimitState.messageToSend(updatedEvent.lang),
					botMessageTextOptions
				);
				await setEventState(event, RSVPEventState.ParticipantLimitSet);
			}
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setWaitlist = async (bot: TelegramBot, message: BotTextMessage, event: RSVPEvent) => {
	const hasWaitList = message.text ? true : false;
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: { hasWaitList }
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
				botMessageInlineKeyboardOptions(updatedEvent.lang, event.allowsPlusOne)
			);
			await setEventState(event, RSVPEventState.Polling);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};
