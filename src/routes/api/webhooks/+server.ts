import { RequestHandler } from '@sveltejs/kit';
import { logger } from '../../../logger.ts';
import { bot } from '$lib/server/bot/bot.ts';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const requestBody = await request.json();
		logger.info('Received request {text}', { text: JSON.stringify(requestBody) });
		bot.processUpdate(requestBody);
		return new Response('', { status: 200 });
	} catch (e) {
		console.error(e);
		return new Response('', { status: 500 });
	}
};
