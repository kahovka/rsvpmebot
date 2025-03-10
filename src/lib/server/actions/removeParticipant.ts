import { ObjectId } from 'npm:mongodb';
import { z } from 'npm:zod';
import { getEventById } from '../db/mongo';
import type { BotCallbackQuery } from '../bot/schemata';
import { removeParticipant } from '../bot/callbackQueries';
import { bot } from '../bot/bot';

export const DeleteParticipantActionSchema = z.object({
	eventId: z.string(),
	participantId: z.coerce.number()
});

export type DeleteParticipantActionData = z.infer<typeof DeleteParticipantActionSchema>;

export const removeParticipantAction = async (data: DeleteParticipantActionData) => {
	const event = await getEventById(new ObjectId(data.eventId));
	if (!event) {
		throw 'Cannot remove participant without an event';
	}
	//TODO: make a share action that doesn't need all the dummy inputs to work
	const pretendQuery: BotCallbackQuery = {
		message: {
			message_id: 0,
			from: {
				id: data.participantId,
				first_name: 'Jane Doe'
			},
			chat: {
				id: event?.chatId!
			},
			text: '2' // calback text to remove participant
		},
		from: {
			id: data.participantId,
			first_name: 'Jane Doe'
		},
		data: '2'
	};
	await removeParticipant(bot, pretendQuery, event);
};
