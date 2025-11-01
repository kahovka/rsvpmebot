import TelegramBot from 'node-telegram-bot-api';
import { env } from '$env/dynamic/private';
import { eventCollection, setEventState, updateEventById } from '../db/mongo.ts';
import { type RSVPEvent, RSVPEventState } from '../db/types.ts';
import {
	newEventState,
	setDescriptionState,
	setNameState,
	setParticipantLimitState,
	setPlusOneState
} from './botStates.ts';
import {
	botMessageInlineKeyboardOptions,
	botMessageReplyTextOptions,
	botMessageReplyYNTextOptions,
	ynKeyboardOptions
} from './misc.ts';
import type { BotTextMessage } from './schemata.ts';
import {
	botActionErrorCallback,
	deleteExistingMessagesAndReply,
	getEventDescriptionHtml,
	sendNewEventMessage
} from './utils.ts';
import { logger } from '$lib/logger';
import { ObjectId } from 'mongodb';
import { parseLocale } from '$lib/i18n/translations';

const ui_address = env.UI_HOST;

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
	await updateEventById(eventId, { allowsPlusOne })
		.then(async (updatedEvent: RSVPEvent) => {
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				setPlusOneState.messageToSend(updatedEvent.lang),
				botMessageReplyTextOptions
			);
			await setEventState(eventId, RSVPEventState.PlusOneSet);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setParticipantLimit = async (
	bot: TelegramBot,
	eventId: ObjectId,
	message: BotTextMessage
) => {
	const participantLimit = Number(message.text) || 0;
	await updateEventById(eventId, { participantLimit })
		.then(async (updatedEvent) => {
			if (participantLimit === 0) {
				await setEventState(eventId, RSVPEventState.ParticipantLimitSet);
				// do not sent message, we know waitlist is not needed
				await setWaitlist(bot, { ...message, text: 'no waitlist needed' }, updatedEvent);
			} else {
				await deleteExistingMessagesAndReply(
					bot,
					message,
					updatedEvent,
					setParticipantLimitState.messageToSend(updatedEvent.lang),
					ynKeyboardOptions
				);
				await setEventState(eventId, RSVPEventState.ParticipantLimitSet);
			}
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setWaitlist = async (bot: TelegramBot, message: BotTextMessage, event: RSVPEvent) => {
	const hasWaitlist = message.text.includes('✅') ? true : false;
	event._id &&
		(await updateEventById(event._id, { hasWaitlist })
			.then(async (updatedEvent) => {
				await deleteExistingMessagesAndReply(
					bot,
					message,
					updatedEvent,
					getEventDescriptionHtml(updatedEvent),
					botMessageInlineKeyboardOptions(updatedEvent.lang, event.allowsPlusOne)
				);
				event._id && (await setEventState(event._id, RSVPEventState.Polling));
				// post link to ui to the chat
				const eventLink = `https://${ui_address}/${updatedEvent.ownerId}/${updatedEvent.chatId}/${updatedEvent._id}`;
				await bot.sendMessage(
					message.chat.id,
					`Link to scrappy ui : [Manage ${updatedEvent.name}](${eventLink})`,
					{
						parse_mode: 'markdown',
						...(event.threadId && { message_thread_id: event.threadId })
					}
				);
			})
			.catch((error: unknown) => botActionErrorCallback(error, bot, message)));
};
