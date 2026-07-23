import { getProviderCapabilities } from './registry';
import type { ProviderId } from '../schemas/provider';

export type CloudValidationStatus =
  | 'valid'
  | 'invalid_key'
  | 'quota_exceeded'
  | 'connectivity_error'
  | 'provider_error';

export interface CloudValidationResult {
  status: CloudValidationStatus;
  retryable: boolean;
}

const validationStatuses: ReadonlySet<CloudValidationStatus> = new Set<CloudValidationStatus>([
  'valid',
  'invalid_key',
  'quota_exceeded',
  'connectivity_error',
  'provider_error',
]);

function isValidationResult(value: unknown): value is CloudValidationResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.status === 'string' &&
    validationStatuses.has(candidate.status as CloudValidationStatus) &&
    typeof candidate.retryable === 'boolean'
  );
}

/**
 * Validates a cloud key through the same-origin proxy. This module deliberately
 * has no storage dependency: callers may persist a key only after `valid`.
 */
export async function validateCloudProvider(
  providerId: ProviderId,
  apiKey: string,
  signal?: AbortSignal,
): Promise<CloudValidationResult> {
  if (getProviderCapabilities(providerId).capabilities.transport !== 'cloud-proxy') {
    return { status: 'provider_error', retryable: false };
  }

  if (!apiKey.trim()) {
    return { status: 'invalid_key', retryable: false };
  }

  try {
    const response = await fetch(`/api/proxy/${providerId}/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    });
    const body: unknown = await response.json().catch(() => null);

    if (isValidationResult(body)) {
      return body;
    }

    return { status: 'provider_error', retryable: response.status >= 500 };
  } catch {
    return { status: 'connectivity_error', retryable: true };
  }
}
