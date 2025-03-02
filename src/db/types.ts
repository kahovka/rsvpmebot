import { ObjectId } from 'npm:mongodb';

export interface RSVPEvent {
	_id?: ObjectId;
	chatId: number;
	lastMessageId: number;
	state: RSVPEventState;
	name?: string;
	description?: string;
	participantLimit?: number;
	participantsList?: EventParticipant[];
	waitlingList?: EventParticipant[];
}

export interface EventParticipant {
	tgid: number;
	firstName: string;
	username: string;
}

export enum RSVPEventState {
	NewEvent = 'new',
	NameSet = 'nameSet',
	DescriptionSet = 'descriptionSet',
	ParticipantLimitSet = 'numParticipantsSet',
	Polling = 'polling'
}
