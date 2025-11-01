import TelegramBot from 'node-telegram-bot-api';
import { eventCollection, updateEventById } from '../db/mongo.ts';
import { type RSVPEvent, RSVPEventState } from '../db/types.ts';
import {
	newEventState,
	setDescriptionState,
	setNameState,
	setParticipantLimitState,
	setPlusOneState
} from './botStates.ts';
import { botMessageReplyTextOptions, botMessageReplyYNTextOptions } from './misc.ts';
import type { BotTextMessage } from './schemata.ts';
import {
	botActionErrorCallback,
	postEventManageLink,
	sendEventForPolling,
	sendNewEventMessage
} from './utils.ts';
import { logger } from '$lib/logger';
import { ObjectId } from 'mongodb';
import { parseLocale } from '$lib/i18n/translations';

export const createNewEvent = async (bot: TelegramBot, message: BotTextMessage) => {
	await bot
		.sendMessage(
			message.chat.id,
			newEventState.messageToSend(parseLocale(message.from.language_code)),
			{
				reply_markup: botMessageReplyTextOptions,
				...(message.message_thread_id && { message_thread_id: message.message_thread_id })
			}
		)
		.then((replyMessage: TelegramBot.Message) => {
			return eventCollection().insertOne({
				chatId: message.chat.id,
				threadId: message.message_thread_id,
				ownerId: message.from.id,
				lastMessageId: replyMessage.message_id,
				state: RSVPEventState.NewEvent,
				lang: parseLocale(message.from.language_code)
			});
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));

	await bot
		.deleteMessage(message.chat.id, message.message_id)
		.catch((error: unknown) =>
			logger.error('Error while deleting own start command message, {error}', { error })
		);
};

export const setEventName = async (
	bot: TelegramBot,
	eventId: ObjectId,
	message: BotTextMessage
) => {
	await updateEventById(eventId, { name: message.text, state: RSVPEventState.NameSet })
		.then(async (updatedEvent: RSVPEvent) => {
			// allow to fail, do not await
			bot.deleteMessage(message.chat.id, updatedEvent.lastMessageId); // previous text message from the bot
			bot.deleteMessage(message.chat.id, message.message_id); // reply message to it

			await sendNewEventMessage(
				bot,
				message,
				eventId,
				setNameState.messageToSend(updatedEvent.lang),
				botMessageReplyTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setEventDescription = async (
	bot: TelegramBot,
	eventId: ObjectId,
	message: BotTextMessage
) => {
	await updateEventById(eventId, {
		description: message.text,
		state: RSVPEventState.DescriptionSet
	})
		.then(async (updatedEvent: RSVPEvent) => {
			// allow to fail, do not await
			bot.deleteMessage(message.chat.id, updatedEvent.lastMessageId); // previous text message from the bot
			bot.deleteMessage(message.chat.id, message.message_id); // reply message to it

			await sendNewEventMessage(
				bot,
				message,
				eventId,
				setDescriptionState.messageToSend(updatedEvent.lang),
				botMessageReplyYNTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setPlusOneOption = async (
	bot: TelegramBot,
	eventId: ObjectId,
	message: BotTextMessage
) => {
	const allowsPlusOne = message.text.includes('✅') ? true : false;
	await updateEventById(eventId, { allowsPlusOne, state: RSVPEventState.PlusOneSet })
		.then(async (updatedEvent: RSVPEvent) => {
			// allow to fail, do not await
			bot.deleteMessage(message.chat.id, updatedEvent.lastMessageId); // previous text message from the bot
			bot.deleteMessage(message.chat.id, message.message_id); // reply message to it

			await sendNewEventMessage(
				bot,
				message,
				eventId,
				setPlusOneState.messageToSend(updatedEvent.lang),
				botMessageReplyTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setParticipantLimit = async (
	bot: TelegramBot,
	eventId: ObjectId,
	message: BotTextMessage
) => {
	const participantLimit = Number(message.text) || 0;
	await updateEventById(eventId, { participantLimit, state: RSVPEventState.ParticipantLimitSet })
		.then(async (updatedEvent) => {
			if (participantLimit === 0) {
				// do not sent message, we know waitlist is not needed
				await setWaitlist(bot, eventId, { ...message, text: 'no waitlist needed' });
			} else {
				// allow to fail, do not await
				bot.deleteMessage(message.chat.id, updatedEvent.lastMessageId); // previous text message from the bot
				bot.deleteMessage(message.chat.id, message.message_id); // reply message to it

				await sendNewEventMessage(
					bot,
					message,
					eventId,
					setParticipantLimitState.messageToSend(updatedEvent.lang),
					botMessageReplyYNTextOptions
				);
			}
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setWaitlist = async (bot: TelegramBot, eventId: ObjectId, message: BotTextMessage) => {
	const hasWaitlist = message.text.includes('✅') ? true : false;
	await updateEventById(eventId, { hasWaitlist, state: RSVPEventState.Polling })
		.then(async (updatedEvent) => {
			// allow to fail, do not await
			bot.deleteMessage(message.chat.id, updatedEvent.lastMessageId); // previous text message from the bot
			bot.deleteMessage(message.chat.id, message.message_id); // reply message to it

			await postEventManageLink(bot, message, updatedEvent);

			await sendEventForPolling(bot, message, updatedEvent);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};
