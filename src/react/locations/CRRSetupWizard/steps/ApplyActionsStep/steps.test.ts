import type { SetupEvent } from '../../api/types';
import { allSucceeded, buildStepViews, hasFailure, type StepListInput } from './steps';

const baseInput: StepListInput = {
  isNewSourceAccount: true,
  createReplicationRule: true,
  sourceAccountName: 'src-account',
  sourceBucketName: 'src-bucket',
  targetBucketName: 'target-bucket',
  destinationAccountName: 'dest-account',
};

describe('buildStepViews', () => {
  it('lists the full provisioning sequence in order when the user creates a new source account and a replication rule', () => {
    const views = buildStepViews(baseInput, []);
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
    const [first, sourceAcc, sourceBkt, destAcc] = buildStepViews(baseInput, []);
    expect(first).toMatchObject({ step: 1, label: 'Import Destination Certificate' });
    expect(sourceAcc).toMatchObject({ step: 2, label: 'Create Account on Source: src-account' });
    expect(sourceBkt).toMatchObject({ step: 3, label: 'Create Bucket on Source: src-bucket' });
    expect(destAcc).toMatchObject({ step: 4, label: 'Create Account on Destination: dest-account' });
  });

  it('labels the destination IAM chain and the target bucket per the ARTESCA CRR procedure', () => {
    const labels = buildStepViews(baseInput, []).map((v) => v.label);
    expect(labels).toContain('Create IAM User');
    expect(labels).toContain('Generate Access Key');
    expect(labels).toContain('Create Policy');
    expect(labels).toContain('Create IAM Role');
    expect(labels).toContain('Attach Policy to Role');
    expect(labels).toContain('Create Target Bucket: target-bucket');
    expect(labels).toContain('Create Location');
    expect(labels).toContain('Create Replication Rule');
  });

  it('drops create-source-account when the wizard picked an existing source account', () => {
    const views = buildStepViews({ ...baseInput, isNewSourceAccount: false }, []);
    expect(views.find((v) => v.id === 'create-source-account')).toBeUndefined();
  });

  it('drops the replication-only steps when the wizard did not opt into replication rule creation', () => {
    const views = buildStepViews({ ...baseInput, createReplicationRule: false }, []);
    expect(views.find((v) => v.id === 'create-source-bucket')).toBeUndefined();
    expect(views.find((v) => v.id === 'create-bucket')).toBeUndefined();
    expect(views.find((v) => v.id === 'create-replication-rule')).toBeUndefined();
  });

  it('never surfaces the backend authenticate step (it is covered by the Verify wizard step)', () => {
    const ids = buildStepViews(baseInput, []).map((v) => v.id) as string[];
    expect(ids).not.toContain('authenticate');
  });

  it('surfaces the destination role, policy attachment and target bucket steps the CRR procedure requires', () => {
    const ids = buildStepViews(baseInput, []).map((v) => v.id) as string[];
    for (const id of ['create-role', 'attach-role-policy', 'create-bucket']) {
      expect(ids).toContain(id);
    }
  });

  it('shows every step as pending before the setup runs', () => {
    const views = buildStepViews(baseInput, []);
    expect(views.every((v) => v.state === 'pending')).toBe(true);
  });

  it('marks a step done once it completes and shows the reason when one fails', () => {
    const events: SetupEvent[] = [
      { event: 'step.completed', step: 'create-account', at: 't' },
      {
        event: 'step.failed',
        step: 'create-user',
        at: 't',
        error: { code: 'InternalError', message: 'IAM refused CreateUser: entity already exists' },
      },
    ];
    const views = buildStepViews(baseInput, events);
    expect(views.find((v) => v.id === 'create-account')?.state).toBe('succeeded');
    const failed = views.find((v) => v.id === 'create-user');
    expect(failed?.state).toBe('failed');
    expect(failed?.errorMessage).toBe('IAM refused CreateUser: entity already exists');
  });
});

describe('when the whole setup fails without pinpointing a step', () => {
  it('blames the first step still waiting to run and shows why', () => {
    const views = buildStepViews(baseInput, [], { globalErrorMessage: 'network exploded' });
    const firstPending = views[0];
    expect(firstPending.state).toBe('failed');
    expect(firstPending.errorMessage).toBe('network exploded');
    for (const v of views.slice(1)) expect(v.state).toBe('pending');
  });

  it('blames the first unfinished step once earlier ones have already succeeded', () => {
    const events: SetupEvent[] = [
      { event: 'step.completed', step: 'import-destination-certificate', at: 't' },
      { event: 'step.completed', step: 'create-source-account', at: 't' },
    ];
    const views = buildStepViews(baseInput, events, { globalErrorMessage: 'stream ended without a terminal event' });
    expect(views[0].state).toBe('succeeded');
    expect(views[1].state).toBe('succeeded');
    expect(views[2].state).toBe('failed');
    expect(views[2].errorMessage).toBe('stream ended without a terminal event');
  });

  it('keeps a specific step failure visible rather than replacing it with the generic error', () => {
    const events: SetupEvent[] = [
      {
        event: 'step.failed',
        step: 'create-user',
        at: 't',
        error: { code: 'InternalError', message: 'IAM refused CreateUser' },
      },
    ];
    const views = buildStepViews(baseInput, events, { globalErrorMessage: 'irrelevant' });
    const stepFailure = views.find((v) => v.id === 'create-user');
    expect(stepFailure?.state).toBe('failed');
    expect(stepFailure?.errorMessage).toBe('IAM refused CreateUser');
    expect(views.filter((v) => v.state === 'failed').length).toBe(1);
  });
});

describe('allSucceeded / hasFailure', () => {
  const allIds = buildStepViews(baseInput, []).map((v) => v.id);

  it('allSucceeded requires every listed step to be succeeded', () => {
    const events: SetupEvent[] = allIds.map((step) => ({ event: 'step.completed', step, at: 't' }));
    expect(allSucceeded(buildStepViews(baseInput, events))).toBe(true);
    expect(allSucceeded(buildStepViews(baseInput, []))).toBe(false);
  });

  it('hasFailure is true when any step is failed', () => {
    const events: SetupEvent[] = [
      { event: 'step.failed', step: 'create-policy', at: 't', error: { code: 'InternalError', message: 'boom' } },
    ];
    expect(hasFailure(buildStepViews(baseInput, events))).toBe(true);
    expect(hasFailure(buildStepViews(baseInput, []))).toBe(false);
  });
});
