import { useCreateBucket, useSetBucketVersioning } from '@scality/data-browser-library';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useMutation } from 'react-query';
import { mockShellHooks, Wrapper } from '../../../../utils/testUtil';
import { useAssumeSourceRoleMutation } from '../../hooks/useAssumeSourceRoleMutation';
import type { ConfigureFormValues } from '../ConfigureStep/schema';
import { ApplyActionsStep } from './ApplyActionsStep';

// The wizard stepper is the host framework around this step; stub it so the
// step can render on its own. Everything else — the chain, the hooks — is the
// real implementation, exercised through the real providers.
const mockNext = jest.fn();
const mockPrev = jest.fn();
jest.mock('@scality/core-ui/dist/components/steppers/Stepper.component', () => ({
  useStepper: () => ({ next: mockNext, prev: mockPrev }),
}));

jest.mock('../../hooks/useAssumeSourceRoleMutation', () => {
  const actual = jest.requireActual('../../hooks/useAssumeSourceRoleMutation');
  return { ...actual, useAssumeSourceRoleMutation: jest.fn(actual.useAssumeSourceRoleMutation) };
});

// One test plays a whole run end to end: slower CI runners exceed the 5 s default.
jest.setTimeout(20_000);

// Only the network boundary is stubbed. The destination setup stream stays open
// (empty body) so no step resolves during assertions on the initial plan.
const server = setupServer(
  rest.post('*/replication-setups', (_req, res, ctx) =>
    res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.body('')),
  ),
  rest.get('*/api/v1/config/overlay/view/:instanceId', (_req, res, ctx) => res(ctx.json({ locations: {} }))),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
const defaultCreateBucket = (useCreateBucket as jest.Mock).getMockImplementation();
const defaultSetBucketVersioning = (useSetBucketVersioning as jest.Mock).getMockImplementation();
const defaultAssumeSourceRole = (useAssumeSourceRoleMutation as jest.Mock).getMockImplementation();
afterEach(() => {
  (useAssumeSourceRoleMutation as jest.Mock).mockImplementation(defaultAssumeSourceRole);
  (useCreateBucket as jest.Mock).mockImplementation(defaultCreateBucket);
  (useSetBucketVersioning as jest.Mock).mockImplementation(defaultSetBucketVersioning);
  server.resetHandlers();
  mockNext.mockReset();
  mockPrev.mockReset();
});
afterAll(() => server.close());

const LOCATION_NAME = 'location-crr-dest-crr-dest-artesca-local';

const sourceHasLocation = (locationType: string) =>
  server.use(
    rest.get('*/api/v1/config/overlay/view/:instanceId', (_req, res, ctx) =>
      res(
        ctx.delay(100),
        ctx.json({ locations: { [LOCATION_NAME]: { name: LOCATION_NAME, locationType, details: {} } } }),
      ),
    ),
  );

const SETUP_RESULT = {
  endpoint: 'https://s3.crr-dest.artesca.local',
  stsEndpoint: 'https://sts.crr-dest.artesca.local',
  accessKey: 'AK',
  secretKey: 'SK',
  roleArn: 'arn:aws:iam::123:role/crr-replication-role',
};

const rowStatus = (row: HTMLElement) => row.querySelectorAll('td')[2]?.textContent?.trim();

/** Streams the destination setup the way crr-configurator does when every step goes through. */
const succeedEveryConfiguratorStep = (steps: string[]) =>
  server.use(
    rest.post('*/replication-setups', (_req, res, ctx) =>
      res(
        ctx.status(200),
        ctx.set('Content-Type', 'application/x-ndjson'),
        ctx.body(
          [
            ...steps.flatMap((step) => [
              JSON.stringify({ event: 'step.started', step }),
              JSON.stringify({ event: 'step.completed', step }),
            ]),
            JSON.stringify({ event: 'setup.completed', result: SETUP_RESULT }),
          ].join('\n') + '\n',
        ),
      ),
    ),
  );

const VALUES: ConfigureFormValues = {
  accountNameType: 'create',
  accountName: 'crr-src',
  baseDomain: 'crr-dest.artesca.local',
  username: 'scality',
  password: 'super-secret',
  certificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
  selectedEndpoint: 's3.crr-dest.artesca.local',
  destinationAccountNameType: 'create',
  destinationAccountName: 'crr-dest',
  createReplicationRule: true,
  sourceBucketNameType: 'create',
  sourceBucketName: 'crr-src-bucket',
  targetBucketNameType: 'create',
  targetBucketName: 'crr-target-bucket',
  prefix: '',
};

describe('ApplyActionsStep', () => {
  it('lists every provisioning action in order for the user to follow', async () => {
    render(<ApplyActionsStep {...VALUES} destinationInstanceName="paris-prod" />, { wrapper: Wrapper });

    expect(screen.getByText('Configure paris-prod for Cross-Region Replication')).toBeInTheDocument();
    await screen.findByText('Create IAM User on Destination');

    const actions = [
      'Create Account on Source: crr-src',
      'Create Bucket on Source: crr-src-bucket',
      'Create Account on Destination: crr-dest',
      'Create IAM User on Destination',
      'Generate Access Key on Destination',
      'Create Policy on Destination',
      'Create IAM Role on Destination',
      'Attach Policy to Role on Destination',
      'Create Bucket on Destination: crr-target-bucket',
      'Import Destination Certificate on Source',
      `Create Location on Source: ${LOCATION_NAME}`,
      'Create Replication Rule on Source',
      'Update Configuration on Source',
    ];
    for (const action of actions) {
      expect(screen.getByText(action)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('row')).toHaveLength(1 + 13);
    // The setup only becomes confirmable once every action has succeeded.
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it('does not surface a source-account action when the user reuses an existing account', async () => {
    render(<ApplyActionsStep {...VALUES} accountNameType="existing" />, { wrapper: Wrapper });
    await screen.findByText('Create IAM User on Destination');
    expect(screen.queryByText(/Create Account on Source/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1 + 12);
  });

  it('does not surface the source bucket, target bucket or replication rule when no rule is requested', async () => {
    render(<ApplyActionsStep {...VALUES} createReplicationRule={false} sourceBucketName="" targetBucketName="" />, {
      wrapper: Wrapper,
    });
    await screen.findByText('Create IAM User on Destination');
    expect(screen.queryByText(/Create Bucket on Source/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Bucket on Destination/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Replication Rule/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(1 + 10);
  });

  it('reuses the chosen destination account instead of creating one', async () => {
    let body: unknown;
    server.use(
      rest.post('*/replication-setups', (req, res, ctx) => {
        body = req.body;
        return res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(''));
      }),
    );
    render(
      <ApplyActionsStep
        {...VALUES}
        accountNameType="existing"
        createReplicationRule={false}
        destinationAccountNameType="existing"
        destinationAccountName="finance"
      />,
      { wrapper: Wrapper },
    );

    expect(await screen.findByText('Use Account on Destination: finance')).toBeInTheDocument();
    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ destinationAccount: { mode: 'existing', name: 'finance' } });
  });

  it('reuses the location an earlier run created, without minting another access key', async () => {
    sourceHasLocation('location-scality-crr-v1');
    const bodies: unknown[] = [];
    server.use(
      rest.post('*/replication-setups', (req, res, ctx) => {
        bodies.push(req.body);
        return res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(''));
      }),
    );
    render(<ApplyActionsStep {...VALUES} accountNameType="existing" createReplicationRule={false} />, {
      wrapper: Wrapper,
    });
    // The plan never shows, even briefly, an access key the run won't create.
    expect(screen.queryByText('Generate Access Key on Destination')).not.toBeInTheDocument();

    expect(await screen.findByText(`Use Location on Source: ${LOCATION_NAME}`)).toBeInTheDocument();
    expect(screen.queryByText('Generate Access Key on Destination')).not.toBeInTheDocument();
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toMatchObject({ existingLocation: true });

    // The reused location waits its turn: no row reads as done while a row above it is still running.
    const statuses = screen.getAllByRole('row').slice(1).map(rowStatus);
    expect(statuses.indexOf('Success')).toBe(-1);
  });

  it('keeps the reused location waiting while a step above it is still running', async () => {
    sourceHasLocation('location-scality-crr-v1');
    succeedEveryConfiguratorStep([
      'create-account',
      'create-user',
      'create-policy',
      'create-role',
      'attach-role-policy',
    ]);
    render(<ApplyActionsStep {...VALUES} accountNameType="existing" createReplicationRule={false} />, {
      wrapper: Wrapper,
    });

    const statusOf = async (label: string | RegExp) =>
      rowStatus((await screen.findByText(label)).closest('tr') as HTMLElement);
    const locationLabel = `Use Location on Source: ${LOCATION_NAME}`;
    expect(await statusOf(locationLabel)).toBe('Pending...');

    // The destination steps go through, the certificate import has not: the location waits for it.
    await waitFor(async () => expect(await statusOf('Attach Policy to Role on Destination')).toBe('Success'));
    expect(await statusOf('Import Destination Certificate on Source')).not.toBe('Success');
    expect(await statusOf(locationLabel)).toBe('Pending...');
  });

  it("reads the location list again on a second run, instead of deciding on the first run's list", async () => {
    let listedLocations = {};
    server.use(
      rest.get('*/api/v1/config/overlay/view/:instanceId', (_req, res, ctx) =>
        res(ctx.json({ locations: listedLocations })),
      ),
    );
    const bodies: unknown[] = [];
    server.use(
      rest.post('*/replication-setups', (req, res, ctx) => {
        bodies.push(req.body);
        return res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(''));
      }),
    );
    const runTheStep = () =>
      render(<ApplyActionsStep {...VALUES} accountNameType="existing" createReplicationRule={false} />, {
        wrapper: Wrapper,
      });

    const firstRun = runTheStep();
    await waitFor(() => expect(bodies).toHaveLength(1));
    firstRun.unmount();

    // That run created the location: the second one must see it and reuse it.
    listedLocations = {
      [LOCATION_NAME]: { name: LOCATION_NAME, locationType: 'location-scality-crr-v1', details: {} },
    };
    runTheStep();

    expect(await screen.findByText(`Use Location on Source: ${LOCATION_NAME}`)).toBeInTheDocument();
    await waitFor(() => expect(bodies).toHaveLength(2));
    expect(bodies[1]).toMatchObject({ existingLocation: true });
  });

  it('refuses to run when a location with the same name is not a Cross-Region one', async () => {
    sourceHasLocation('location-file-v1');
    let started = false;
    server.use(
      rest.post('*/replication-setups', (_req, res, ctx) => {
        started = true;
        return res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(''));
      }),
    );
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });

    expect(await screen.findByText(/already exists and is not a Cross-Region location/)).toBeInTheDocument();
    expect(started).toBe(false);
  });

  it('reuses the chosen source and target buckets instead of creating them', async () => {
    const mutationMock = () => ({ mutate: jest.fn(), mutateAsync: jest.fn(), status: 'idle', reset: jest.fn() });
    const createBucket = mutationMock();
    const enableVersioning = mutationMock();
    (useCreateBucket as jest.Mock).mockReturnValue(createBucket);
    (useSetBucketVersioning as jest.Mock).mockReturnValue(enableVersioning);

    render(
      <ApplyActionsStep
        {...VALUES}
        accountNameType="existing"
        sourceBucketNameType="existing"
        targetBucketNameType="existing"
      />,
      { wrapper: Wrapper },
    );

    expect(await screen.findByText('Use Bucket on Source: crr-src-bucket')).toBeInTheDocument();
    expect(screen.getByText('Use Bucket on Destination: crr-target-bucket')).toBeInTheDocument();
    await waitFor(() => expect(enableVersioning.mutate).toHaveBeenCalled());
    expect(createBucket.mutate).not.toHaveBeenCalled();
  });

  it('falls back to "ARTESCA" in the title when Verify returned no instance name', () => {
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });
    expect(screen.getByText('Configure ARTESCA for Cross-Region Replication')).toBeInTheDocument();
  });
});

describe('ApplyActionsStep — refreshing what the run created', () => {
  const originalConfigRetriever = (mockShellHooks.useConfigRetriever as jest.Mock).getMockImplementation();
  afterEach(() => (mockShellHooks.useConfigRetriever as jest.Mock).mockImplementation(originalConfigRetriever));

  // Counts the reads of the two lists the Accounts and Locations pages show. Once the run has
  // created the location, the locations list returns it.
  const watchLists = () => {
    const reads = { accounts: 0, locations: 0 };
    server.use(
      rest.post('http://testendpoint', (_req, res, ctx) => {
        reads.accounts += 1;
        return res(ctx.json({ IsTruncated: false, Accounts: [] }));
      }),
      rest.get('*/api/v1/config/overlay/view/:instanceId', (_req, res, ctx) => {
        reads.locations += 1;
        const created = reads.locations > 1;
        return res(
          ctx.json({
            locations: created
              ? { [LOCATION_NAME]: { name: LOCATION_NAME, locationType: 'location-scality-crr-v1', details: {} } }
              : {},
          }),
        );
      }),
      rest.post('*/config/:uuid/user', (_req, res, ctx) => res(ctx.json({ id: '100000000001' }))),
    );
    return reads;
  };

  const theDestinationSetupSucceeds = () => {
    const steps = [
      'create-account',
      'create-user',
      'create-access-key',
      'create-policy',
      'create-role',
      'attach-role-policy',
    ];
    const events = [
      ...steps.flatMap((step) => [
        { event: 'step.started', step },
        { event: 'step.completed', step },
      ]),
      {
        event: 'setup.completed',
        result: {
          endpoint: 'https://s3.crr-dest.artesca.local',
          stsEndpoint: 'https://sts.crr-dest.artesca.local',
          accessKey: 'AK',
          secretKey: 'SK',
          roleArn: 'arn:aws:iam::123456789012:role/crr-replication-role',
        },
      },
    ];
    server.use(
      rest.post('*/replication-setups', (_req, res, ctx) =>
        res(
          ctx.set('Content-Type', 'application/x-ndjson'),
          ctx.body(events.map((event) => `${JSON.stringify(event)}\n`).join('')),
        ),
      ),
      rest.post('*/config/:uuid/location', (_req, res, ctx) => res(ctx.json({}))),
      // The destination certificate is already trusted, so importing it does nothing.
      rest.get('*/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data', (_req, res, ctx) =>
        res(ctx.json({ spec: { egress: { extraCACerts: [{ 'ca.crt': VALUES.certificate }] } } })),
      ),
    );
    (mockShellHooks.useConfigRetriever as jest.Mock).mockReturnValue({
      retrieveConfiguration: () => ({ spec: { selfConfiguration: { url: 'http://testendpoint' } } }),
    });
  };

  it('has no Update Configuration step when the run reuses both the account and the location', async () => {
    sourceHasLocation('location-scality-crr-v1');
    render(<ApplyActionsStep {...VALUES} accountNameType="existing" createReplicationRule={false} />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByRole('row', { name: /Use Location/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Update Configuration/ })).not.toBeInTheDocument();
  });

  it('reloads the accounts and the locations once the run has created them, keeping its plan', async () => {
    const reads = watchLists();
    theDestinationSetupSucceeds();
    render(<ApplyActionsStep {...VALUES} createReplicationRule={false} />, { wrapper: Wrapper });
    expect(await screen.findByRole('row', { name: /Create Location/ })).toBeInTheDocument();
    const readsBeforeTheRun = { ...reads };

    await waitFor(
      () => expect(screen.getByRole('row', { name: /Update Configuration/ })).toHaveTextContent('Success'),
      { timeout: 15_000 },
    );

    expect(reads.accounts).toBeGreaterThan(readsBeforeTheRun.accounts);
    expect(reads.locations).toBeGreaterThan(readsBeforeTheRun.locations);
    // The location now exists, yet the plan still tells what this run did.
    expect(screen.getByRole('row', { name: /Create Location/ })).toBeInTheDocument();
  });

  it('reloads the accounts when the user leaves a run that already created one', async () => {
    const reads = watchLists();
    render(<ApplyActionsStep {...VALUES} createReplicationRule={false} />, { wrapper: Wrapper });
    // The destination setup does not answer: the run stops after creating the account.
    const exit = await screen.findByRole('button', { name: /Exit/i });
    await waitFor(() => expect(exit).toBeEnabled());
    const readsBeforeLeaving = reads.accounts;

    await userEvent.click(exit);

    await waitFor(() => expect(reads.accounts).toBeGreaterThan(readsBeforeLeaving));
  });
});

describe('ApplyActionsStep — padded account names', () => {
  it('creates the source account under its trimmed name', async () => {
    let created: { userName?: string; email?: string } | undefined;
    server.use(
      rest.post('*/config/:uuid/user', (req, res, ctx) => {
        created = req.body as { userName?: string; email?: string };
        return res(ctx.json({ id: '100000000001' }));
      }),
    );
    render(<ApplyActionsStep {...VALUES} accountName="  crr-src  " destinationAccountName=" crr-dest " />, {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(created).toBeDefined());
    expect(created?.userName).toBe('crr-src');
    expect(created?.email).toBe('crr-src@artesca.local');
    expect(screen.getByText('Create Account on Source: crr-src')).toBeInTheDocument();
  });
});

describe('ApplyActionsStep — existing accounts keep their listed name', () => {
  it('sends the destination account name of an existing account unchanged', async () => {
    let body: unknown;
    server.use(
      rest.post('*/replication-setups', (req, res, ctx) => {
        body = req.body;
        return res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(''));
      }),
    );
    render(
      <ApplyActionsStep
        {...VALUES}
        accountNameType="existing"
        createReplicationRule={false}
        destinationAccountNameType="existing"
        destinationAccountName="finance "
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ destinationAccount: { mode: 'existing', name: 'finance ' } });
  });

  it('sends the destination account name of an account to create trimmed', async () => {
    let body: unknown;
    server.use(
      rest.post('*/replication-setups', (req, res, ctx) => {
        body = req.body;
        return res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(''));
      }),
    );
    render(
      <ApplyActionsStep
        {...VALUES}
        accountNameType="existing"
        createReplicationRule={false}
        destinationAccountName=" crr-dest "
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ destinationAccount: { mode: 'create', name: 'crr-dest' } });
  });

  it('assumes the role of the listed source account whose name carries a trailing space', async () => {
    const storageManagerRole = (accountId: string) => ({
      Name: 'storage-manager-role',
      Arn: `arn:aws:iam::${accountId}:role/scality-internal/storage-manager-role`,
    });
    server.use(
      rest.post('http://testendpoint', (_req, res, ctx) =>
        res(
          ctx.json({
            IsTruncated: false,
            Accounts: [
              { Name: 'src', CreationDate: '2022-03-18T12:51:44Z', Roles: [storageManagerRole('111111111111')] },
              { Name: 'src ', CreationDate: '2022-03-18T12:51:44Z', Roles: [storageManagerRole('222222222222')] },
            ],
          }),
        ),
      ),
      // The locations answer late, so the accounts are listed by the time the run starts.
      rest.get('*/api/v1/config/overlay/view/:instanceId', (_req, res, ctx) =>
        res(ctx.delay(300), ctx.json({ locations: {} })),
      ),
    );
    const assumedRoleArns: string[] = [];
    (useAssumeSourceRoleMutation as jest.Mock).mockImplementation(() =>
      useMutation({
        mutationFn: async ({ roleArn }: { roleArn: string }) => {
          assumedRoleArns.push(roleArn);
        },
      }),
    );
    render(
      <ApplyActionsStep
        {...VALUES}
        accountName="src "
        accountNameType="existing"
        sourceBucketNameType="existing"
        targetBucketNameType="existing"
      />,
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(assumedRoleArns).toHaveLength(1));
    expect(assumedRoleArns[0]).toBe('arn:aws:iam::222222222222:role/scality-internal/storage-manager-role');
  });
});
