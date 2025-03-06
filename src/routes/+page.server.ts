import { PageServerLoad } from '../../.svelte-kit/types/src/routes/$types.d.ts';
import { eventCollection } from '../lib/server/db/mongo.ts';
import { RSVPEvent } from '../lib/server/db/types.ts';
import { logger } from '../logger.ts';

export const load: PageServerLoad = async () => {
	const availableEvents = await eventCollection().find().toArray();
	logger.debug(`Loading current events: {numEntries}`, {
		numEntries: availableEvents.length
	});
	return {
		events: availableEvents.map((it: RSVPEvent) => ({ eventContent: JSON.stringify(it) }))
	};
};
