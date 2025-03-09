import TelegramBot from 'npm:node-telegram-bot-api';
import { translate } from '../../i18n/translate.ts';
import { eventCollection } from '../db/mongo.ts';
import { RSVPEvent, RSVPEventParticipant } from '../db/types.ts';
import { botMessageInlineKeyboardOptions, botMessageTextOptions } from './misc.ts';
import { BotCallbackQuery, BotTextMessage } from './schemata.ts';
import {
	botActionErrorCallback,
	getEventDescriptionHtml,
	getParticipantDisplayName,
	sendNewEventMessage
} from './utils.ts';

const saveNewParticipantsAndNotify = async (
	bot: TelegramBot,
	message: BotTextMessage,
	event: RSVPEvent,
	newParticipantsList: RSVPEventParticipant[],
	newWaitingList: RSVPEventParticipant[]
) => {
	await eventCollection()
		.findOneAndUpdate(
			{ _id: event._id },
			{
				$set: {
					participantsList: newParticipantsList,
					...(event?.hasWaitlist && { waitlingList: newWaitingList })
				}
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then(async (updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${event._id}, ${JSON.stringify(message)}`;
			}
			// delete previous announcement
			await bot.deleteMessage(message.chat.id, event.lastMessageId);
			await sendNewEventMessage(
				bot,
				message.chat.id,
				updatedEvent,
				getEventDescriptionHtml(updatedEvent),
				botMessageInlineKeyboardOptions(updatedEvent.lang, event.allowsPlusOne)
			);
		});
};

async function registerNewParticipant(
	bot: TelegramBot,
	query: BotCallbackQuery,
	event: RSVPEvent,
	newParticipant: RSVPEventParticipant
) {
	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];

	if (
		event.participantLimit &&
		event.hasWaitlist !== true &&
		allParticipants.length >= event.participantLimit
	) {
		await bot.sendMessage(
			query.message.chat.id,
			translate('event.messages.eventIsFull', event.lang)
		);
		return;
	}

	const newFullListOfParticipants = [...allParticipants, newParticipant];
	const maxParticipants = event.participantLimit ?? 0; // typesafety only

	const newParticipantsList = maxParticipants
		? [...newFullListOfParticipants].splice(0, maxParticipants)
		: newFullListOfParticipants;

	const newWaitingList = maxParticipants
		? [...newFullListOfParticipants].splice(maxParticipants)
		: [];
	await saveNewParticipantsAndNotify(
		bot,
		query.message,
		event,
		newParticipantsList,
		newWaitingList
	).catch((error) => botActionErrorCallback(error, bot, query.message));
}

export const registerParticipant = async (
	bot: TelegramBot,
	query: BotCallbackQuery,
	event: RSVPEvent
) => {
	// push participant
	const newParticipant: RSVPEventParticipant = {
		tgid: query.from.id,
		firstName: query.from.first_name,
		username: query.from.username,
		isPlusOne: false
	};
	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	// avoid duplicates
	if (allParticipants.map(({ tgid }) => tgid).includes(newParticipant.tgid)) {
		// this participant is already there
		return;
	}

	await registerNewParticipant(bot, query, event, newParticipant);
};

export const registerParticipantPlusOne = async (
	bot: TelegramBot,
	query: BotCallbackQuery,
	event: RSVPEvent
) => {
	const participantId = query.from.id;
	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	if (allParticipants.map(({ tgid }) => tgid).includes(participantId)) {
		// this participant is already there and can add plus one
	} else {
		await bot.sendMessage(
			query.message.chat.id,
			translate('event.messages.noPlusOnePossible', event.lang)
		);
		return;
	}
	const newParticipant = {
		tgid: query.from.id,
		firstName: `${query.from.first_name} +1`,
		username: query.from.username,
		isPlusOne: true
	};

	await registerNewParticipant(bot, query, event, newParticipant);
};

export const removeParticipant = async (
	bot: TelegramBot,
	query: BotCallbackQuery,
	event: RSVPEvent
) => {
	const participantToRemoveId = query.from.id;

	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	// nothing to remove
	if (!allParticipants.map(({ tgid }) => tgid).includes(participantToRemoveId)) {
		// this participant is already there
		return;
	}

	const associatedParticipants = allParticipants.filter(
		(part) => part.tgid === participantToRemoveId
	);
	let newFullListOfParticipants;
	// if has plus one, first remove plus one
	if (associatedParticipants.some((participant) => participant.isPlusOne)) {
		newFullListOfParticipants = allParticipants.filter(
			(participant) =>
				participant.tgid !== participantToRemoveId ||
				(participant.tgid === participantToRemoveId && participant.isPlusOne === false)
		);
	} else {
		newFullListOfParticipants = allParticipants.filter(
			(participant) => participant.tgid !== participantToRemoveId
		);
	}

	const maxParticipants = event.participantLimit ?? 0; // typesafety only

	const newParticipantsList = maxParticipants
		? newFullListOfParticipants.splice(0, maxParticipants)
		: newFullListOfParticipants;

	const newWaitingList = maxParticipants ? [] : newFullListOfParticipants.splice(maxParticipants);
	query.message &&
		(await saveNewParticipantsAndNotify(
			bot,
			query.message,
			event,
			newParticipantsList,
			newWaitingList
		)
			.then(async () => {
				const newParticipantsOntheBlock = newParticipantsList.filter(
					(participant) =>
						!event.participantsList?.map(({ tgid }) => tgid).includes(participant.tgid)
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
			.catch((error) => botActionErrorCallback(error, bot, query.message)));
};
