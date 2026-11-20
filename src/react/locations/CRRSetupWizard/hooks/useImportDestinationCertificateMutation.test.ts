import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import type { ZenkoCR } from '../../../truststore/Truststore';
import {
  isCertificateAlreadyImported,
  useImportDestinationCertificateMutation,
} from './useImportDestinationCertificateMutation';

const CERT = '-----BEGIN CERTIFICATE-----\ndest\n-----END CERTIFICATE-----';
const withCerts = (certs: string[]): ZenkoCR => ({
  spec: { egress: { extraCACerts: certs.map((c) => ({ 'ca.crt': c })) } },
});

describe('isCertificateAlreadyImported', () => {
  it('is false when the truststore has no egress configuration yet', () => {
    expect(isCertificateAlreadyImported(undefined, CERT)).toBe(false);
    expect(isCertificateAlreadyImported({ spec: {} }, CERT)).toBe(false);
  });

  it('is false when other certificates are present but not this one', () => {
    expect(isCertificateAlreadyImported(withCerts(['some-other-cert']), CERT)).toBe(false);
  });

  it('is true when the exact certificate is already in the truststore', () => {
    expect(isCertificateAlreadyImported(withCerts(['some-other-cert', CERT]), CERT)).toBe(true);
  });

  it('ignores trailing-whitespace / line-ending differences so a re-import stays a no-op', () => {
    expect(isCertificateAlreadyImported(withCerts([CERT]), `${CERT}\n`)).toBe(true);
    expect(isCertificateAlreadyImported(withCerts([`${CERT}\n`]), CERT)).toBe(true);
    expect(isCertificateAlreadyImported(withCerts([CERT]), CERT.replace(/\n/g, '\r\n'))).toBe(true);
  });
});

describe('useImportDestinationCertificateMutation', () => {
  let mockFetch: jest.Mock;
  let originalFetch: typeof global.fetch;

  const crResponse = (settled: boolean) => ({
    ok: true,
    json: () =>
      Promise.resolve({
        metadata: { generation: 2 },
        status: {
          observedGeneration: 2,
          conditions: [
            { type: 'Available', status: settled ? 'True' : 'False' },
            {
              type: 'DeploymentInProgress',
              status: settled ? 'False' : 'True',
              lastTransitionTime: new Date().toISOString(),
            },
            { type: 'DeploymentFailure', status: 'False' },
          ],
        },
      }),
  });

  const renderImport = (options: { windowMs?: number; intervalMs?: number }) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
    });
    client.setQueryData(['zenkoCR'], withCerts([CERT]));
    const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
    return renderHook(() => useImportDestinationCertificateMutation(options), { wrapper });
  };

  const advance = async (totalMs: number, stepMs = 100) => {
    for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
      await act(async () => {
        jest.advanceTimersByTime(stepMs);
        for (let i = 0; i < 20; i++) await Promise.resolve();
      });
    }
  };

  const patchCalls = () => mockFetch.mock.calls.filter(([, options]) => options?.method === 'PATCH');
  const getCalls = () => mockFetch.mock.calls.filter(([, options]) => options?.method === 'GET');

  beforeEach(() => {
    jest.useFakeTimers();
    originalFetch = global.fetch;
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.spyOn(require('@scality/module-federation'), 'useShellHooks').mockImplementation(() => ({
      useAuth: () => ({ getToken: jest.fn().mockResolvedValue('test-token') }),
      useConfigRetriever: () => ({
        retrieveConfiguration: jest.fn().mockReturnValue({ spec: { selfConfiguration: { url: 'https://test-url' } } }),
      }),
    }));
    jest
      .spyOn(require('../../../next-architecture/ui/ConfigProvider'), 'useDeployedMetalk8sInstances')
      .mockImplementation(() => [{ name: 'test-instance' }]);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('stays pending while the rollout is in progress for an already imported certificate, without patching', async () => {
    let gets = 0;
    mockFetch.mockImplementation(() => {
      gets += 1;
      return Promise.resolve(crResponse(gets > 3));
    });
    const { result } = renderImport({ windowMs: 60_000, intervalMs: 100 });

    await act(async () => {
      result.current.mutate({ certificate: CERT });
    });
    await advance(200);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);

    await advance(1000);
    expect(result.current.isSuccess).toBe(true);
    expect(patchCalls()).toHaveLength(0);
    expect(gets).toBe(4);
  });

  it('resolves after a single GET and no PATCH when the CR is already settled', async () => {
    mockFetch.mockImplementation(() => Promise.resolve(crResponse(true)));
    const { result } = renderImport({ windowMs: 60_000, intervalMs: 100 });

    await act(async () => {
      result.current.mutate({ certificate: CERT });
    });
    await advance(500);

    expect(result.current.isSuccess).toBe(true);
    expect(getCalls()).toHaveLength(1);
    expect(patchCalls()).toHaveLength(0);
  });

  it('surfaces a timeout only once the injected window has passed', async () => {
    mockFetch.mockImplementation(() => Promise.resolve(crResponse(false)));
    const { result } = renderImport({ windowMs: 5000, intervalMs: 1000 });

    await act(async () => {
      result.current.mutate({ certificate: CERT });
    });
    await advance(4000, 500);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isError).toBe(false);

    await advance(2000, 500);
    expect(result.current.isError).toBe(true);
    expect(String(result.current.error)).toContain('timed out');
  });

  it('stops polling once the step is unmounted', async () => {
    mockFetch.mockImplementation(() => Promise.resolve(crResponse(false)));
    const { result, unmount } = renderImport({ windowMs: 60_000, intervalMs: 1000 });

    await act(async () => {
      result.current.mutate({ certificate: CERT });
    });
    await advance(3000, 500);
    const callsBeforeUnmount = getCalls().length;
    expect(callsBeforeUnmount).toBeGreaterThan(1);

    unmount();
    await advance(10_000, 500);

    expect(getCalls().length).toBeLessThanOrEqual(callsBeforeUnmount + 1);
    const settledCount = getCalls().length;
    await advance(10_000, 500);
    expect(getCalls().length).toBe(settledCount);
  });
});
