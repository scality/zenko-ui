import { act, renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from '../../../../QueryClientProvider';
import { SetupFailedError } from '../api/crrConfiguratorClient';
import type { StartSetupBody } from '../api/types';
import { useCRRConfigurationSetupMutation } from './useCRRConfigurationSetupMutation';

const STREAM_URL = '/crr-configurator/api/v1/replication-setups';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const buildWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const START_BODY: StartSetupBody = {
  destinationConnection: {
    baseDomain: 'crr-dest.artesca.local',
    s3Endpoint: 'https://s3.crr-dest.artesca.local',
    adminUser: 'scality',
    adminPassword: 'test',
  },
  destinationCertificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
  destinationAccount: { mode: 'create', name: 'crr-account' },
  targetBucket: 'target-bucket',
};

const ndjson = (...lines: unknown[]) => `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`;

const RESULT = {
  endpoint: 'https://cluster.example:8443',
  stsEndpoint: 'https://cluster.example:8443/sts',
  accessKey: 'AKIA…',
  secretKey: 'secret…',
  roleArn: 'arn:aws:iam::123456789012:role/crr-replication-role',
  targetBucket: 'target-bucket',
};

describe('useCRRConfigurationSetupMutation', () => {
  it('exposes the SetupResult and the full event trace on success', async () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.set('Content-Type', 'application/x-ndjson'),
          ctx.body(
            ndjson(
              { event: 'step.started', step: 'authenticate', at: '2026-07-16T13:00:00Z' },
              { event: 'step.completed', step: 'authenticate', at: '2026-07-16T13:00:01Z' },
              { event: 'setup.completed', at: '2026-07-16T13:00:02Z', result: RESULT },
            ),
          ),
        ),
      ),
    );

    const { result } = renderHook(() => useCRRConfigurationSetupMutation(), {
      wrapper: buildWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(START_BODY).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(RESULT);
    expect(result.current.events.map((e) => e.event)).toEqual(['step.started', 'step.completed', 'setup.completed']);
  });

  it('exposes a SetupFailedError with the ARTESCA problem code on setup.failed', async () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.set('Content-Type', 'application/x-ndjson'),
          ctx.body(
            ndjson({
              event: 'setup.failed',
              at: '2026-07-16T13:00:01Z',
              error: { code: 'AssumeRoleFailed', message: 'STS refused the id_token' },
            }),
          ),
        ),
      ),
    );

    const { result } = renderHook(() => useCRRConfigurationSetupMutation(), {
      wrapper: buildWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(START_BODY).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(SetupFailedError);
    expect((result.current.error as SetupFailedError).code).toBe('AssumeRoleFailed');
  });

  it('aborts a mid-flight stream and returns the mutation to idle without an error state', async () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.delay(500)),
      ),
    );

    const { result } = renderHook(() => useCRRConfigurationSetupMutation(), {
      wrapper: buildWrapper(),
    });
    act(() => result.current.mutate(START_BODY));
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    act(() => result.current.cancel());

    await waitFor(() => expect(result.current.isIdle).toBe(true));
    expect(result.current.events).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('clears the events and returns the mutation to idle when the caller cancels', async () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(
          ctx.status(200),
          ctx.set('Content-Type', 'application/x-ndjson'),
          ctx.body(
            ndjson(
              { event: 'step.started', step: 'authenticate', at: '2026-07-16T13:00:00Z' },
              { event: 'setup.completed', at: '2026-07-16T13:00:02Z', result: RESULT },
            ),
          ),
        ),
      ),
    );

    const { result } = renderHook(() => useCRRConfigurationSetupMutation(), {
      wrapper: buildWrapper(),
    });
    await act(async () => {
      await result.current.mutateAsync(START_BODY).catch(() => undefined);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    act(() => result.current.cancel());

    await waitFor(() => expect(result.current.isIdle).toBe(true));
    expect(result.current.events).toEqual([]);
    expect(result.current.data).toBeUndefined();
  });
});
