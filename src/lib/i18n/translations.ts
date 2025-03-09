export const availableLocales = ['en', 'ru'] as const;
export type AvailableLocales = (typeof availableLocales)[number];

export const translations: { [key: string]: { [locale: string]: string } } = {
	'event.state.new': { en: 'What is your event called?', ru: 'Как называется ваше мероприятие?' },
	'event.state.setName': {
		en: 'Does your event have some description?',
		ru: 'У вашего мероприятия есть какие-нибудь подробности?'
	},
	'event.state.setDescription': {
		en: 'Does you event have participant limit?',
		ru: 'Ограничено ли количество участников вашего мероприятия?'
	},
	'event.state.setWaitlist': {
		en: 'Does you event have a waiting list? [y/n]',
		ru: 'Есть ли у вашего мероприятия лист ожидания? [да/нет]'
	},

	'event.getDescription.partiticpants': { en: 'Participants:', ru: 'Участники:' },
	'event.getDescription.waiting': { en: 'Waiting list', ru: 'Очередь' },
	'buttons.yes': { en: 'Yes', ru: '👍' },
	'buttons.plusOne': { en: '+1', ru: '+1' },
	'buttons.no': { en: 'No', ru: '❌' }
};
