import { renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from '../../../../../QueryClientProvider';
import { ServiceError } from '../crrFetch';
import type { VerifyRequestBody } from '../types';
import { useVerifyMutation } from '../useVerifyMutation';

const VERIFY_URL = '/crr-configurator/api/v1/verify';
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

const VERIFY_BODY: VerifyRequestBody = {
  destinationConnection: {
    mode: 'management-network',
    baseUrl: 'https://cluster.example:8443',
    adminUser: 'scality',
    adminPassword: 'test',
  },
  destinationCertificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
};

describe('useVerifyMutation', () => {
  it('yields the VerifyResponse on success', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(ctx.json({ ok: true, mode: 'management-network', instanceName: 'ageless-valley' })),
      ),
    );
    const { result } = renderHook(() => useVerifyMutation(), { wrapper: buildWrapper() });
    result.current.mutate(VERIFY_BODY);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      ok: true,
      mode: 'management-network',
      instanceName: 'ageless-valley',
    });
  });

  it('surfaces a ServiceError when the configurator returns problem+json', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.json({
            type: 'about:blank',
            title: 'Invalid destination certificate',
            status: 400,
            code: 'DestinationCertificateInvalid',
          }),
        ),
      ),
    );
    const { result } = renderHook(() => useVerifyMutation(), { wrapper: buildWrapper() });
    result.current.mutate(VERIFY_BODY);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ServiceError);
    expect(result.current.error).toMatchObject({
      problem: { code: 'DestinationCertificateInvalid', status: 400 },
    });
  });
});
