import { ObjectId } from 'mongodb';
import { faker } from '@faker-js/faker';
import type { RSVPEvent, RSVPEventParticipant } from '$lib/server/db/types';
import { RSVPEventState } from '$lib/server/db/types';

export const fakeParticipant = (): RSVPEventParticipant => ({
	tgid: faker.number.int(),
	firstName: faker.person.firstName(),
	username: `@${faker.person.lastName()}`,
	isPlusOne: false
});

export const fakeCompletedRSVPEvent = (numParticipants: number = 4): RSVPEvent => ({
	_id: new ObjectId('67c4a37fc83350a5babfc176'),
	ownerId: faker.number.int(),
	lang: 'en',
	chatId: faker.number.int(),
	lastMessageId: faker.number.int(),
	state: RSVPEventState.Polling,
	name: faker.word.words(2),
	hasWaitlist: true,
	allowsPlusOne: true,
	description: faker.word.words(15),
	participantLimit: numParticipants,
	participantsList: new Array(numParticipants).fill(0).map(() => fakeParticipant()),
	waitlingList: new Array(numParticipants).fill(0).map(() => fakeParticipant())
});

export const fakeStaticCompletedEvent = {
	_id: new ObjectId('67c4a37fc83350a5babfc176'),
	ownerId: 1234567,
	chatId: 3558362470594277,
	lang: 'en',
	lastMessageId: 2151340586554872,
	state: RSVPEventState.Polling,
	name: 'indeed garrote',
	description:
		'joyfully hence negative augment republican early sentimental generously from underachieve usually fashion if around famously',
	participantLimit: 3,
	participantsList: [
		{ tgid: 2130076638427323, firstName: 'Isom', username: '@Breitenberg', isPlusOne: false },
		{ tgid: 5246826418371547, firstName: 'Willy', username: '@Hyatt', isPlusOne: false },
		{ tgid: 4723685249385783, firstName: 'Alphonso', username: '@Schulist', isPlusOne: false }
	],
	waitlingList: [
		{ tgid: 6734487725343225, firstName: 'Winifred', username: '@Wyman', isPlusOne: false },
		{ tgid: 4006715761157708, firstName: 'Lucious', username: '@Labadie', isPlusOne: false }
	]
};
