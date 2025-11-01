import TelegramBot, { type ForceReply, type InlineKeyboardMarkup } from 'node-telegram-bot-api';
import { logger } from '../../logger.ts';
import { translate } from '../../i18n/translate.ts';
import { updateEventById } from '../db/mongo.ts';
import { type RSVPEvent, type RSVPEventParticipant, type RSVPEventWithId } from '../db/types.ts';
import type { BotTextMessage } from './schemata.ts';
import type { ObjectId } from 'mongodb';
import { botMessageInlineKeyboardOptions } from './misc.ts';
import { env } from '$env/dynamic/private';

const ui_address = env.UI_HOST;

export const getParticipantDisplayName = (participant: RSVPEventParticipant) =>
	`${participant.firstName}${participant.username ? ' (@' + participant.username + ')' : ''}`;

export const getEventDescriptionHtml = (event: RSVPEvent) => {
	const allParticipants = event.participantsList
		?.map((participant, ind) => `${ind + 1}. ${getParticipantDisplayName(participant)}`)
		?.join('\n');
	const allWaiting = event.waitlingList
		?.map((participant, ind) => `${ind + 1}. ${getParticipantDisplayName(participant)}`)
		?.join('\n');
	return `
		<b>${event.name ?? 'Your event'}</b>
		${event.description ?? 'Your event description'}
		${event.participantLimit ? '<b>' + translate('event.getDescription.participantLimit', event.lang) + '</b> ' + event.participantLimit + '\n' : ''}
		${event.participantsList && event.participantsList.length > 0 ? '<b>' + translate('event.getDescription.particpants', event.lang) + '</b>\n' + allParticipants : ''}
		${event.waitlingList && event.waitlingList.length > 0 ? '<b>' + translate('event.getDescription.waiting', event.lang) + '</b>\n' + allWaiting : ''}
		`;
};

export const botActionErrorCallback = (
	error: unknown,
	bot: TelegramBot,
	message: BotTextMessage
) => {
	logger.error('Failed ({error}) processing message: {message}', { message, error });
	bot.sendMessage(
		message.chat.id,
		'Something went wrong, please try to response to the previous bot message again or start anew',
		message.message_thread_id ? { message_thread_id: message.message_thread_id } : {}
	);
};

export const sendNewEventMessage = async (
	bot: TelegramBot,
	message: BotTextMessage,
	eventId: ObjectId,
	messageToSend: string,
	replyMarkup: InlineKeyboardMarkup | ForceReply
) => {
	await bot
		.sendMessage(message.chat.id, messageToSend, {
			disable_notification: true,
			...(message.message_thread_id && { message_thread_id: message.message_thread_id }),
			...(replyMarkup && { reply_markup: replyMarkup }),
			parse_mode: 'HTML'
		})
		.then((replyMessage: TelegramBot.Message) => {
			updateEventById(eventId, { lastMessageId: replyMessage.message_id });
		});
};

export const sendEventForPolling = async (
	bot: TelegramBot,
	message: BotTextMessage,
	event: RSVPEventWithId
) =>
	await sendNewEventMessage(
		bot,
		message,
		event._id,
		getEventDescriptionHtml(event),
		botMessageInlineKeyboardOptions(event.lang, event.allowsPlusOne)
	);

export const postEventManageLink = async (
	bot: TelegramBot,
	message: BotTextMessage,
	event: RSVPEventWithId
) => {
	// post link to ui to the chat
	const eventLink = `https://${ui_address}/${event.ownerId}/${event.chatId}/${event._id}`;
	await bot.sendMessage(
		message.chat.id,
		`Link to scrappy ui : [Manage ${event.name}](${eventLink})`,
		{
			parse_mode: 'Markdown',
			...(event.threadId && { message_thread_id: event.threadId })
		}
	);
};
