import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { ServiceError, startSetup, verify } from './crrConfiguratorClient';
import type { SetupEvent, StartSetupBody, VerifyRequestBody } from './types';

const VERIFY_URL = '/crr-configurator/api/v1/verify';
const STREAM_URL = '/crr-configurator/api/v1/replication-setups';
const TOKEN = 'test-token';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const VERIFY_BODY: VerifyRequestBody = {
  destinationConnection: {
    mode: 'management-network',
    baseUrl: 'https://cluster.example:8443',
    adminUser: 'scality',
    adminPassword: 'test',
  },
  destinationCertificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
};

const START_BODY: StartSetupBody = {
  ...VERIFY_BODY,
  destinationAccount: { mode: 'create', name: 'crr-account' },
  targetBucket: 'target-bucket',
};

const ndjson = (...lines: unknown[]) => `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`;

const problemJSON = (status: number, code: string, extras: Record<string, unknown> = {}) =>
  JSON.stringify({ type: 'about:blank', title: code, status, code, ...extras });

describe('crrConfiguratorClient / verify', () => {
  it('returns the parsed VerifyResponse when the configurator accepts the destination', async () => {
    server.use(
      rest.post(VERIFY_URL, (req, res, ctx) => {
        if (req.headers.get('authorization') !== `Bearer ${TOKEN}`) return res(ctx.status(401));
        return res(ctx.json({ ok: true, mode: 'management-network', instanceName: 'ageless-valley' }));
      }),
    );

    await expect(verify(VERIFY_BODY, { token: TOKEN })).resolves.toEqual({
      ok: true,
      mode: 'management-network',
      instanceName: 'ageless-valley',
    });
  });

  it('throws a ServiceError carrying the ARTESCA problem code on RFC 7807 responses', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(problemJSON(400, 'DestinationCertificateInvalid')),
        ),
      ),
    );

    await expect(verify(VERIFY_BODY, { token: TOKEN })).rejects.toMatchObject({
      name: 'ServiceError',
      problem: { code: 'DestinationCertificateInvalid', status: 400 },
    });
  });

  it('carries unresolvedHosts so the wizard can prompt for DNS overrides', async () => {
    server.use(
      rest.post(VERIFY_URL, (_req, res, ctx) =>
        res(
          ctx.status(502),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(
            problemJSON(502, 'DestinationDnsResolutionFailed', {
              unresolvedHosts: ['cluster-b.internal', 's3.cluster-b.internal'],
            }),
          ),
        ),
      ),
    );

    await expect(verify(VERIFY_BODY, { token: TOKEN })).rejects.toMatchObject({
      problem: {
        code: 'DestinationDnsResolutionFailed',
        unresolvedHosts: ['cluster-b.internal', 's3.cluster-b.internal'],
      },
    });
  });

  it('surfaces a generic Error when the configurator replies without a problem body', async () => {
    server.use(rest.post(VERIFY_URL, (_req, res, ctx) => res(ctx.status(503), ctx.text('backend down'))));

    const promise = verify(VERIFY_BODY, { token: TOKEN });
    await expect(promise).rejects.toThrow('HTTP 503');
    await expect(promise).rejects.not.toBeInstanceOf(ServiceError);
  });
});

describe('crrConfiguratorClient / startSetup', () => {
  it('yields every step event and the terminal setup.completed', async () => {
    server.use(
      rest.post(STREAM_URL, (req, res, ctx) => {
        if (req.headers.get('authorization') !== `Bearer ${TOKEN}`) return res(ctx.status(401));
        return res(
          ctx.status(200),
          ctx.set('Content-Type', 'application/x-ndjson'),
          ctx.body(
            ndjson(
              { event: 'step.started', step: 'authenticate', at: '2026-07-16T13:00:00Z' },
              { event: 'step.completed', step: 'authenticate', at: '2026-07-16T13:00:01Z' },
              {
                event: 'setup.completed',
                at: '2026-07-16T13:00:02Z',
                result: {
                  endpoint: 'https://cluster.example:8443',
                  stsEndpoint: 'https://cluster.example:8443/sts',
                  accessKey: 'AKIA…',
                  secretKey: 'secret…',
                  roleArn: 'arn:aws:iam::123456789012:role/crr-replication-role',
                  targetBucket: 'target-bucket',
                },
              },
            ),
          ),
        );
      }),
    );

    const collected: SetupEvent[] = [];
    for await (const event of startSetup(START_BODY, { token: TOKEN })) {
      collected.push(event);
    }

    expect(collected.map((e) => e.event)).toEqual(['step.started', 'step.completed', 'setup.completed']);
  });

  it('yields setup.failed events with the ARTESCA problem code preserved', async () => {
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

    const collected: SetupEvent[] = [];
    for await (const event of startSetup(START_BODY, { token: TOKEN })) {
      collected.push(event);
    }

    expect(collected).toEqual([
      {
        event: 'setup.failed',
        at: '2026-07-16T13:00:01Z',
        error: { code: 'AssumeRoleFailed', message: 'STS refused the id_token' },
      },
    ]);
  });

  it('throws a ServiceError before yielding anything when the configurator rejects the request', async () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(
          ctx.status(401),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(problemJSON(401, 'Unauthorized')),
        ),
      ),
    );

    const consume = async () => {
      for await (const _ of startSetup(START_BODY, { token: TOKEN })) {
        // no-op
      }
    };
    await expect(consume()).rejects.toMatchObject({
      name: 'ServiceError',
      problem: { code: 'Unauthorized' },
    });
  });
});
