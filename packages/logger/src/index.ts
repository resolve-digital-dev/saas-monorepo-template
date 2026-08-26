import { pino, type Logger as PinoLogger, type LoggerOptions } from 'pino';

/**
 * Pino's level names, in severity order. Exported so that other packages
 * validate against the same list instead of maintaining a copy that drifts.
 */
export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export function isLogLevel(value: string | undefined): value is LogLevel {
  return value !== undefined && (LOG_LEVELS as readonly string[]).includes(value);
}

/**
 * This package is the single owner of `LOG_LEVEL`.
 *
 * It used to be declared in the backend's zod schema *and* read raw from
 * `process.env` here, so the validation was decorative: an invalid value
 * sailed past the schema's `.optional()` and blew up inside pino with a stack
 * trace instead of a message anyone could act on.
 */
export function resolveLogLevel(
  raw: string | undefined = process.env.LOG_LEVEL,
  isProduction: boolean = process.env.NODE_ENV === 'production',
): LogLevel {
  if (raw === undefined || raw === '') return isProduction ? 'info' : 'debug';
  if (!isLogLevel(raw)) {
    throw new Error(`Invalid LOG_LEVEL "${raw}". Expected one of: ${LOG_LEVELS.join(', ')}.`);
  }
  return raw;
}

export function createLogger(overrides: LoggerOptions = {}): PinoLogger {
  const isProduction = process.env.NODE_ENV === 'production';
  const level = resolveLogLevel(process.env.LOG_LEVEL, isProduction);

  const options: LoggerOptions = {
    level,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.headers["set-cookie"]',
        'req.body.password',
        'req.body.token',
        'res.headers["set-cookie"]',
      ],
      censor: '[redacted]',
    },
    ...overrides,
  };

  /**
   * `pino-pretty` is a devDependency and must never be required in production.
   * Resolving it lazily keeps it out of the production image entirely.
   */
  // `silent` also skips it: the transport spawns a worker thread, which is
  // pure overhead in a test run and a common cause of hanging teardowns.
  if (!isProduction && level !== 'silent' && overrides.transport === undefined) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
      },
    };
  }

  return pino(options);
}

export const logger: PinoLogger = createLogger();

export type Logger = PinoLogger;
