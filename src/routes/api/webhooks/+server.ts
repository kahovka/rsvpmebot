import { bot } from '$lib/bot.ts';

export async function POST({ request }) {
	try {
		const requestBody = await request.json();
		bot.processUpdate(requestBody);
		console.log(requestBody);
		return new Response('', { status: 200 });
	} catch (e) {
		console.error(e);
		return new Response('', { status: 500 });
	}
}
