import { act, renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from '../../../../QueryClientProvider';
import { ServiceError } from '../api/crrConfiguratorClient';
import type { ConnectionRequestBody } from '../api/types';
import { useDestinationConnectionMutation } from './useDestinationConnectionMutation';

const CONNECTIONS_URL = '/crr-configurator/api/v1/destination/connections';
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

const CONNECTION_BODY: ConnectionRequestBody = {
  destinationConnection: {
    baseDomain: 'crr-dest.artesca.local',
    adminUser: 'scality',
    adminPassword: 'test',
  },
  destinationCertificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
};

const CONNECTION = {
  connectionId: 'sealed-handle',
  expiresAt: '2026-10-07T14:00:00Z',
  endpoints: [{ hostname: 's3.crr-dest.artesca.local', locationName: 'us-east-1' }],
  accounts: [{ name: 'finance', id: '123456789012' }],
};

describe('useDestinationConnectionMutation', () => {
  it('exposes the connection and what the destination offers on success', async () => {
    server.use(rest.post(CONNECTIONS_URL, (_req, res, ctx) => res(ctx.json(CONNECTION))));

    const { result } = renderHook(() => useDestinationConnectionMutation(), {
      wrapper: buildWrapper(),
    });
    act(() => result.current.mutate(CONNECTION_BODY));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(CONNECTION);
  });

  it('exposes a ServiceError when the configurator returns problem+json', async () => {
    server.use(
      rest.post(CONNECTIONS_URL, (_req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(
            JSON.stringify({
              type: 'about:blank',
              title: 'Invalid destination certificate',
              status: 400,
              code: 'DestinationCertificateInvalid',
            }),
          ),
        ),
      ),
    );

    const { result } = renderHook(() => useDestinationConnectionMutation(), {
      wrapper: buildWrapper(),
    });
    act(() => result.current.mutate(CONNECTION_BODY));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ServiceError);
    expect(result.current.error).toMatchObject({
      problem: { code: 'DestinationCertificateInvalid' },
    });
  });
});
