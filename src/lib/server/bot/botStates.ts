import { translate } from '../../i18n/translate.ts';
import { RSVPEventState } from '../db/types.ts';

interface BotState {
	state: RSVPEventState;
	nextState: RSVPEventState;
	messageToSend: (locale: string) => string;
}

export const newEventState: BotState = {
	state: RSVPEventState.NewEvent,
	nextState: RSVPEventState.NewEvent,
	messageToSend: (locale: string) => translate('event.state.new', locale)
};

export const setNameState: BotState = {
	state: RSVPEventState.NewEvent,
	nextState: RSVPEventState.NameSet,
	messageToSend: (locale: string) => translate('event.state.setName', locale)
};

export const setDescriptionState: BotState = {
	state: RSVPEventState.NameSet,
	nextState: RSVPEventState.DescriptionSet,
	messageToSend: (locale: string) => translate('event.state.setDescription', locale)
};

export const setPlusOneState: BotState = {
	state: RSVPEventState.DescriptionSet,
	nextState: RSVPEventState.PlusOneSet,
	messageToSend: (locale: string) => translate('event.state.setPlusOne', locale)
};

export const setParticipantLimitState: BotState = {
	state: RSVPEventState.PlusOneSet,
	nextState: RSVPEventState.ParticipantLimitSet,
	messageToSend: (locale: string) => translate('event.state.setWaitlist', locale)
};

export const setWaitlist: BotState = {
	state: RSVPEventState.ParticipantLimitSet,
	nextState: RSVPEventState.Polling,
	messageToSend: () => ''
};
