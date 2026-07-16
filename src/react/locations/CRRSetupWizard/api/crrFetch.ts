import type { Problem } from './types';

const BASE = '/crr-configurator/api/v1';

// Thrown when the configurator returns an RFC 7807 problem+json.
// Callers narrow the failure by reading `problem.code`, and — for
// DNS-fallback — `problem.unresolvedHosts`.
export class ServiceError extends Error {
  constructor(public problem: Problem) {
    super(problem.title + (problem.detail ? `: ${problem.detail}` : ''));
    this.name = 'ServiceError';
  }
}

// POSTs a JSON body to the configurator, forwarding the browser's
// Keycloak session cookie via `credentials: 'include'`. On non-2xx,
// parses the RFC 7807 body and throws `ServiceError`; on any other
// error, throws a plain `Error` carrying the HTTP status line.
export async function postJSON<TReq, TResp>(path: string, body: TReq): Promise<TResp> {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw await asServiceError(response);
  }
  return (await response.json()) as TResp;
}

async function asServiceError(response: Response): Promise<Error> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('json')) {
    try {
      const problem = (await response.json()) as Problem;
      return new ServiceError(problem);
    } catch {
      // fall through to the generic error
    }
  }
  return new Error(`HTTP ${response.status} ${response.statusText}`);
}
