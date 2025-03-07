import { describe, expect, test } from 'vitest';
import { getEventDescriptionHtml } from '../../../lib/server/bot/utils.ts';
import { fakeStaticCompletedEvent } from '../../fixtures/eventsFixtures.ts';

describe('utils tests', () => {
	test('simple test', () => {
		expect(getEventDescriptionHtml(fakeStaticCompletedEvent)).toMatchSnapshot();
	});
});
