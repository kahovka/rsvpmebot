import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern@^5.6.2';
import { eventCollection } from '../db/mongo.ts';
import { RSVPEvent, RSVPEventState } from '../db/types.ts';
import { logger } from '../logger.ts';
import {
	settingDescriptionState,
	settingNameState,
	settingParticipantLimitState
} from './botStates.ts';

export const getEventDescriptionHtml = (event: RSVPEvent) => {
	return event.name + '\n' + event.description + '\n' + `Participants: ${event.participantLimit}`;
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

	await bot
		.sendMessage(message.chat.id, messageToSend, {
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
