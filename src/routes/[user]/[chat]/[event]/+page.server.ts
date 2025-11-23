import { eventCollection } from '$lib/server/db/mongo';
import { type RSVPEvent } from '$lib/server/db/types';
import { toDisplayEvent } from '$lib/types/DisplayEvent';
import { logger } from '$lib/logger';
import { ObjectId } from 'mongodb';
import type { PageServerLoad } from './$types';
import {
	DeleteParticipantActionSchema,
	removeParticipantAction
} from '$lib/server/actions/removeParticipant.js';
import { fail } from '@sveltejs/kit';
import { updateEventFromUI, UpdateEventFromUIActionSchema } from '$lib/server/actions/updateEvent';

export const load: PageServerLoad = async ({ params }) => {
	const event = await eventCollection().findOne<RSVPEvent>(
		{
			_id: new ObjectId(params.event),
			ownerId: Number(params.user),
			chatId: Number(params.chat)
		},
		{}
	);
	if (!event) {
		logger.error('Could not fetch event by id: {eventId} user: {user} and chat: {chat}', {
			eventId: params.event,
			user: params.user,
			chat: params.chat
		});
		throw 'Could not match any event to the request';
	}
	return { event: toDisplayEvent(event) };
};

export const actions = {
	deleteParticipant: async ({ request }) => {
		const formData = await request.formData();
		logger.info('requested participant deletion {data}', { data: formData });
		try {
			const data = DeleteParticipantActionSchema.parse(Object.fromEntries(formData));
			await removeParticipantAction(data);
		} catch (error: any) {
			return fail(422, {
				description: formData.get('description'),
				error: error.message
			});
		}
	},

	updateEvent: async ({ request }) => {
		const formData = await request.formData();
		try {
			const data = UpdateEventFromUIActionSchema.parse(Object.fromEntries(formData));
			logger.info('updating event {data}', { data });
			await updateEventFromUI(data);
		} catch (error: any) {
			return fail(422, {
				description: formData.get('description'),
				error: error.message
			});
		}
	}
};
