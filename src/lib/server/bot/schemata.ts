import { z } from 'zod';

const userSchema = z.object({
	id: z.number(),
	first_name: z.string(),
	username: z.string().optional(),
	language_code: z.string().optional()
});

const chatSchema = z.object({
	id: z.number()
});

export const BotTextMessageSchema = z.object({
	reply_to_message: z
		.object({
			message_id: z.number()
		})
		.optional(),
	message_id: z.number(),
	message_thread_id: z.number().optional(),
	from: userSchema,
	chat: chatSchema,
	text: z.string()
});

export const BotCallbackQuerySchema = z.object({
	from: userSchema,
	message: BotTextMessageSchema,
	data: z.string()
});

export type BotTextMessage = z.infer<typeof BotTextMessageSchema>;

export type BotCallbackQuery = z.infer<typeof BotCallbackQuerySchema>;
