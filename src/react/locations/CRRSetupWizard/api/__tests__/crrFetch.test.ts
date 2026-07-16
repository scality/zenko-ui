import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { postJSON, ServiceError } from '../crrFetch';

const VERIFY_URL = '/crr-configurator/api/v1/verify';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('postJSON', () => {
  it('resolves with the parsed JSON body on 2xx', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(ctx.json({ ok: true, mode: 'management-network', instanceName: 'ageless-valley' })),
      ),
    );
    const result = await postJSON<Record<string, never>, { ok: true; instanceName: string }>('/verify', {});
    expect(result).toEqual({ ok: true, mode: 'management-network', instanceName: 'ageless-valley' });
  });

  it('sends the body as JSON', async () => {
    let captured: unknown;
    server.use(
      rest.post(VERIFY_URL, (req, res, ctx) => {
        captured = req.body;
        return res(ctx.json({ ok: true, mode: 'data-network' }));
      }),
    );
    await postJSON('/verify', { hello: 'world' });
    expect(captured).toEqual({ hello: 'world' });
  });

  it('throws ServiceError when the response is problem+json', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(
          ctx.status(502),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.json({
            type: 'about:blank',
            title: 'Destination unreachable',
            status: 502,
            code: 'DestinationUnreachable',
            detail: 'connect: no route',
          }),
        ),
      ),
    );
    await expect(postJSON('/verify', {})).rejects.toBeInstanceOf(ServiceError);
    await expect(postJSON('/verify', {})).rejects.toMatchObject({
      problem: { code: 'DestinationUnreachable', status: 502 },
    });
  });

  it('carries unresolvedHosts on DestinationDnsResolutionFailed', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(
          ctx.status(502),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.json({
            type: 'about:blank',
            title: 'DNS resolution failed',
            status: 502,
            code: 'DestinationDnsResolutionFailed',
            unresolvedHosts: ['cluster-b.internal', 's3.cluster-b.internal'],
          }),
        ),
      ),
    );
    await expect(postJSON('/verify', {})).rejects.toMatchObject({
      problem: { unresolvedHosts: ['cluster-b.internal', 's3.cluster-b.internal'] },
    });
  });

  it('throws a generic Error for non-JSON error responses', async () => {
    server.use(rest.post(VERIFY_URL, (_req, res, ctx) => res(ctx.status(503), ctx.text('backend down'))));
    await expect(postJSON('/verify', {})).rejects.toThrow('HTTP 503');
  });
});
