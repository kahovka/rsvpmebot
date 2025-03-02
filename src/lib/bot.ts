import { env } from '$env/dynamic/private';
import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern';
import { newEventState, settingDescriptionState, settingNameState } from '../bot/botStates.ts';
import {
	botActionErrorCallback,
	deleteExistingMessagesAndReply,
	getEventDescriptionHtml,
	getParticipantDisplayName,
	sendNewEventMessage
} from '../bot/utils.ts';
import { eventCollection, getEvent } from '../db/mongo.ts';
import { EventParticipant, RSVPEvent, RSVPEventState } from '../db/types.ts';
import { logger } from '../logger.ts';

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
			.with(0, async () => await registerParticipant(query, existingEvent))
			.with(1, async () => await removeParticipant(query, existingEvent));
	} catch (error) {
		botActionErrorCallback(error, bot, query.message);
	}
});

const saveNewParticipantsAndNotify = async (
	bot: TelegramBot,
	query: TelegramBot.CallbackQuery,
	event: RSVPEvent,
	newParticipantsList: EventParticipant[],
	newWaitingList: EventParticipant[]
) => {
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: {
					participantsList: newParticipantsList,
					waitlingList: newWaitingList
				}
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(query)}`;
			}
			// delete previous announcement
			await bot.deleteMessage(query.message.chat.id, event.lastMessageId);
			await sendNewEventMessage(
				bot,
				query.message.chat.id,
				updatedEvent,
				getEventDescriptionHtml(updatedEvent),
				botMessageInlineKeyboardOptions
			);
		});
};

const registerParticipant = async (query: TelegramBot.CallbackQuery, event: RSVPEvent) => {
	// push participant
	const newParticipant: EventParticipant = {
		tgid: query.from.id,
		firstName: query.from.first_name,
		username: query.from.username
	};
	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	// avoid duplicates
	if (allParticipants.map(({ tgid }) => tgid).includes(newParticipant.tgid)) {
		// this participant is already there
		return;
	}
	const newFullListOfParticipants = [...allParticipants, newParticipant];
	const maxParticipants = event.participantLimit ?? 0; // typesafety only

	const newParticipantsList = maxParticipants
		? newFullListOfParticipants.splice(0, maxParticipants)
		: newFullListOfParticipants;

	const newWaitingList = maxParticipants ? [] : newFullListOfParticipants.splice(maxParticipants);
	await saveNewParticipantsAndNotify(bot, query, event, newParticipantsList, newWaitingList).catch(
		(error) => botActionErrorCallback(error, bot, query.message)
	);
};

const removeParticipant = async (query: TelegramBot.CallbackQuery, event: RSVPEvent) => {
	const participantToRemove: EventParticipant = {
		tgid: query.from.id,
		firstName: query.from.first_name,
		username: query.from.username
	};

	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	// nothing to remove
	if (!allParticipants.map(({ tgid }) => tgid).includes(participantToRemove.tgid)) {
		// this participant is already there
		return;
	}
	const newFullListOfParticipants = allParticipants.filter(
		(participant) => participant.tgid !== participantToRemove.tgid
	);

	const maxParticipants = event.participantLimit ?? 0; // typesafety only

	const newParticipantsList = maxParticipants
		? newFullListOfParticipants.splice(0, maxParticipants)
		: newFullListOfParticipants;

	const newWaitingList = maxParticipants ? [] : newFullListOfParticipants.splice(maxParticipants);
	await saveNewParticipantsAndNotify(bot, query, event, newParticipantsList, newWaitingList)
		.then(async () => {
			const newParticipantsOntheBlock = newParticipantsList.filter(
				(participant) => !event.participantsList?.map(({ tgid }) => tgid).includes(participant.tgid)
			);
			if (newParticipantsOntheBlock.length > 0) {
				await bot.sendMessage(
					query.message.chat.id,
					`Hello ${getParticipantDisplayName(newParticipantsOntheBlock[0])}, there is a spot for you now!`,
					{
						reply_markup: botMessageTextOptions
					}
				);
			}
		})
		.catch((error) => botActionErrorCallback(error, bot, query.message));
};

const botMessageTextOptions = JSON.stringify({
	force_reply: true
});

const botMessageInlineKeyboardOptions = JSON.stringify({
	inline_keyboard: [
		[
			{ text: "I'm in!", callback_data: 0 },
			{ text: 'Pass', callback_data: 1 }
		]
	],
	force_reply: true
});

const createNewEvent = async (bot: TelegramBot, message: TelegramBot.Message) => {
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, newEventState.messageToSend, {
			reply_markup: botMessageTextOptions
		})
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().insertOne({
				chatId: message.chat.id,
				lastMessageId: replyMessage.message_id,
				state: newEventState.nextState
			});
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

const setEventName = async (bot: TelegramBot, message: TelegramBot.Message, event: RSVPEvent) => {
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: {
					name: message.text
				}
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(message)}`;
			}
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				settingNameState.messageToSend,
				botMessageTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

const setEventDescription = async (
	bot: TelegramBot,
	message: TelegramBot.Message,
	event: RSVPEvent
) => {
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: {
					description: message.text
				}
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(message)}`;
			}
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				settingDescriptionState.messageToSend,
				botMessageTextOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};

const setParticipantLimit = async (
	bot: TelegramBot,
	message: TelegramBot.Message,
	event: RSVPEvent
) => {
	const participantLimit = Number(message.text) || 0;
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: { participantLimit }
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(message)}`;
			}
			await deleteExistingMessagesAndReply(
				bot,
				message,
				updatedEvent,
				getEventDescriptionHtml(event),
				botMessageInlineKeyboardOptions
			);
		})
		.catch((error: unknown) => botActionErrorCallback(error, bot, message));
};
