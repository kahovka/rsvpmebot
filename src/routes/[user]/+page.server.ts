import { eventCollection } from '$lib/server/db/mongo';
import type { RSVPEvent } from '$lib/server/db/types';
import { toDisplayEvent } from '$lib/types/DisplayEvent';
import { logger } from '$lib/logger';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const userId = Number(params.user);
	let availableEvents: RSVPEvent[];
	if (userId) {
		availableEvents = await eventCollection()
			.find({ ownerId: Number(params.user) })
			.toArray();
		logger.debug(`Loading current events: {numEntries}`, {
			numEntries: availableEvents.length
		});
	} else {
		availableEvents = [];
	}

	return {
		events: availableEvents
			.map((event: RSVPEvent) => toDisplayEvent(event))
			.filter((event) => event !== undefined)
	};
};
