/* Hallmark · utility: jsonValidator · spec: spec_provider_testing.md (§11.3) */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawCleaned?: string;
}

/**
 * Strips markdown code block fences (e.g. ```json ... ``` or ``` ...) and leading/trailing whitespace.
 */
export function cleanJsonMarkdown(rawText: string): string {
  if (!rawText) return '';
  let cleaned = rawText.trim();

  // Strip leading code block fence
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  }

  // Strip trailing code block fence
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }

  return cleaned.trim();
}

/**
 * Safely parses and validates JSON output from LLM persona responses.
 *
 * @param rawText Raw LLM completion text (may contain markdown code blocks)
 * @param validator Optional custom validator function returning boolean
 * @returns ValidationResult with success boolean, parsed data, or error message
 */
export function parseAndValidateJson<T = unknown>(
  rawText: string,
  validator?: (data: unknown) => boolean
): ValidationResult<T> {
  const cleaned = cleanJsonMarkdown(rawText);

  if (!cleaned) {
    return {
      success: false,
      error: 'Empty response body provided for JSON validation.',
    };
  }

  try {
    const parsed = JSON.parse(cleaned) as T;

    if (validator && !validator(parsed)) {
      return {
        success: false,
        data: parsed,
        rawCleaned: cleaned,
        error: 'JSON structure parsed successfully but failed custom schema validation.',
      };
    }

    return {
      success: true,
      data: parsed,
      rawCleaned: cleaned,
    };
  } catch (err: any) {
    return {
      success: false,
      rawCleaned: cleaned,
      error: `SyntaxError parsing JSON: ${err?.message || 'Invalid JSON syntax'}`,
    };
  }
}
