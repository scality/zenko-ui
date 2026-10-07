import { useCreateBucket, useSetBucketVersioning } from '@scality/data-browser-library';
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Wrapper } from '../../../../utils/testUtil';
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

// Only the network boundary is stubbed. The destination setup stream stays open
// (empty body) so no step resolves during assertions on the initial plan.
const server = setupServer(
  rest.post('*/replication-setups', (_req, res, ctx) =>
    res(ctx.status(200), ctx.set('Content-Type', 'application/x-ndjson'), ctx.body('')),
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
const defaultCreateBucket = (useCreateBucket as jest.Mock).getMockImplementation();
const defaultSetBucketVersioning = (useSetBucketVersioning as jest.Mock).getMockImplementation();
afterEach(() => {
  (useCreateBucket as jest.Mock).mockImplementation(defaultCreateBucket);
  (useSetBucketVersioning as jest.Mock).mockImplementation(defaultSetBucketVersioning);
  server.resetHandlers();
  mockNext.mockReset();
  mockPrev.mockReset();
});
afterAll(() => server.close());

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
  it('lists every provisioning action in order, all pending, for the user to follow', () => {
    render(<ApplyActionsStep {...VALUES} destinationInstanceName="paris-prod" />, { wrapper: Wrapper });

    expect(screen.getByText('Configure paris-prod for Cross-Region Replication')).toBeInTheDocument();

    const actions = [
      'Create Account on Source: crr-src',
      'Create Bucket on Source: crr-src-bucket',
      'Create Account on Destination: crr-dest',
      'Create IAM User',
      'Generate Access Key',
      'Create Policy',
      'Create IAM Role',
      'Attach Policy to Role',
      'Create Target Bucket: crr-target-bucket',
      'Import Certificate into Truststore',
      'Create Location',
      'Create Replication Rule',
    ];
    for (const action of actions) {
      expect(screen.getByText(action)).toBeInTheDocument();
    }
    expect(screen.getAllByText('Pending...').length).toBe(12);
    // The setup only becomes confirmable once every action has succeeded.
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it('does not surface a source-account action when the user reuses an existing account', () => {
    render(<ApplyActionsStep {...VALUES} accountNameType="existing" />, { wrapper: Wrapper });
    expect(screen.queryByText(/Create Account on Source/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Pending...').length).toBe(11);
  });

  it('does not surface the source bucket, target bucket or replication rule when no rule is requested', () => {
    render(<ApplyActionsStep {...VALUES} createReplicationRule={false} sourceBucketName="" targetBucketName="" />, {
      wrapper: Wrapper,
    });
    expect(screen.queryByText(/Create Bucket on Source/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Target Bucket/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Create Replication Rule/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Pending...').length).toBe(9);
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

    expect(screen.getByText('Use Account on Destination: finance')).toBeInTheDocument();
    await waitFor(() => expect(body).toBeDefined());
    expect(body).toMatchObject({ destinationAccount: { mode: 'existing', name: 'finance' } });
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

    expect(screen.getByText('Use Bucket on Source: crr-src-bucket')).toBeInTheDocument();
    expect(screen.getByText('Use Target Bucket: crr-target-bucket')).toBeInTheDocument();
    await waitFor(() => expect(enableVersioning.mutate).toHaveBeenCalled());
    expect(createBucket.mutate).not.toHaveBeenCalled();
  });

  it('falls back to "ARTESCA" in the title when Verify returned no instance name', () => {
    render(<ApplyActionsStep {...VALUES} />, { wrapper: Wrapper });
    expect(screen.getByText('Configure ARTESCA for Cross-Region Replication')).toBeInTheDocument();
  });
});
