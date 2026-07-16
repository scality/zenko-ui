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
  it('exposes the VerifyResponse when the configurator accepts the destination', async () => {
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

  it('surfaces the ARTESCA problem code when the destination is rejected', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
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
    const { result } = renderHook(() => useVerifyMutation(), { wrapper: buildWrapper() });
    result.current.mutate(VERIFY_BODY);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ServiceError);
    expect(result.current.error).toMatchObject({
      problem: { code: 'DestinationCertificateInvalid' },
    });
  });

  it('carries unresolvedHosts so the DNS-fallback modal can prompt for overrides', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(
          ctx.status(502),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(
            JSON.stringify({
              type: 'about:blank',
              title: 'DNS resolution failed',
              status: 502,
              code: 'DestinationDnsResolutionFailed',
              unresolvedHosts: ['cluster-b.internal', 's3.cluster-b.internal'],
            }),
          ),
        ),
      ),
    );
    const { result } = renderHook(() => useVerifyMutation(), { wrapper: buildWrapper() });
    result.current.mutate(VERIFY_BODY);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({
      problem: {
        code: 'DestinationDnsResolutionFailed',
        unresolvedHosts: ['cluster-b.internal', 's3.cluster-b.internal'],
      },
    });
  });

  it('does not synthesise a ServiceError when the configurator replies with a bare error', async () => {
    server.use(rest.post(VERIFY_URL, (_req, res, ctx) => res(ctx.status(503), ctx.text('backend down'))));
    const { result } = renderHook(() => useVerifyMutation(), { wrapper: buildWrapper() });
    result.current.mutate(VERIFY_BODY);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).not.toBeInstanceOf(ServiceError);
  });
});
