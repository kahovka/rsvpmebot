import * as history from '$lib/botHistory.ts';
import { BotHistoryEntry } from '../lib/botHistory.ts';
import { logger } from '../logger.ts';

export function load() {
	logger.debug(`Loading history entries: {numEntries}`, {
		numEntries: history.getAllEntries().map((it: BotHistoryEntry) => it.message.message_id)
	});
	return {
		messages: history.getAllEntries().map((it: BotHistoryEntry) => it.message)
	};
}
