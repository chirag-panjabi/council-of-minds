type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  level: LogLevel;
  message: string;
  data?: unknown;
}

/**
 * A safe logger utility that only logs in development mode.
 * Prevents sensitive information from leaking into production console.
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private redact(value: unknown): unknown {
    if (value === undefined) return undefined;
    if (typeof value === 'string') {
      return value
        .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
        .replace(/Bearer\s+[a-zA-Z0-9\-\._~+/]+=*/gi, 'Bearer [REDACTED]');
    }
    if (typeof value === 'object' && value !== null) {
      try {
        const stringified = JSON.stringify(value);
        const redacted = stringified
          .replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED]')
          .replace(/Bearer\s+[a-zA-Z0-9\-\._~+/]+=*/gi, 'Bearer [REDACTED]');
        return JSON.parse(redacted);
      } catch {
        return '[Unserializable or Redacted Object]';
      }
    }
    return value;
  }

  private logIfDev(options: LogOptions) {
    if (!this.isDevelopment) {
      return;
    }

    const { level, message, data } = options;
    const timestamp = new Date().toISOString();
    const redactedMessage = this.redact(message) as string;
    const redactedData = this.redact(data);
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${redactedMessage}`;

    switch (level) {
      case 'info':
        if (redactedData !== undefined) {
          console.info(formattedMessage, redactedData);
        } else {
          console.info(formattedMessage);
        }
        break;
      case 'warn':
        if (redactedData !== undefined) {
          console.warn(formattedMessage, redactedData);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case 'error':
        if (redactedData !== undefined) {
          console.error(formattedMessage, redactedData);
        } else {
          console.error(formattedMessage);
        }
        break;
      case 'debug':
        if (redactedData !== undefined) {
          console.debug(formattedMessage, redactedData);
        } else {
          console.debug(formattedMessage);
        }
        break;
      default:
        console.log(formattedMessage, redactedData ?? '');
    }
  }

  info(message: string, data?: unknown) {
    this.logIfDev({ level: 'info', message, data });
  }

  warn(message: string, data?: unknown) {
    this.logIfDev({ level: 'warn', message, data });
  }

  error(message: string, data?: unknown) {
    this.logIfDev({ level: 'error', message, data });
  }

  debug(message: string, data?: unknown) {
    this.logIfDev({ level: 'debug', message, data });
  }
}

export const logger = new Logger();
