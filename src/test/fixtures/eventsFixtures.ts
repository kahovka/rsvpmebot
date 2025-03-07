import { ObjectId } from 'mongodb';
import { faker } from '@faker-js/faker';
import { RSVPEvent, RSVPEventParticipant, RSVPEventState } from '../../lib/server/db/types.ts';

export const fakeParticipant = (): RSVPEventParticipant => ({
	tgid: faker.number.int(),
	firstName: faker.person.firstName(),
	username: `@${faker.person.lastName()}`
});

export const fakeCompletedRSVPEvent = (numParticipants: number = 4): RSVPEvent => ({
	_id: new ObjectId('67c4a37fc83350a5babfc176'),
	chatId: faker.number.int(),
	lastMessageId: faker.number.int(),
	state: RSVPEventState.Polling,
	name: faker.word.words(2),
	description: faker.word.words(15),
	participantLimit: numParticipants,
	participantsList: new Array(numParticipants).fill(0).map(() => fakeParticipant()),
	waitlingList: new Array(2).fill(0).map(() => fakeParticipant())
});

export const fakeStaticCompletedEvent = {
	_id: new ObjectId('67c4a37fc83350a5babfc176'),
	chatId: 3558362470594277,
	lastMessageId: 2151340586554872,
	state: RSVPEventState.Polling,
	name: 'indeed garrote',
	description:
		'joyfully hence negative augment republican early sentimental generously from underachieve usually fashion if around famously',
	participantLimit: 3,
	participantsList: [
		{ tgid: 2130076638427323, firstName: 'Isom', username: '@Breitenberg' },
		{ tgid: 5246826418371547, firstName: 'Willy', username: '@Hyatt' },
		{ tgid: 4723685249385783, firstName: 'Alphonso', username: '@Schulist' }
	],
	waitlingList: [
		{ tgid: 6734487725343225, firstName: 'Winifred', username: '@Wyman' },
		{ tgid: 4006715761157708, firstName: 'Lucious', username: '@Labadie' }
	]
};
