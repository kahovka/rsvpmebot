import { bot } from '$lib/bot.ts';
import { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const requestBody = await request.json();
		console.log('Received request', requestBody);
		bot.processUpdate(requestBody);
		return new Response('', { status: 200 });
	} catch (e) {
		console.error(e);
		return new Response('', { status: 500 });
	}
};
