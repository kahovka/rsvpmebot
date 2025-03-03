import TelegramBot from 'node-telegram-bot-api';
import { match } from 'ts-pattern';
import { eventCollection } from '../db/mongo.ts';
import { EventParticipant, RSVPEvent, RSVPEventState } from '../db/types.ts';
import { logger } from '../logger.ts';
import {
	settingDescriptionState,
	settingNameState,
	settingParticipantLimitState
} from './botStates.ts';

export const getParticipantDisplayName = (participant: EventParticipant) =>
	`${participant.firstName} (${participant.username})`;

export const getEventDescriptionHtml = (event: RSVPEvent) => {
	return (
		event.name +
		'\n' +
		event.description +
		'\n' +
		`Participants limit: ${event.participantLimit}` +
		'\n' +
		'Participants' +
		'\n' +
		event.participantsList
			?.map((participant) => getParticipantDisplayName(participant))
			?.join('\n') +
		'\n' +
		'Waiting list:' +
		'\n' +
		event.waitlingList?.map((participant) => getParticipantDisplayName(participant))?.join('\n')
	);
};

export const getEventNextState = (event: RSVPEvent): RSVPEventState => {
	return match(event.state)
		.with(RSVPEventState.NewEvent, () => settingNameState.nextState)
		.with(RSVPEventState.NameSet, () => settingDescriptionState.nextState)
		.with(RSVPEventState.DescriptionSet, () => settingParticipantLimitState.nextState)
		.otherwise(() => RSVPEventState.NewEvent);
};

export const botActionErrorCallback = (
	error: unknown,
	bot: TelegramBot,
	message: TelegramBot.Message
) => {
	logger.error('Failed ({error}) processing message: {message}', { message, error });
	bot.sendMessage(
		message.chat.id,
		'Something went wrong, please try to response to the previous bot message again or start anew'
	);
};

export const deleteExistingMessagesAndReply = async (
	bot: TelegramBot,
	message: TelegramBot.Message,
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
