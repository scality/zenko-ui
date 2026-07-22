import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Wrapper } from '../../../../utils/testUtil';
import type { ConfigureFormValues } from '../ConfigureStep/schema';
import { ApplyActionsStep } from './ApplyActionsStep';

const mockNext = jest.fn();
const mockPrev = jest.fn();

jest.mock('@scality/core-ui/dist/components/steppers/Stepper.component', () => ({
  useStepper: () => ({ next: mockNext, prev: mockPrev }),
}));

const STREAM_URL = '/crr-configurator/api/v1/replication-setups';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  mockNext.mockReset();
  mockPrev.mockReset();
});
afterAll(() => server.close());

const ndjson = (...lines: unknown[]) => `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`;

const VALUES: ConfigureFormValues = {
  accountNameType: 'create',
  accountName: 'src-account',
  connectionMode: 'management-network',
  url: 'https://10.0.0.42:8443',
  baseDomain: '',
  s3Endpoint: '',
  username: 'scality',
  password: 'super-secret',
  certificate: '-----BEGIN CERTIFICATE-----\nx\n-----END CERTIFICATE-----',
  destinationAccountName: 'dest-account',
  createReplicationRule: true,
  sourceBucketName: 'src-bucket',
  targetBucketName: 'target-bucket',
  prefix: '',
};

const RESULT = {
  endpoint: 'https://cluster.example:8443',
  stsEndpoint: 'https://cluster.example:8443/sts',
  accessKey: 'AKIA',
  secretKey: 'secret',
  roleArn: 'arn:aws:iam::123456789012:role/crr',
  targetBucket: 'target-bucket',
};

const ALL_STEPS_WHEN_NEW_ACCOUNT_AND_RULE = [
  'import-destination-certificate',
  'create-source-account',
  'create-source-bucket',
  'create-account',
  'create-user',
  'create-access-key',
  'create-policy',
  'create-role',
  'attach-role-policy',
  'create-bucket',
  'create-location',
  'create-replication-rule',
] as const;

describe('ApplyActionsStep', () => {
  it('lists every provisioning action to run, all pending, before the setup starts', () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(ndjson())),
      ),
    );
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });

    expect(screen.getByText('Import Destination Certificate')).toBeInTheDocument();
    expect(screen.getByText('Create Account on Source: src-account')).toBeInTheDocument();
    expect(screen.getByText('Create Bucket on Source: src-bucket')).toBeInTheDocument();
    expect(screen.getByText('Create Account on Destination: dest-account')).toBeInTheDocument();
    expect(screen.getByText('Create IAM User')).toBeInTheDocument();
    expect(screen.getByText('Generate Access Key')).toBeInTheDocument();
    expect(screen.getByText('Create Policy')).toBeInTheDocument();
    expect(screen.getByText('Create IAM Role')).toBeInTheDocument();
    expect(screen.getByText('Attach Policy to Role')).toBeInTheDocument();
    expect(screen.getByText('Create Target Bucket: target-bucket')).toBeInTheDocument();
    expect(screen.getByText('Create Location')).toBeInTheDocument();
    expect(screen.getByText('Create Replication Rule')).toBeInTheDocument();
    expect(screen.getAllByText('Pending...').length).toBe(12);
  });

  it('uses the destination instance name in the title when one was returned by Verify', () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(ndjson())),
      ),
    );
    render(<ApplyActionsStep {...VALUES} destinationInstanceName="ageless-valley" />, { wrapper: Wrapper });
    expect(screen.getByText('Configure ageless-valley for Cross-Region Replication')).toBeInTheDocument();
  });

  it('falls back to "ARTESCA" in the title when the destination instance name is not available', () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(ndjson())),
      ),
    );
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });
    expect(screen.getByText('Configure ARTESCA for Cross-Region Replication')).toBeInTheDocument();
  });

  it('does not render Authenticate — that step was covered by the previous wizard step', () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(ndjson())),
      ),
    );
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });
    expect(screen.queryByText(/Authenticate/i)).not.toBeInTheDocument();
  });

  it('marks each action Success as it completes and only lets the user continue once all have succeeded', async () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(
          ctx.set('Content-Type', 'application/x-ndjson'),
          ctx.body(
            ndjson(
              ...ALL_STEPS_WHEN_NEW_ACCOUNT_AND_RULE.flatMap((step) => [
                { event: 'step.started', step, at: 't' },
                { event: 'step.completed', step, at: 't' },
              ]),
              { event: 'setup.completed', at: 't', result: RESULT },
            ),
          ),
        ),
      ),
    );
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });

    await waitFor(() => expect(screen.getAllByText('Success').length).toBe(12));
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await waitFor(() => expect(continueButton).toBeEnabled());
    await userEvent.click(continueButton);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ result: RESULT }));
  });

  it('renders the peer error message inline next to the Failed indicator so the user sees why the step failed', async () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(
          ctx.set('Content-Type', 'application/x-ndjson'),
          ctx.body(
            ndjson(
              { event: 'step.started', step: 'create-user', at: 't' },
              {
                event: 'step.failed',
                step: 'create-user',
                at: 't',
                error: { code: 'InternalError', message: 'IAM refused CreateUser: entity already exists' },
              },
              { event: 'setup.failed', at: 't', error: { code: 'InternalError', message: 'IAM refused CreateUser: entity already exists' } },
            ),
          ),
        ),
      ),
    );
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });
    await screen.findByRole('button', { name: /Retry/i });
    expect(screen.getByText('IAM refused CreateUser: entity already exists')).toBeInTheDocument();
  });

  it('surfaces Failed with an inline Retry on the failed step and re-fires the mutation on click', async () => {
    let requestCount = 0;
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) => {
        requestCount += 1;
        return res(
          ctx.set('Content-Type', 'application/x-ndjson'),
          ctx.body(
            ndjson(
              { event: 'step.started', step: 'create-user', at: 't' },
              {
                event: 'step.failed',
                step: 'create-user',
                at: 't',
                error: { code: 'InternalError', message: 'IAM refused CreateUser' },
              },
              { event: 'setup.failed', at: 't', error: { code: 'InternalError', message: 'IAM refused CreateUser' } },
            ),
          ),
        );
      }),
    );
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });

    const retry = await screen.findByRole('button', { name: /Retry/i });
    expect(screen.getByText('Failed')).toBeInTheDocument();
    await userEvent.click(retry);
    await waitFor(() => expect(requestCount).toBe(2));
  });

  it('surfaces a global stream error on the first pending row via the same per-row Failed + Retry treatment', async () => {
    let requestCount = 0;
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) => {
        requestCount += 1;
        return res(ctx.status(500), ctx.set('Content-Type', 'application/problem+json'), ctx.json({ title: 'Internal error', detail: 'the whole thing exploded' }));
      }),
    );
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });

    const retry = await screen.findByRole('button', { name: /Retry/i });
    expect(screen.getByText('Failed')).toBeInTheDocument();
    await userEvent.click(retry);
    await waitFor(() => expect(requestCount).toBe(2));
  });

  it('skips creating a source account when the user reuses an existing one', () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(ndjson())),
      ),
    );
    render(<ApplyActionsStep {...VALUES} accountNameType="existing" />, { wrapper: Wrapper });
    expect(screen.queryByText(/Create Account on Source/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Pending...').length).toBe(11);
  });

  it('skips the source bucket, target bucket and replication rule when the user opts out of creating a rule', () => {
    server.use(
      rest.post(STREAM_URL, (_req, res, ctx) =>
        res(ctx.set('Content-Type', 'application/x-ndjson'), ctx.body(ndjson())),
      ),
    );
    render(<ApplyActionsStep {...VALUES} createReplicationRule={false} sourceBucketName="" targetBucketName="" />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByText(/Create Bucket on Source/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Target Bucket/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Replication Rule/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Pending...').length).toBe(9);
  });
});
