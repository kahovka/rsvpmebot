export const availableLocales = ['en', 'ru'] as const;
export type AvailableLocale = (typeof availableLocales)[number];

export const parseLocale = (userLocale: string | undefined): AvailableLocale =>
	userLocale && userLocale in availableLocales ? (userLocale as AvailableLocale) : 'en';

export const translations: { [key: string]: { [locale: string]: string } } = {
	'event.state.setName': {
		en: 'What is your event called?',
		ru: 'Как называется ваше мероприятие?'
	},
	'event.state.setDescription': {
		en: 'Does your event have some description?',
		ru: 'У вашего мероприятия есть какие-нибудь подробности?'
	},
	'event.state.setPlusOne': {
		en: 'Can people bring someone along? Use ✅ for yes, anything else for no',
		ru: 'Можно ли прийти с кем-то? Да - ✅, нет - любой иной символ'
	},
	'event.state.setParticipantLimit': {
		en: 'Does you event have participant limit? [Enter number of participants, 0 or anything for no]',
		ru: 'Ограничено ли количество участников вашего мероприятия? [Укажите число участников, или  0, чтобы отменить лимит если лимит не требуется]'
	},
	'event.state.setWaitlist': {
		en: 'Does you event have a waiting list? Use ✅ for yes, anything else for no',
		ru: 'Есть ли у вашего мероприятия лист ожидания? Да - ✅, нет - любой иной символ'
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
	'event.messages.participantAlreadyExists': {
		en: 'You are already on the list ;)',
		ru: 'Мы вас уже записали ;)'
	},
	'buttons.yes': { en: 'Yes', ru: '👍' },
	'buttons.plusOne': { en: '+1', ru: '+1' },
	'buttons.no': { en: 'No', ru: '❌' }
};
