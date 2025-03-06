import TelegramBot from 'npm:node-telegram-bot-api';
import { RSVPEventParticipant, RSVPEvent } from '../db/types.ts';
import { eventCollection } from '../db/mongo.ts';
import {
	botActionErrorCallback,
	getEventDescriptionHtml,
	getParticipantDisplayName,
	sendNewEventMessage
} from './utils.ts';
import { botMessageInlineKeyboardOptions, botMessageTextOptions } from './misc.ts';

const saveNewParticipantsAndNotify = async (
	bot: TelegramBot,
	query: TelegramBot.CallbackQuery,
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

export const registerParticipant = async (
	bot: TelegramBot,
	query: TelegramBot.CallbackQuery,
	event: RSVPEvent
) => {
	// push participant
	const newParticipant: RSVPEventParticipant = {
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

export const removeParticipant = async (
	bot: TelegramBot,
	query: TelegramBot.CallbackQuery,
	event: RSVPEvent
) => {
	const participantToRemove: RSVPEventParticipant = {
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
