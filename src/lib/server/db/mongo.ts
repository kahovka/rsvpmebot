import { MongoClient, type ObjectId, type WithId } from 'mongodb';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/logger';
import { type RSVPEvent, type RSVPEventWithId } from '$lib/server/db/types';

const client = new MongoClient(env.MONGO_DB_URL ?? 'mongodb://127.0.0.1:27017');

export const connectToDb = async () =>
	await client
		.connect()
		.then(() => logger.info`Connected to db`)
		.catch((error: unknown) => logger.error('Could not connect to db {error}', { error }));

export const disconnectFromDb = async () =>
	await client
		.connect()
		.then(() => logger.info`Disconnected from db`)
		.catch((error: unknown) => logger.error('Could not disconnect from db {error}', { error }));

export const eventDb = () => client.db();

export const eventCollection = () => client.db().collection<RSVPEvent>('events');
export const updateEventById = async (
	eventId: ObjectId,
	query: { [key: string]: unknown }
): Promise<RSVPEventWithId> =>
	await eventCollection()
		.findOneAndUpdate(
			{ _id: eventId },
			{
				$set: query
			},
			{ upsert: true, returnDocument: 'after' }
		)
		.then((updatedEvent) => {
			if (!updatedEvent) {
				throw `No event found to update, ${eventId}`;
			}
			return updatedEvent;
		});

export const getEventById = async (eventId: ObjectId) =>
	await eventCollection().findOne({
		_id: eventId
	});

export const getEvent = async (
	chatId: number,
	lastBotMessageId: number
): Promise<WithId<RSVPEvent> | null> =>
	await eventCollection().findOne({
		chatId: chatId,
		lastMessageId: lastBotMessageId
	});
