/**
 * Sanitizes diagnostic strings and error messages by redacting sensitive data
 * such as API keys, Bearer tokens, and URL parameters before returning them to client or logging.
 */
export function redactSensitiveData(text: string | null | undefined): string {
  if (!text) return '';

  let sanitized = String(text);

  // Redact Gemini URL query parameters: ?key=AIzaSy... or &key=AIzaSy...
  sanitized = sanitized.replace(/([?&]key=)[A-Za-z0-9_-]+/gi, '$1[REDACTED_API_KEY]');

  // Redact OpenAI API keys: sk-proj-... or sk-...
  sanitized = sanitized.replace(/sk-(proj-)?[A-Za-z0-9_-]{20,}/g, 'sk-[REDACTED_API_KEY]');

  // Redact Anthropic API keys: sk-ant-...
  sanitized = sanitized.replace(/sk-ant-[A-Za-z0-9_-]{20,}/g, 'sk-ant-[REDACTED_API_KEY]');

  // Redact general Bearer authorization headers/tokens
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]');

  // Redact general x-api-key patterns in logs or error strings
  sanitized = sanitized.replace(/(x-api-key:\s*)[A-Za-z0-9_-]+/gi, '$1[REDACTED_API_KEY]');

  return sanitized;
}
