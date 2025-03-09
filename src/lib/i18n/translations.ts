export const availableLocales = ['en', 'ru'] as const;
export type AvailableLocales = (typeof availableLocales)[number];

export const translations: { [key: string]: { [locale: string]: string } } = {
	'event.state.new': { en: 'What is your event called?', ru: 'What is your event called?' },
	'event.state.setName': {
		en: 'Does your event have some description?',
		ru: 'Does your event have some description?'
	},
	'event.state.setDescription': {
		en: 'Does you event have participant limit?',
		ru: 'Does you event have participant limit?'
	},

	'event.getDescription.partiticpants': { en: 'Participants', ru: 'Participants' },
	'event.getDescription.waiting': { en: 'Participants', ru: 'Participants' },
	'buttons.yes': { en: 'Yes', ru: '👍' },
	'buttons.plusOne': { en: '+1', ru: '+1' },
	'buttons.no': { en: 'No', ru: '❌' }
};
