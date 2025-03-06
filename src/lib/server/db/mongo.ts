import { MongoClient } from 'npm:mongodb';
import { env } from '$env/dynamic/private';
import { logger } from '../../../logger.ts';
import { RSVPEvent } from './types.ts';

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

export const getEvent = async (chatId: number, lastBotMessageId: number) =>
	await eventCollection().findOne({
		chatId: chatId,
		lastMessageId: lastBotMessageId
	});
