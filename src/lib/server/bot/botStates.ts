import type { AvailableLocale } from '$lib/i18n/translations';
import { translate } from '../../i18n/translate.ts';
import { RSVPEventState } from '../db/types.ts';

interface BotState {
	state: RSVPEventState;
	nextState: RSVPEventState;
	messageToSend: (locale: AvailableLocale) => string;
}

export const newEventState: BotState = {
	state: RSVPEventState.NewEvent,
	nextState: RSVPEventState.NewEvent,
	messageToSend: (locale: AvailableLocale) => translate('event.state.setName', locale)
};

export const setNameState: BotState = {
	state: RSVPEventState.NewEvent,
	nextState: RSVPEventState.NameSet,
	messageToSend: (locale: AvailableLocale) => translate('event.state.setDescription', locale)
};

export const setDescriptionState: BotState = {
	state: RSVPEventState.NameSet,
	nextState: RSVPEventState.DescriptionSet,
	messageToSend: (locale: AvailableLocale) => translate('event.state.setPlusOne', locale)
};

export const setPlusOneState: BotState = {
	state: RSVPEventState.DescriptionSet,
	nextState: RSVPEventState.PlusOneSet,
	messageToSend: (locale: AvailableLocale) => translate('event.state.setParticipantLimit', locale)
};

export const setParticipantLimitState: BotState = {
	state: RSVPEventState.PlusOneSet,
	nextState: RSVPEventState.ParticipantLimitSet,
	messageToSend: (locale: AvailableLocale) => translate('event.state.setWaitlist', locale)
};

export const setWaitlist: BotState = {
	state: RSVPEventState.ParticipantLimitSet,
	nextState: RSVPEventState.Polling,
	messageToSend: () => ''
};
