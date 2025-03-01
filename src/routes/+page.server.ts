import { eventCollection } from '../db/mongo.ts';
import { RSVPEvent } from '../db/types.ts';
import { logger } from '../logger.ts';

export async function load() {
	const availableEvents = await eventCollection().find().toArray();
	logger.debug(`Loading current events: {numEntries}`, {
		numEntries: availableEvents.length
	});
	return {
		events: availableEvents.map((it: RSVPEvent) => ({ eventContent: JSON.stringify(it) }))
	};
}
