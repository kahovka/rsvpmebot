import { env } from '$env/dynamic/private';
import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern';
import { logger } from '../../../logger.ts';
import { getEvent } from '../db/mongo.ts';
import { RSVPEvent, RSVPEventState } from '../db/types.ts';
import { registerParticipant, removeParticipant } from './callbackQueries.ts';
import { botActionErrorCallback } from './utils.ts';
import {
	createNewEvent,
	setEventDescription,
	setEventName,
	setParticipantLimit
} from './messageQueries.ts';

export const bot = new TelegramBot(env.BOT_TOKEN);

// match-all debug
bot.onText(/.*/, (message: TelegramBot.Message) => {
	logger.debug('Received something: {message}', { message });
});

bot.onText('\/event', async (message: TelegramBot.Message) => {
	await createNewEvent(bot, message);
});

bot.on('message', async (message: TelegramBot.Message) => {
	try {
		const existingEvent: RSVPEvent | undefined =
			message.reply_to_message &&
			(await getEvent(message.chat.id, message.reply_to_message.message_id));

		if (!existingEvent) {
			logger.debug('Could not find event or parse message: {message}', {
				message: JSON.stringify(message)
			});
			return;
		}

		await match(existingEvent.state)
			.with(RSVPEventState.NewEvent, async () => await setEventName(bot, message, existingEvent))
			.with(
				RSVPEventState.NameSet,
				async () => await setEventDescription(bot, message, existingEvent)
			)
			.with(
				RSVPEventState.DescriptionSet,
				async () => await setParticipantLimit(bot, message, existingEvent)
			)
			.otherwise(() =>
				logger.debug('Could not match event: {event} with message {message}', {
					message: JSON.stringify(message),
					eventId: existingEvent?._id
				})
			);
	} catch (e) {
		console.error(e);
	}
});

bot.on('callback_query', async (query: TelegramBot.CallbackQuery) => {
	const existingEvent: RSVPEvent | undefined =
		query.message?.message_id && (await getEvent(query.message.chat.id, query.message.message_id));

	if (!existingEvent) {
		logger.debug('Could not find event or parse message: {message}', {
			message: JSON.stringify(query)
		});
		return;
	}

	try {
		match(Number(query.data))
			.with(0, async () => await registerParticipant(bot, query, existingEvent))
			.with(1, async () => await removeParticipant(bot, query, existingEvent));
	} catch (error) {
		botActionErrorCallback(error, bot, query.message);
	}
});
