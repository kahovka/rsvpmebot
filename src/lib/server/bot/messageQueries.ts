import TelegramBot from 'npm:node-telegram-bot-api';
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
	botMessageTextOptions,
	ynKeyboardOptions
} from './misc.ts';
import type { BotTextMessage } from './schemata.ts';
import {
	botActionErrorCallback,
	deleteExistingMessagesAndReply,
	getEventDescriptionHtml
} from './utils.ts';

export const createNewEvent = async (bot: TelegramBot, message: BotTextMessage) => {
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, newEventState.messageToSend(message.from.language_code ?? 'en'), {
			reply_markup: botMessageTextOptions
		})
		.then((replyMessage: TelegramBot.Message) => {
			return eventCollection().insertOne({
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
	await updateEventById(event._id, { name: message.text })
		.then(async (updatedEvent: RSVPEvent) => {
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
	await updateEventById(event._id, { description: message.text })
		.then(async (updatedEvent: RSVPEvent) => {
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				setDescriptionState.messageToSend(updatedEvent.lang),
				ynKeyboardOptions
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
	const allowsPlusOne = message.text.includes('✅') ? true : false;
	await updateEventById(event._id, { allowsPlusOne })
		.then(async (updatedEvent: RSVPEvent) => {
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
	await updateEventById(event._id, { participantLimit })
		.then(async (updatedEvent) => {
			if (participantLimit === 0) {
				await setEventState(event, RSVPEventState.ParticipantLimitSet);
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
				await setEventState(event, RSVPEventState.ParticipantLimitSet);
			}
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

export const setWaitlist = async (bot: TelegramBot, message: BotTextMessage, event: RSVPEvent) => {
	const hasWaitlist = message.text.includes('✅') ? true : false;
	await updateEventById(event._id, { hasWaitlist })
		.then(async (updatedEvent) => {
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				getEventDescriptionHtml(updatedEvent),
				botMessageInlineKeyboardOptions(updatedEvent.lang, event.allowsPlusOne)
			);
			await setEventState(event, RSVPEventState.Polling);
			// post link to ui to the chat
			const eventLink = `https://rsvpmebot-42.deno.dev/${updatedEvent.ownerId}/${updatedEvent.chatId}/${updatedEvent._id}`;
			await bot.sendMessage(
				message.chat.id,
				`Link to scrappy ui : [Manage ${updatedEvent.name}](${eventLink})`,
				{
					parse_mode: 'markdown'
				}
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};
