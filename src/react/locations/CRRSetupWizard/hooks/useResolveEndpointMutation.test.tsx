import { act, renderHook, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { QueryClient } from 'react-query';
import { QueryClientProvider } from '../../../../QueryClientProvider';
import { ServiceError } from '../api/crrConfiguratorClient';
import type { ResolveRequestBody } from '../api/types';
import { useResolveEndpointMutation } from './useResolveEndpointMutation';

const RESOLVE_URL = '/crr-configurator/api/v1/resolve';
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

const RESOLVE_BODY: ResolveRequestBody = {
  s3Endpoint: 'https://s3.crr-dest.artesca.local',
  destinationCertificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
};

describe('useResolveEndpointMutation', () => {
  it('reports whether the endpoint resolves', async () => {
    server.use(rest.post(RESOLVE_URL, (_req, res, ctx) => res(ctx.json({ resolvable: true }))));

    const { result } = renderHook(() => useResolveEndpointMutation(), { wrapper: buildWrapper() });
    act(() => result.current.mutate(RESOLVE_BODY));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ resolvable: true });
  });

  it('exposes a ServiceError when the configurator returns problem+json', async () => {
    server.use(
      rest.post(RESOLVE_URL, (_req, res, ctx) =>
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

    const { result } = renderHook(() => useResolveEndpointMutation(), { wrapper: buildWrapper() });
    act(() => result.current.mutate(RESOLVE_BODY));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ServiceError);
    expect(result.current.error).toMatchObject({ problem: { code: 'DestinationCertificateInvalid' } });
  });
});
