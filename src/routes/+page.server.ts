import * as history from '$lib/botHistory.ts';
import { BotHistoryEntry } from '../lib/botHistory.ts';

export function load() {
	return {
		messages: history.getAllEntries().map((it: BotHistoryEntry) => it.message)
	};
}
