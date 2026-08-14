import type {
  Problem,
  ProblemCode,
  ResolveRequestBody,
  ResolveResponse,
  SetupErrorPayload,
  SetupEvent,
  StartSetupBody,
  VerifyRequestBody,
  VerifyResponse,
} from './types';

const BASE = '/crr-configurator/api/v1';

export class ServiceError extends Error {
  constructor(public problem: Problem) {
    super(problem.title + (problem.detail ? `: ${problem.detail}` : ''));
    this.name = 'ServiceError';
  }
  get code(): ProblemCode | undefined {
    return this.problem.code;
  }
}

export class SetupFailedError extends Error {
  constructor(public payload: SetupErrorPayload) {
    super(payload.message);
    this.name = 'SetupFailedError';
  }
  get code(): ProblemCode {
    return this.payload.code;
  }
}

export type ClientOptions = { token: string; signal?: AbortSignal };

export async function verify(body: VerifyRequestBody, { token, signal }: ClientOptions): Promise<VerifyResponse> {
  const response = await fetch(`${BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw await asServiceError(response);
  return (await response.json()) as VerifyResponse;
}

export async function resolve(body: ResolveRequestBody, { token, signal }: ClientOptions): Promise<ResolveResponse> {
  const response = await fetch(`${BASE}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw await asServiceError(response);
  return (await response.json()) as ResolveResponse;
}

export async function* startSetup(body: StartSetupBody, { token, signal }: ClientOptions): AsyncIterable<SetupEvent> {
  const response = await fetch(`${BASE}/replication-setups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw await asServiceError(response);
  if (!response.body) throw new Error('replication-setups stream has no body');

  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of asAsyncIterable(response.body)) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line) yield JSON.parse(line) as SetupEvent;
      newline = buffer.indexOf('\n');
    }
  }
  const rest = (buffer + decoder.decode()).trim();
  if (rest) yield JSON.parse(rest) as SetupEvent;
}

async function asServiceError(response: Response): Promise<Error> {
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('json')) {
    try {
      return new ServiceError((await response.json()) as Problem);
    } catch {
      // fall through
    }
  }
  return new Error(`HTTP ${response.status} ${response.statusText}`);
}

// Normalises the two shapes a fetch Response.body can take — a WHATWG
// ReadableStream (getReader) or a Node Readable (async iterable) — so
// the caller can stay on a single `for await` loop.
async function* asAsyncIterable(body: unknown): AsyncIterable<Uint8Array> {
  const withReader = body as { getReader?: () => ReadableStreamDefaultReader<Uint8Array> };
  if (typeof withReader.getReader === 'function') {
    const reader = withReader.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        if (value) yield value;
      }
    } finally {
      reader.releaseLock();
    }
  } else {
    yield* body as AsyncIterable<Uint8Array>;
  }
}
