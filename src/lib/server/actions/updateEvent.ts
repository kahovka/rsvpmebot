import { z } from 'zod';
import { getEventById, updateEventById } from '../db/mongo';
import { ObjectId, type WithId } from 'mongodb';
import type { RSVPEvent } from '../db/types';
import { bot } from '../bot/bot';
import { getEventDescriptionHtml, sendEventForPolling } from '../bot/utils';
import { botMessageInlineKeyboardOptions } from '../bot/misc';
import type TelegramBot from 'node-telegram-bot-api';
import { logger } from '$lib/logger';

export const UpdateEventFromUIParticipantSchema = z.object({
	id: z.coerce.number(),
	isPlusOne: z.boolean()
});

export const UpdateEventFromUIActionSchema = z.object({
	eventId: z.string(),
	eventName: z.string(),
	eventDescription: z.string(),
	participantLimit: z.coerce.number(),
	hasWaitingList: z.string().toLowerCase().transform(JSON.parse).pipe(z.boolean()),
	allowsPlusOne: z.string().toLowerCase().transform(JSON.parse).pipe(z.boolean()),
	registeredParticipants: z.preprocess(
		(val: string) => JSON.parse(val),
		z.array(UpdateEventFromUIParticipantSchema)
	),
	waitingParticipants: z.preprocess(
		(val: string) => JSON.parse(val),
		z.array(UpdateEventFromUIParticipantSchema)
	),
	deletedParticipants: z.preprocess(
		(val: string) => JSON.parse(val),
		z.array(UpdateEventFromUIParticipantSchema)
	)
});

export type UpdateEventFromUIActionData = z.infer<typeof UpdateEventFromUIActionSchema>;
export type UpdateEventFromUIParticipant = z.infer<typeof UpdateEventFromUIParticipantSchema>;

export const updateEventFromUI = async (data: UpdateEventFromUIActionData) => {
	const eventId = new ObjectId(data.eventId);
	const event = await getEventById(eventId);
	if (!event) {
		throw 'Cannot update an event since no event found';
	}
	// recalculculate participants with waiting list, now number of participants and remove all plus ones if required
	// this is a tad tricky, if someone voted while the event was in editing, we still need to append them
	const combinedParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	const additionalParticipants = combinedParticipants.filter(
		({ tgid, isPlusOne }) =>
			![
				...data.registeredParticipants,
				...data.waitingParticipants,
				...data.deletedParticipants
			].find((member) => member.id === tgid && member.isPlusOne === isPlusOne)
	);

	if (additionalParticipants.length > 0)
		logger.info(
			'Seems like there are more participants in the survey as in the payload {additionalParticipants}. Will append them.',
			{ additionalParticipants }
		);

	const registeredParticipants = data.registeredParticipants
		.map((data) =>
			combinedParticipants.find(
				({ tgid, isPlusOne }) => tgid === data.id && isPlusOne === data.isPlusOne
			)
		)
		.filter((participant) => !!participant);
	const waitingParticipants = data.waitingParticipants
		.map((data) =>
			combinedParticipants.find(
				({ tgid, isPlusOne }) => tgid === data.id && isPlusOne === data.isPlusOne
			)
		)
		.filter((participant) => !!participant);

	let allParticipants = [
		...registeredParticipants,
		...waitingParticipants,
		...additionalParticipants
	];
	console.log(allParticipants);

	// and recalculate, bacause new participants might land in any part of the list
	allParticipants = data.allowsPlusOne
		? allParticipants
		: allParticipants.filter(({ isPlusOne }) => isPlusOne !== true);
	const maxParticipants = data.participantLimit ?? 0;

	const newParticipantsList = maxParticipants
		? [...allParticipants].splice(0, maxParticipants)
		: allParticipants;

	const newWaitingList =
		maxParticipants && data.hasWaitingList ? [...allParticipants].splice(maxParticipants) : [];

	const updateQuery: Partial<WithId<RSVPEvent>> = {
		allowsPlusOne: data.allowsPlusOne,
		name: data.eventName,
		description: data.eventDescription,
		hasWaitlist: data.hasWaitingList,
		participantLimit: data.participantLimit,
		participantsList: newParticipantsList,
		waitlingList: newWaitingList
	};

	logger.info('Updating event {event} from UI with {query}', { event: event, query: updateQuery });
	await updateEventById(eventId, updateQuery).then(async (updatedEvent) => {
		bot.deleteMessage(event.chatId, event.lastMessageId);
		const messageToSend = getEventDescriptionHtml(updatedEvent);
		const replyMarkup = botMessageInlineKeyboardOptions(event.lang, event.allowsPlusOne);
		await bot
			.sendMessage(event.chatId, messageToSend, {
				disable_notification: true,
				...(event.threadId && { message_thread_id: event.threadId }),
				...(replyMarkup && { reply_markup: replyMarkup }),
				parse_mode: 'HTML'
			})
			.then((replyMessage: TelegramBot.Message) => {
				updateEventById(eventId, { lastMessageId: replyMessage.message_id });
			});
	});
};
