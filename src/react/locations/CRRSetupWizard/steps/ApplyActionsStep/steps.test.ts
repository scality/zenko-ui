import type { SetupEvent } from '../../api/types';
import {
  allSucceeded,
  buildStepViews,
  type ChainStatus,
  hasFailure,
  retryLinkIdForRow,
  type StepListInput,
  type StepStateSources,
} from './steps';

const baseInput: StepListInput = {
  isNewSourceAccount: true,
  createReplicationRule: true,
  sourceAccountName: 'src-account',
  sourceBucketName: 'src-bucket',
  targetBucketName: 'target-bucket',
  destinationAccountName: 'dest-account',
};

const noProgress: StepStateSources = { configuratorEvents: [], chainStatusById: {} };

const withChain = (chainStatusById: Record<string, ChainStatus>): StepStateSources => ({
  configuratorEvents: [],
  chainStatusById,
});

const withEvents = (configuratorEvents: SetupEvent[]): StepStateSources => ({
  configuratorEvents,
  chainStatusById: {},
});

describe('buildStepViews', () => {
  it('lists the full provisioning sequence in order when the user creates a new source account and a replication rule', () => {
    const views = buildStepViews(baseInput, noProgress);
    expect(views.map((v) => v.id)).toEqual([
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
    ]);
  });

  it('numbers the steps and shows the chosen source and destination account names', () => {
    const [first, sourceAcc, sourceBkt, destAcc] = buildStepViews(baseInput, noProgress);
    expect(first).toMatchObject({ step: 1, label: 'Import Destination Certificate' });
    expect(sourceAcc).toMatchObject({ step: 2, label: 'Create Account on Source: src-account' });
    expect(sourceBkt).toMatchObject({ step: 3, label: 'Create Bucket on Source: src-bucket' });
    expect(destAcc).toMatchObject({ step: 4, label: 'Create Account on Destination: dest-account' });
  });

  it('labels the destination IAM chain and the target bucket per the ARTESCA CRR procedure', () => {
    const labels = buildStepViews(baseInput, noProgress).map((v) => v.label);
    expect(labels).toContain('Create IAM User');
    expect(labels).toContain('Generate Access Key');
    expect(labels).toContain('Create Policy');
    expect(labels).toContain('Create IAM Role');
    expect(labels).toContain('Attach Policy to Role');
    expect(labels).toContain('Create Target Bucket: target-bucket');
    expect(labels).toContain('Create Location');
    expect(labels).toContain('Create Replication Rule');
  });

  it('drops create-source-account when the user reuses an existing source account', () => {
    const views = buildStepViews({ ...baseInput, isNewSourceAccount: false }, noProgress);
    expect(views.find((v) => v.id === 'create-source-account')).toBeUndefined();
  });

  it('drops the replication-only steps when the user does not opt into creating a rule', () => {
    const views = buildStepViews({ ...baseInput, createReplicationRule: false }, noProgress);
    expect(views.find((v) => v.id === 'create-source-bucket')).toBeUndefined();
    expect(views.find((v) => v.id === 'create-bucket')).toBeUndefined();
    expect(views.find((v) => v.id === 'create-replication-rule')).toBeUndefined();
  });

  it('shows every step as pending before anything runs', () => {
    expect(buildStepViews(baseInput, noProgress).every((v) => v.state === 'pending')).toBe(true);
  });
});

describe('buildStepViews — wizard-run rows', () => {
  it('reflects each wizard chain link status on its row', () => {
    const views = buildStepViews(baseInput, withChain({ 'import-destination-certificate': { status: 'success' } }));
    expect(views.find((v) => v.id === 'import-destination-certificate')?.state).toBe('succeeded');
  });

  it('surfaces a wizard link error message on its row', () => {
    const views = buildStepViews(
      baseInput,
      withChain({ 'create-location': { status: 'error', errorMessage: 'overlay rejected the location' } }),
    );
    const location = views.find((v) => v.id === 'create-location');
    expect(location?.state).toBe('failed');
    expect(location?.errorMessage).toBe('overlay rejected the location');
  });

  it('keeps the source-bucket row pending until assuming the role, creating the bucket and versioning all succeed', () => {
    const versioningPending = buildStepViews(
      baseInput,
      withChain({
        'assume-source-role': { status: 'success' },
        'create-source-bucket': { status: 'success' },
        'create-source-bucket-versioning': { status: 'pending' },
      }),
    );
    expect(versioningPending.find((v) => v.id === 'create-source-bucket')?.state).toBe('pending');

    const allThree = buildStepViews(
      baseInput,
      withChain({
        'assume-source-role': { status: 'success' },
        'create-source-bucket': { status: 'success' },
        'create-source-bucket-versioning': { status: 'success' },
      }),
    );
    expect(allThree.find((v) => v.id === 'create-source-bucket')?.state).toBe('succeeded');
  });

  it('fails the source-bucket row when enabling versioning fails', () => {
    const views = buildStepViews(
      baseInput,
      withChain({
        'assume-source-role': { status: 'success' },
        'create-source-bucket': { status: 'success' },
        'create-source-bucket-versioning': { status: 'error', errorMessage: 'versioning refused' },
      }),
    );
    const row = views.find((v) => v.id === 'create-source-bucket');
    expect(row?.state).toBe('failed');
    expect(row?.errorMessage).toBe('versioning refused');
  });

  it('surfaces an assume-source-role failure on the source-bucket row instead of stalling silently', () => {
    const views = buildStepViews(
      baseInput,
      withChain({ 'assume-source-role': { status: 'error', errorMessage: 'could not assume the source role' } }),
    );
    const row = views.find((v) => v.id === 'create-source-bucket');
    expect(row?.state).toBe('failed');
    expect(row?.errorMessage).toBe('could not assume the source role');
  });
});

describe('buildStepViews — crr-configurator rows', () => {
  it('marks a configurator step done once it completes and shows the reason when one fails', () => {
    const events: SetupEvent[] = [
      { event: 'step.completed', step: 'create-account', at: 't' },
      {
        event: 'step.failed',
        step: 'create-user',
        at: 't',
        error: { code: 'InternalError', message: 'IAM refused CreateUser: entity already exists' },
      },
    ];
    const views = buildStepViews(baseInput, withEvents(events));
    expect(views.find((v) => v.id === 'create-account')?.state).toBe('succeeded');
    const failed = views.find((v) => v.id === 'create-user');
    expect(failed?.state).toBe('failed');
    expect(failed?.errorMessage).toBe('IAM refused CreateUser: entity already exists');
  });

  it('blames the first pending configurator row when the stream fails without pinning a step', () => {
    const views = buildStepViews(baseInput, {
      configuratorEvents: [],
      chainStatusById: {},
      configuratorError: 'the destination stream dropped',
    });
    const firstConfiguratorRow = views.find((v) => v.id === 'create-account');
    expect(firstConfiguratorRow?.state).toBe('failed');
    expect(firstConfiguratorRow?.errorMessage).toBe('the destination stream dropped');
  });

  it('keeps a specific step failure visible rather than replacing it with the stream error', () => {
    const views = buildStepViews(baseInput, {
      configuratorEvents: [
        {
          event: 'step.failed',
          step: 'create-policy',
          at: 't',
          error: { code: 'InternalError', message: 'policy boom' },
        },
      ],
      chainStatusById: {},
      configuratorError: 'irrelevant',
    });
    expect(views.find((v) => v.id === 'create-policy')?.errorMessage).toBe('policy boom');
    expect(views.filter((v) => v.state === 'failed').length).toBe(1);
  });
});

describe('retryLinkIdForRow', () => {
  it('retries a configurator row by re-running the single configurator link', () => {
    expect(retryLinkIdForRow('create-role', {})).toBe('configurator-setup');
    expect(retryLinkIdForRow('create-account', {})).toBe('configurator-setup');
  });

  it('retries a single-link wizard row by re-running its own link', () => {
    expect(retryLinkIdForRow('import-destination-certificate', {})).toBe('import-destination-certificate');
    expect(retryLinkIdForRow('create-location', {})).toBe('create-location');
  });

  it('retries the failed link of the folded source-bucket row, not the one that already succeeded', () => {
    const status = {
      'assume-source-role': { status: 'success' as const },
      'create-source-bucket': { status: 'success' as const },
      'create-source-bucket-versioning': { status: 'error' as const },
    };
    expect(retryLinkIdForRow('create-source-bucket', status)).toBe('create-source-bucket-versioning');
  });

  it('retries the assume-source-role link when that is the folded step that failed', () => {
    expect(retryLinkIdForRow('create-source-bucket', { 'assume-source-role': { status: 'error' } })).toBe(
      'assume-source-role',
    );
  });
});

describe('allSucceeded / hasFailure', () => {
  it('allSucceeded is true only once every listed row has succeeded', () => {
    const allDone: StepStateSources = {
      configuratorEvents: [
        'create-account',
        'create-user',
        'create-access-key',
        'create-policy',
        'create-role',
        'attach-role-policy',
        'create-bucket',
      ].map((step) => ({ event: 'step.completed', step, at: 't' }) as SetupEvent),
      chainStatusById: {
        'import-destination-certificate': { status: 'success' },
        'create-source-account': { status: 'success' },
        'assume-source-role': { status: 'success' },
        'create-source-bucket': { status: 'success' },
        'create-source-bucket-versioning': { status: 'success' },
        'create-location': { status: 'success' },
        'create-replication-rule': { status: 'success' },
      },
    };
    expect(allSucceeded(buildStepViews(baseInput, allDone))).toBe(true);
    expect(allSucceeded(buildStepViews(baseInput, noProgress))).toBe(false);
  });

  it('hasFailure is true when any row failed', () => {
    const views = buildStepViews(
      baseInput,
      withEvents([
        { event: 'step.failed', step: 'create-policy', at: 't', error: { code: 'InternalError', message: 'boom' } },
      ]),
    );
    expect(hasFailure(views)).toBe(true);
    expect(hasFailure(buildStepViews(baseInput, noProgress))).toBe(false);
  });
});
