import type { AvailableLocale } from '$lib/i18n/translations';
import { ObjectId } from 'mongodb';

export interface RSVPEvent {
	_id?: ObjectId;
	chatId: number;
	threadId?: number;
	ownerId: number;
	lastMessageId: number;
	state: RSVPEventState;
	lang: AvailableLocale;
	hasWaitlist?: boolean;
	allowsPlusOne?: boolean;
	name?: string;
	description?: string;
	participantLimit?: number;
	participantsList?: RSVPEventParticipant[];
	waitlingList?: RSVPEventParticipant[];
}

export interface RSVPEventParticipant {
	tgid: number;
	firstName: string;
	username: string | undefined;
	isPlusOne: boolean;
}

export enum RSVPEventState {
	NewEvent = 'new',
	NameSet = 'nameSet',
	DescriptionSet = 'descriptionSet',
	PlusOneSet = 'plusOneSet',
	ParticipantLimitSet = 'numParticipantsSet',
	WailistSet = 'waitlistSet',
	Polling = 'polling'
}
