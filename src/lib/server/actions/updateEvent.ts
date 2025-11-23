import { z } from 'zod';
import { getEventById, updateEventById } from '../db/mongo';
import { ObjectId, type WithId } from 'mongodb';
import type { RSVPEvent } from '../db/types';
import { bot } from '../bot/bot';
import { getEventDescriptionHtml, sendEventForPolling } from '../bot/utils';
import { botMessageInlineKeyboardOptions } from '../bot/misc';
import type TelegramBot from 'node-telegram-bot-api';
import { logger } from '$lib/logger';

export const UpdateEventFromUIActionSchema = z.object({
	eventId: z.string(),
	eventName: z.string(),
	eventDescription: z.string(),
	participantLimit: z.coerce.number(),
	hasWaitingList: z.string().toLowerCase().transform(JSON.parse).pipe(z.boolean())
});

export type UpdateEventFromUIActionData = z.infer<typeof UpdateEventFromUIActionSchema>;

export const updateEventFromUI = async (data: UpdateEventFromUIActionData) => {
	const eventId = new ObjectId(data.eventId);
	const event = await getEventById(eventId);
	if (!event) {
		throw 'Cannot update an event since no event found';
	}
	// recalculculate participants with waiting list and new number
	const allParticipants = [...(event.participantsList ?? []), ...(event.waitlingList ?? [])];
	const maxParticipants = data.participantLimit ?? 0; // typesafety only

	const newParticipantsList = maxParticipants
		? [...allParticipants].splice(0, maxParticipants)
		: allParticipants;

	const newWaitingList =
		maxParticipants && data.hasWaitingList ? [...allParticipants].splice(maxParticipants) : [];

	const updateQuery: Partial<WithId<RSVPEvent>> = {
		//	allowsPlusOne: data.alowsPlusOne, do this later
		name: data.eventName,
		description: data.eventDescription,
		hasWaitlist: data.hasWaitingList,
		participantLimit: data.participantLimit,
		participantsList: newParticipantsList,
		waitlingList: newWaitingList
	};

	logger.info('Updating event from UI with {query}', { query: updateQuery });
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
