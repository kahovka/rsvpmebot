import { RSVPEventState } from '../db/types.ts';

interface BotState {
	state: RSVPEventState;
	nextState: RSVPEventState;
	messageToSend: string;
}

export const newEventState: BotState = {
	state: RSVPEventState.NewEvent,
	nextState: RSVPEventState.NewEvent,
	messageToSend: 'What is your event called?'
};

export const settingNameState: BotState = {
	state: RSVPEventState.NewEvent,
	nextState: RSVPEventState.NameSet,
	messageToSend: 'Does your event have some description?'
};

export const settingDescriptionState: BotState = {
	state: RSVPEventState.NameSet,
	nextState: RSVPEventState.DescriptionSet,
	messageToSend: 'Does you event have participant limit?'
};

export const settingParticipantLimitState: BotState = {
	state: RSVPEventState.DescriptionSet,
	nextState: RSVPEventState.Polling,
	messageToSend: ''
};
