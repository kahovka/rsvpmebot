import TelegramBot from 'npm:node-telegram-bot-api';

const history: Map<string, BotHistoryEntry> = new Map();

export interface BotHistoryEntry {
	loggedAt: Date;
	message: TelegramBot.Message;
}

export function saveMessage(entry: BotHistoryEntry) {
	history.set(entry.message.id, entry);
}

export function getAllEntries(): BotHistoryEntry[] {
	return history.values().toArray();
}
