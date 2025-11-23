import type { RSVPEvent, RSVPEventParticipant } from '$lib/server/db/types';

export interface DisplayEvent {
	id: string;
	name: string;
	ownerId: number | undefined;
	chatId: number | undefined;
	description: string;
	numParticipants: number;
	hasWaitingList: boolean;
	allowsPlusOne: boolean;
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
		ownerId: event.ownerId,
		chatId: event.chatId,
		description: event.description ?? 'Your event details',
		numParticipants: event.participantLimit ?? 0,
		hasWaitingList: event.hasWaitlist ?? false,
		allowsPlusOne: event.allowsPlusOne ?? false,
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
