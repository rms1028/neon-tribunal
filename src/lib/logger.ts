type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  context?: Record<string, unknown>;
}

const SERVICE_NAME = "neon-court";

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/** 프로덕션에서는 INFO 이상만 출력 */
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "INFO" : "DEBUG";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    message,
    ...(context && { context }),
  };

  const json = JSON.stringify(entry);

  switch (level) {
    case "ERROR":
      console.error(json);
      break;
    case "WARN":
      console.warn(json);
      break;
    case "DEBUG":
      console.debug(json);
      break;
    default:
      console.log(json);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log("DEBUG", message, context),
  info: (message: string, context?: Record<string, unknown>) => log("INFO", message, context),
  warn: (message: string, context?: Record<string, unknown>) => log("WARN", message, context),
  error: (message: string, context?: Record<string, unknown>) => log("ERROR", message, context),
};
