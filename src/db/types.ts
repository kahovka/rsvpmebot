import { BotStates } from '../types/bot.ts';

export interface RSVPEvent {
	lastMessageId: number;
	state: BotStates;
}
