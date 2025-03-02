import { ObjectId } from 'npm:mongodb';

export interface RSVPEvent {
	_id?: ObjectId;
	chatId: number;
	lastMessageId: number;
	state: RSVPEventState;
	name?: string;
	description?: string;
	participantLimit?: number;
}

export enum RSVPEventState {
	NewEvent = 'new',
	NameSet = 'nameSet',
	DescriptionSet = 'descriptionSet',
	ParticipantLimitSet = 'numParticipantsSet',
	Polling = 'polling'
}
