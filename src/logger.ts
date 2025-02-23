import { getLogger, configure, getConsoleSink } from '@logtape/logtape';

await configure({
	sinks: { console: getConsoleSink() },
	loggers: [{ category: 'app', lowestLevel: 'debug', sinks: ['console'] }]
});

export const logger = getLogger(['app']);

logger.debug`Configured logger`;
