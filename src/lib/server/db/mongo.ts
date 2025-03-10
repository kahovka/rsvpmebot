import { MongoClient, type ObjectId } from 'npm:mongodb';
import { env } from '$env/dynamic/private';
import { logger } from '../../../logger.ts';
import { RSVPEvent, RSVPEventState } from './types.ts';
import { getEventNextState } from '../bot/utils.ts';

const client = new MongoClient(env.MONGO_DB_URL ?? 'mongodb://127.0.0.1:27017');

export const connectToDb = async () =>
	await client
		.connect()
		.then(() => logger.info`Connected to db`)
		.catch((error) => logger.error('Could not connect to db {error}', { error }));

export const disconnectFromDb = async () =>
	await client
		.connect()
		.then(() => logger.info`Disconnected from db`)
		.catch((error) => logger.error('Could not disconnect from db {error}', { error }));

export const eventDb = () => client.db();

export const eventCollection = () => client.db().collection<RSVPEvent>('events');
export const updateEventById = async (
	eventId: ObjectId,
	query: { [key: string]: any }
): Promise<RSVPEvent> =>
	await eventCollection()
		.findOneAndUpdate(
			{ _id: eventId },
			{
				$set: query
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then((updatedEvent: RSVPEvent | undefined) => {
			if (!updatedEvent) {
				throw `No event found to update, ${eventId}`;
			}
			return updatedEvent;
		});

export const setEventState = async (event: RSVPEvent, nextState: RSVPEventState | undefined) => {
	await eventCollection().findOneAndUpdate(
		{ _id: event._id },
		{
			$set: {
				state: nextState ?? getEventNextState(event)
			}
		},
		{ upsert: true }
	);
};

export const getEvent = async (chatId: number, lastBotMessageId: number) =>
	await eventCollection().findOne({
		chatId: chatId,
		lastMessageId: lastBotMessageId
	});
