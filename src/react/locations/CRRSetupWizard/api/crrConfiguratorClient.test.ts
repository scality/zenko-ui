import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createConnection, resolve, ServiceError, startSetup } from './crrConfiguratorClient';
import type { ConnectionRequestBody, SetupEvent, StartSetupBody } from './types';

const CONNECTIONS_URL = '/crr-configurator/api/v1/destination/connections';
const RESOLVE_URL = '/crr-configurator/api/v1/resolve';
const CONNECTION_ID = 'sealed-handle';
const STREAM_URL = `/crr-configurator/api/v1/destination/connections/${CONNECTION_ID}/replication-setups`;
const TOKEN = 'test-token';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const CONNECTION_BODY: ConnectionRequestBody = {
  destinationConnection: {
    baseDomain: 'crr-dest.artesca.local',
    adminUser: 'scality',
    adminPassword: 'test',
  },
  destinationCertificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
};

const START_BODY: StartSetupBody = {
  s3Endpoint: 'https://s3.crr-dest.artesca.local',
  destinationAccount: { mode: 'create', name: 'crr-account' },
  targetBucket: 'target-bucket',
};

const ndjson = (...lines: unknown[]) => `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`;

const problemJSON = (status: number, code: string, extras: Record<string, unknown> = {}) =>
  JSON.stringify({ type: 'about:blank', title: code, status, code, ...extras });

describe('crrConfiguratorClient / createConnection', () => {
  it('returns the connection and what the destination offers', async () => {
    const connection = {
      connectionId: CONNECTION_ID,
      expiresAt: '2026-07-16T13:29:30Z',
      endpoints: [
        { hostname: 's3.crr-dest.artesca.local', locationName: 'us-east-1' },
        { hostname: 's3.repl-vlan.crr-dest.artesca.local', locationName: 'us-east-1' },
      ],
      accounts: [{ name: 'finance', id: '123456789012' }],
    };
    server.use(
      rest.post(CONNECTIONS_URL, (req, res, ctx) => {
        if (req.headers.get('authorization') !== `Bearer ${TOKEN}`) return res(ctx.status(401));
        return res(ctx.json(connection));
      }),
    );

    await expect(createConnection(CONNECTION_BODY, { token: TOKEN })).resolves.toEqual(connection);
  });

  it('throws a ServiceError carrying the ARTESCA problem code on RFC 7807 responses', async () => {
    server.use(
      rest.post(CONNECTIONS_URL, (_req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(problemJSON(400, 'DestinationCertificateInvalid')),
        ),
      ),
    );

    await expect(createConnection(CONNECTION_BODY, { token: TOKEN })).rejects.toMatchObject({
      name: 'ServiceError',
      problem: { code: 'DestinationCertificateInvalid', status: 400 },
    });
  });

  it('surfaces a generic Error when the configurator replies without a problem body', async () => {
    server.use(rest.post(CONNECTIONS_URL, (_req, res, ctx) => res(ctx.status(503), ctx.text('backend down'))));

    const promise = createConnection(CONNECTION_BODY, { token: TOKEN });
    await expect(promise).rejects.toThrow('HTTP 503');
    await expect(promise).rejects.not.toBeInstanceOf(ServiceError);
  });
});

describe('crrConfiguratorClient / resolve', () => {
  const RESOLVE_BODY = {
    s3Endpoint: 'https://s3.crr-dest.artesca.local',
    destinationCertificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
  };

  it('reports a resolvable endpoint', async () => {
    server.use(
      rest.post(RESOLVE_URL, (req, res, ctx) => {
        if (req.headers.get('authorization') !== `Bearer ${TOKEN}`) return res(ctx.status(401));
        return res(ctx.json({ resolvable: true }));
      }),
    );

    await expect(resolve(RESOLVE_BODY, { token: TOKEN })).resolves.toEqual({ resolvable: true });
  });

  it('reports an unresolvable endpoint', async () => {
    server.use(rest.post(RESOLVE_URL, (_req, res, ctx) => res(ctx.json({ resolvable: false }))));

    await expect(resolve(RESOLVE_BODY, { token: TOKEN })).resolves.toEqual({ resolvable: false });
  });

  it('throws a ServiceError on an invalid certificate', async () => {
    server.use(
      rest.post(RESOLVE_URL, (_req, res, ctx) =>
        res(
          ctx.status(400),
          ctx.set('Content-Type', 'application/problem+json'),
          ctx.body(problemJSON(400, 'DestinationCertificateInvalid')),
        ),
      ),
    );

    await expect(resolve(RESOLVE_BODY, { token: TOKEN })).rejects.toMatchObject({
      name: 'ServiceError',
      problem: { code: 'DestinationCertificateInvalid' },
    });
  });
});

describe('crrConfiguratorClient / startSetup', () => {
  it('yields every step event and the terminal setup.completed', async () => {
    let sentBody: unknown;
    server.use(
      rest.post(STREAM_URL, (req, res, ctx) => {
        if (req.headers.get('authorization') !== `Bearer ${TOKEN}`) return res(ctx.status(401));
        sentBody = req.body;
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
                  endpoint: 'https://s3.crr-dest.artesca.local',
                  stsEndpoint: 'https://ui.crr-dest.artesca.local/zenko/sts',
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
    for await (const event of startSetup(CONNECTION_ID, START_BODY, { token: TOKEN })) {
      collected.push(event);
    }

    expect(collected.map((e) => e.event)).toEqual(['step.started', 'step.completed', 'setup.completed']);
    // The connection carries the credentials: the admin password crossed once, at connect.
    expect(sentBody).toEqual(START_BODY);
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
    for await (const event of startSetup(CONNECTION_ID, START_BODY, { token: TOKEN })) {
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
      for await (const _ of startSetup(CONNECTION_ID, START_BODY, { token: TOKEN })) {
        // no-op
      }
    };
    await expect(consume()).rejects.toMatchObject({
      name: 'ServiceError',
      problem: { code: 'Unauthorized' },
    });
  });
});
