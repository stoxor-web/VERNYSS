type LogContext = Record<string, string | number | boolean | null>;

const FORBIDDEN_KEYS = /salary|income|expense|wealth|amount|tax|address|token|password|asset|rent|mortgage/i;

function sanitize(context: LogContext | undefined): LogContext | undefined {
  if (context === undefined) return undefined;
  const clean: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (!FORBIDDEN_KEYS.test(key)) clean[key] = value;
  }
  return clean;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (import.meta.env.DEV) console.debug(message, sanitize(context));
  },
  error(message: string, context?: LogContext): void {
    console.error(message, sanitize(context));
  }
};
