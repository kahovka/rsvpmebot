import { env } from '$env/dynamic/private';
import TelegramBot from 'node-telegram-bot-api';
import { match } from 'ts-pattern';
import { logger } from '$lib/logger';
import { getEvent } from '$lib/server/db/mongo';
import { RSVPEventState } from '$lib/server/db/types';
import {
	registerParticipant,
	registerParticipantPlusOne,
	removeParticipant
} from './callbackQueries.ts';
import {
	createNewEvent,
	setEventDescription,
	setEventName,
	setParticipantLimit,
	setPlusOneOption,
	setWaitlist
} from './messageQueries.ts';
import { BotCallbackQuerySchema, BotTextMessageSchema } from './schemata.ts';

export const bot = new TelegramBot(env.BOT_TOKEN ?? 'no token provided');

// match-all debug
bot.onText(/.*/, (message: TelegramBot.Message) => {
	logger.debug('Received something: {message}', { message });
});

bot.onText(/^\/event.*/, async (raw_message: TelegramBot.Message) => {
	try {
		const message = BotTextMessageSchema.parse(raw_message);
		await createNewEvent(bot, message);
	} catch (e) {
		console.error(e);
	}
});

bot.on('message', async (raw_message: TelegramBot.Message) => {
	try {
		const message = BotTextMessageSchema.parse(raw_message);
		const existingEvent =
			message.reply_to_message &&
			(await getEvent(message.chat.id, message.reply_to_message?.message_id));

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
				async () => await setPlusOneOption(bot, message, existingEvent)
			)
			.with(
				RSVPEventState.PlusOneSet,
				async () => await setParticipantLimit(bot, message, existingEvent)
			)
			.with(
				RSVPEventState.ParticipantLimitSet,
				async () => await setWaitlist(bot, message, existingEvent)
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

bot.on('callback_query', async (raw_query: TelegramBot.CallbackQuery) => {
	try {
		const query = BotCallbackQuerySchema.parse(raw_query);

		const existingEvent = await getEvent(query.message.chat.id, query.message.message_id);

		if (!existingEvent || existingEvent.state !== RSVPEventState.Polling) {
			logger.error(
				'Could not find event or event is not in the polling state: {eventId}, requested by message: {message}',
				{
					message: JSON.stringify(query),
					eventId: existingEvent?._id
				}
			);
			return;
		}

		match(Number(query.data))
			.with(0, async () => await registerParticipant(bot, query, existingEvent))
			.with(1, async () => await registerParticipantPlusOne(bot, query, existingEvent))
			.with(2, async () => await removeParticipant(bot, query, existingEvent));
	} catch (e) {
		console.error(e);
	}
});
