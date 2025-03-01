import TelegramBot from 'npm:node-telegram-bot-api';
import { match } from 'npm:ts-pattern';
import { logger } from '../logger.ts';
import { eventCollection, getEvent } from '../db/mongo.ts';
import { env } from '$env/dynamic/private';
import { RSVPEvent, RSVPEventState } from '../db/types.ts';

export const bot = new TelegramBot(env.BOT_TOKEN);

const newEventState: BotState = {
	state: RSVPEventState.NewEvent,
	nextState: RSVPEventState.NewEvent,
	messageToSend: 'What is your event called?'
};

const settingNameState: BotState = {
	state: RSVPEventState.NewEvent,
	nextState: RSVPEventState.NameSet,
	messageToSend: 'Does your event have some description?'
};

const settingDescriptionState: BotState = {
	state: RSVPEventState.NameSet,
	nextState: RSVPEventState.DescriptionSet,
	messageToSend: 'Does you event have participant limit?'
};

const settingParticipantLimitState: BotState = {
	state: RSVPEventState.DescriptionSet,
	nextState: RSVPEventState.Polling,
	messageToSend: ''
};

interface BotState {
	state: RSVPEventState;
	nextState: RSVPEventState;
	messageToSend: string | undefined;
}

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

const botMessageOptions = {
	reply_markup: {
		force_reply: true
	}
};

const createNewEvent = async (bot: TelegramBot, message: TelegramBot.Message) => {
	//create new event here, log last message id as the event

	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, newEventState.messageToSend, botMessageOptions)
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().insertOne({
				chatId: message.chat.id,
				lastMessageId: replyMessage.message_id,
				state: newEventState.nextState
			});
		});
};

const setEventName = async (bot: TelegramBot, message: TelegramBot.Message, event: RSVPEvent) => {
	await bot.deleteMessage(message.chat.id, event.lastMessageId);
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, settingNameState.messageToSend, botMessageOptions)
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().updateOne(
				{ _id: event._id },
				{
					$set: {
						lastMessageId: replyMessage.message_id,
						state: settingNameState.nextState,
						name: message.text
					}
				},
				{ upsert: true }
			);
		});
};

const setEventDescription = async (
	bot: TelegramBot,
	message: TelegramBot.Message,
	event: RSVPEvent
) => {
	await bot.deleteMessage(message.chat.id, event.lastMessageId);
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, settingDescriptionState.messageToSend, botMessageOptions)
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().updateOne(
				{ _id: event._id },
				{
					$set: {
						lastMessageId: replyMessage.message_id,
						state: settingDescriptionState.nextState,
						description: message.text
					}
				},
				{ upsert: true }
			);
		});
};

const setParticipantLimit = async (
	bot: TelegramBot,
	message: TelegramBot.Message,
	event: RSVPEvent
) => {
	const participantLimit = parseInt(message.text);
	const messageToSend =
		event.name + '\n' + event.description + '\n' + `Participants: ${participantLimit}`;

	await bot.deleteMessage(message.chat.id, event.lastMessageId);
	await bot.deleteMessage(message.chat.id, message.message_id);
	await bot
		.sendMessage(message.chat.id, messageToSend, {
			reply_markup: {
				inline_keyboard: [[{ text: 'Yey' }, { text: 'Nay' }]],
				...botMessageOptions.reply_markup
			}
		})
		.then((replyMessage: TelegramBot.Message) => {
			eventCollection().updateOne(
				{ _id: event._id },
				{
					$set: {
						lastMessageId: replyMessage.message_id,
						state: settingParticipantLimitState.nextState,
						participantLimit: participantLimit
					}
				},
				{ upsert: true }
			);
		});
};
