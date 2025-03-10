import type { RSVPEvent, RSVPEventParticipant } from '../server/db/types.ts';

export interface DisplayEvent {
	id: string;
	name: string;
	description: string;
	numParticipants: number;
	participants: DisplayEventParticipant[];
	waitingParticipants: DisplayEventParticipant[];
}

export interface DisplayEventParticipant {
	id: number;
	name: string;
}

export const toDisplayEvent = (event: RSVPEvent): DisplayEvent => {
	return {
		id: event._id!.toString(),
		name: event.name ?? 'Your event',
		description: event.description ?? 'Your event details',
		numParticipants: event.participantLimit ?? 0,
		participants:
			event.participantsList?.map((participant) => toDisplayParticipant(participant)) ?? [],
		waitingParticipants:
			event.waitlingList?.map((participant) => toDisplayParticipant(participant)) ?? []
	};
};

export const toDisplayParticipant = (
	participant: RSVPEventParticipant
): DisplayEventParticipant => ({
	id: participant.tgid,
	name: `${participant.firstName} (${participant.username})`
});
