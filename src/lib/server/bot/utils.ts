import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern';
import { eventCollection } from '../db/mongo.ts';
import { RSVPEventParticipant, RSVPEvent, RSVPEventState } from '../db/types.ts';
import { logger } from '../../../logger.ts';
import {
	settingDescriptionState,
	settingNameState,
	settingParticipantLimitState
} from './botStates.ts';
import { BotTextMessage } from './schemata.ts';

export const getParticipantDisplayName = (participant: RSVPEventParticipant) =>
	`${participant.firstName} (${participant.username ?? ''})`;

export const getEventDescriptionHtml = (event: RSVPEvent) => {
	const allParticipants = event.participantsList
		?.map((participant) => getParticipantDisplayName(participant))
		?.join('\n');
	const allWaiting = event.waitlingList
		?.map((participant) => getParticipantDisplayName(participant))
		?.join('\n');
	return `
		<b>${event.name ?? 'Your event'}</b>
		<b>Description:</b> ${event.description ?? 'Your event description'}
		<b>Number of participants:</b> ${event.participantLimit}
		${event.participantsList && event.participantsList.length > 0 ? '<b>Participants:</b>\n' + allParticipants : ''}
		${event.waitlingList && event.waitlingList.length > 0 ? '<b>Waiting:</b>\n' + allWaiting : ''}
		`;
};

export const getEventNextState = (event: RSVPEvent): RSVPEventState => {
	return match(event.state)
		.with(RSVPEventState.NewEvent, () => settingNameState.nextState)
		.with(RSVPEventState.NameSet, () => settingDescriptionState.nextState)
		.with(RSVPEventState.DescriptionSet, () => settingParticipantLimitState.nextState)
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
	await bot.deleteMessage(message.chat.id, event.lastMessageId);
	await bot.deleteMessage(message.chat.id, message.message_id);

	await sendNewEventMessage(bot, message.chat.id, event, messageToSend, replyMarkup);
};

export const sendNewEventMessage = async (
	bot: TelegramBot,
	chatId: number,
	event: RSVPEvent,
	messageToSend: string,
	replyMarkup: string
) => {
	await bot
		.sendMessage(chatId, messageToSend, {
			...(replyMarkup && { reply_markup: replyMarkup }),
			parse_mode: 'HTML'
		})
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().updateOne(
				{ _id: event._id },
				{
					$set: {
						state: getEventNextState(event),
						lastMessageId: replyMessage.message_id
					}
				},
				{ upsert: true }
			);
		});
};
