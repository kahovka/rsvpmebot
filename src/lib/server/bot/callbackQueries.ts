import TelegramBot from 'node-telegram-bot-api';
import { translate } from '$lib/i18n/translate';
import { updateEventById } from '$lib/server/db/mongo';
import type { RSVPEventParticipant, RSVPEventWithId } from '$lib/server/db/types';
import type { BotCallbackQuery, BotTextMessage } from '$lib/server/bot/schemata';
import { botActionErrorCallback, getParticipantDisplayName, sendEventForPolling } from './utils.ts';

const saveNewParticipantsAndNotify = async (
	bot: TelegramBot,
	message: BotTextMessage,
	event: RSVPEventWithId,
	newParticipantsList: RSVPEventParticipant[],
	newWaitingList: RSVPEventParticipant[]
) => {
	await updateEventById(event._id, {
		participantsList: newParticipantsList,
		...(event?.hasWaitlist && { waitlingList: newWaitingList })
	}).then(async (updatedEvent) => {
		bot.deleteMessage(message.chat.id, event.lastMessageId);
		await sendEventForPolling(bot, message, updatedEvent);
	});
};

async function registerNewParticipant(
	bot: TelegramBot,
	query: BotCallbackQuery,
	event: RSVPEventWithId,
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
			translate('event.messages.eventIsFull', event.lang),
			event.threadId ? { message_thread_id: event.threadId } : {}
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
	event: RSVPEventWithId
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
		await bot.sendMessage(
			query.message.chat.id,
			`${getParticipantDisplayName(newParticipant)} ${translate('event.messages.participantAlreadyExists', event.lang)}`,
			event.threadId ? { message_thread_id: event.threadId } : {}
		);
		return;
	}

	await registerNewParticipant(bot, query, event, newParticipant);
};

export const registerParticipantPlusOne = async (
	bot: TelegramBot,
	query: BotCallbackQuery,
	event: RSVPEventWithId
) => {
	const participantId = query.from.id;
	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	if (!allParticipants.map(({ tgid }) => tgid).includes(participantId)) {
		// this participant is already there and can add plus one
		const existingParticipant = allParticipants.find(
			(participant) => participant.tgid === participantId
		);
		await bot.sendMessage(
			query.message.chat.id,
			`${translate('event.messages.noPlusOnePossible', event.lang)} ${existingParticipant && getParticipantDisplayName(existingParticipant)}`,
			event.threadId ? { message_thread_id: event.threadId } : {}
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
	event: RSVPEventWithId
) => {
	const participantToRemoveId = query.from.id;

	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	// nothing to remove
	if (!allParticipants.map(({ tgid }) => tgid).includes(participantToRemoveId)) {
		return;
	}

	const associatedParticipants = allParticipants.filter(
		(part) => part.tgid === participantToRemoveId
	);
	let newFullListOfParticipants;
	// if has plus one, first remove plus one
	if (associatedParticipants.some((participant) => participant.isPlusOne)) {
		// first remove plus one
		newFullListOfParticipants = allParticipants.filter(
			(participant) =>
				participant.tgid !== participantToRemoveId ||
				(participant.tgid === participantToRemoveId && participant.isPlusOne === false)
		);
	} else {
		newFullListOfParticipants = allParticipants.filter(
			// then remove the main participant
			(participant) => participant.tgid !== participantToRemoveId
		);
	}

	const maxParticipants = event.participantLimit ?? 0; // typesafety only

	const newParticipantsList = maxParticipants
		? [...newFullListOfParticipants].splice(0, maxParticipants)
		: newFullListOfParticipants;

	const newWaitingList = maxParticipants
		? [...newFullListOfParticipants].splice(maxParticipants)
		: [];
	await saveNewParticipantsAndNotify(bot, query.message, event, newParticipantsList, newWaitingList)
		.then(async () => {
			const newParticipantsOntheBlock = newParticipantsList.filter(
				(participant) => !event.participantsList?.map(({ tgid }) => tgid).includes(participant.tgid)
			);

			if (newParticipantsOntheBlock.length > 0) {
				await bot.sendMessage(
					query.message.chat.id,
					`Hello ${getParticipantDisplayName(newParticipantsOntheBlock[0])}, there is a spot for you now!`,
					event.threadId ? { message_thread_id: event.threadId } : {}
				);
			}
		})
		.catch((error) => botActionErrorCallback(error, bot, query.message));
};
