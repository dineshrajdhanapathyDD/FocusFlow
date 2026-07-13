type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

class Logger {
  private requestId?: string;
  private userId?: string;

  setContext(requestId?: string, userId?: string) {
    this.requestId = requestId;
    this.userId = userId;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.requestId,
      userId: this.userId,
      data,
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case 'ERROR':
        console.error(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('DEBUG', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('WARN', message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log('ERROR', message, data);
  }
}

export const logger = new Logger();
