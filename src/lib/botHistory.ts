import TelegramBot from 'node-telegram-bot-api';
import { logger } from '../logger.ts';

const history: Map<string, BotHistoryEntry> = new Map();

export interface BotHistoryEntry {
	loggedAt: Date;
	message: TelegramBot.Message;
}

export function saveMessage(entry: BotHistoryEntry) {
	history.set(entry.message.message_id, entry);
	logger.debug(`Saved a new message {messageId}.`, { messageId: entry.message.message_id });
}

export function getAllEntries(): BotHistoryEntry[] {
	return history.values().toArray();
}
