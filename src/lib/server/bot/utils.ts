import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern';
import { logger } from '../../../logger.ts';
import { translate } from '../../i18n/translate.ts';
import { updateEventById } from '../db/mongo.ts';
import { type RSVPEvent, type RSVPEventParticipant, RSVPEventState } from '../db/types.ts';
import {
	setDescriptionState,
	setNameState,
	setParticipantLimitState,
	setPlusOneState,
	setWaitlist
} from './botStates.ts';
import type { BotTextMessage } from './schemata.ts';

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

export const getEventNextState = (event: RSVPEvent): RSVPEventState => {
	return match(event.state)
		.with(RSVPEventState.NewEvent, () => setNameState.nextState)
		.with(RSVPEventState.NameSet, () => setDescriptionState.nextState)
		.with(RSVPEventState.DescriptionSet, () => setPlusOneState.nextState)
		.with(RSVPEventState.PlusOneSet, () => setParticipantLimitState.nextState)
		.with(RSVPEventState.ParticipantLimitSet, () => setWaitlist.nextState)
		.with(RSVPEventState.Polling, () => RSVPEventState.Polling)
		.otherwise(() => RSVPEventState.NewEvent);
};

export const botActionErrorCallback = (
	error: unknown,
	bot: TelegramBot,
	message: BotTextMessage
) => {
	logger.error('Failed ({error}) processing message: {message}', { message, error });
	bot.sendMessage(
		message.chat.id,
		'Something went wrong, please try to response to the previous bot message again or start anew'
	);
};

export const deleteExistingMessagesAndReply = async (
	bot: TelegramBot,
	message: BotTextMessage,
	event: RSVPEvent,
	messageToSend: string,
	replyMarkup: string
) => {
	try {
		await bot.deleteMessage(message.chat.id, event.lastMessageId);
		await bot.deleteMessage(message.chat.id, message.message_id);
	} catch (error) {
		logger.debug('Could not delete last messages: {eventId} {messageId} ', {
			eventId: event._id,
			messageId: message.chat.id
		});
	}

	await sendNewEventMessage(bot, message, event, messageToSend, replyMarkup);
};

export const sendNewEventMessage = async (
	bot: TelegramBot,
	message: BotTextMessage,
	event: RSVPEvent,
	messageToSend: string,
	replyMarkup: string
) => {
	await bot
		.sendMessage(message.chat.id, messageToSend, {
			...(message.message_thread_id && { message_thread_id: message.message_thread_id }),
			...(replyMarkup && { reply_markup: replyMarkup }),
			parse_mode: 'HTML'
		})
		.then((replyMessage: TelegramBot.Message) => {
			updateEventById(event._id, { lastMessageId: replyMessage.message_id });
		});
};
