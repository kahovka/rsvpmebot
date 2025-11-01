export const availableLocales = ['en', 'ru'] as const;
export type AvailableLocale = (typeof availableLocales)[number];

export const parseLocale = (userLocale: string | undefined): AvailableLocale =>
	userLocale && userLocale in availableLocales ? (userLocale as AvailableLocale) : 'en';

export const translations: { [key: string]: { [locale: string]: string } } = {
	'event.state.new': { en: 'What is your event called?', ru: 'Как называется ваше мероприятие?' },
	'event.state.setName': {
		en: 'Does your event have some description?',
		ru: 'У вашего мероприятия есть какие-нибудь подробности?'
	},
	'event.state.setDescription': {
		en: 'Can people bring someone along?',
		ru: 'Можно ли прийти с кем-то?'
	},
	'event.state.setPlusOne': {
		en: 'Does you event have participant limit? [Enter number of participants, 0 or anything for no]',
		ru: 'Ограничено ли количество участников вашего мероприятия? [Укажите число участников, или  0, чтобы отменить лимит если лимит не требуется]'
	},
	'event.state.setWaitlist': {
		en: 'Does you event have a waiting list?',
		ru: 'Есть ли у вашего мероприятия лист ожидания?'
	},
	'event.getDescription.participantLimit': { en: 'Max Participants:', ru: 'Максимум участников:' },
	'event.getDescription.particpants': { en: 'Participants:', ru: 'Участники:' },
	'event.getDescription.waiting': { en: 'Waiting list', ru: 'Очередь' },

	'event.messages.eventIsFull': {
		en: 'This event is full, try to come back later ;)',
		ru: 'Все места на это мероприятие заняты, попробуйте вернуться позже ;)'
	},
	'event.messages.noPlusOnePossible': {
		en: 'You can only bring someone if you come yourself ;)',
		ru: 'Привести кого-то можно только придя самому ;)'
	},

	'buttons.yes': { en: 'Yes', ru: '👍' },
	'buttons.plusOne': { en: '+1', ru: '+1' },
	'buttons.no': { en: 'No', ru: '❌' }
};
