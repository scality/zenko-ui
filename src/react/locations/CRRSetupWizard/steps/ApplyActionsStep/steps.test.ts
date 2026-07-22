import type { SetupEvent } from '../../api/types';
import { allSucceeded, buildStepViews, hasFailure, type StepListInput } from './steps';

const baseInput: StepListInput = {
  isNewSourceAccount: true,
  createReplicationRule: true,
  sourceAccountName: 'src-account',
  sourceBucketName: 'src-bucket',
  destinationAccountName: 'dest-account',
};

describe('buildStepViews', () => {
  it('lists the 10 canonical steps in order when both create-source-account and create-replication-rule apply', () => {
    const views = buildStepViews(baseInput, []);
    expect(views.map((v) => v.id)).toEqual([
      'import-destination-certificate',
      'create-source-account',
      'create-source-bucket',
      'create-destination-account',
      'create-user',
      'create-access-key',
      'create-policy',
      'attach-policy',
      'create-location',
      'create-replication-rule',
    ]);
  });

  it('numbers steps starting at 1 and interpolates source/destination names', () => {
    const [first, sourceAcc, sourceBkt, destAcc] = buildStepViews(baseInput, []);
    expect(first).toMatchObject({ step: 1, label: 'Import Destination Certificate' });
    expect(sourceAcc).toMatchObject({ step: 2, label: 'Create Account on Source: src-account' });
    expect(sourceBkt).toMatchObject({ step: 3, label: 'Create Bucket on Source: src-bucket' });
    expect(destAcc).toMatchObject({ step: 4, label: 'Create Account on Destination: dest-account' });
  });

  it('uses ISV wording verbatim for the reused actions', () => {
    const labels = buildStepViews(baseInput, []).map((v) => v.label);
    expect(labels).toContain('Create IAM User');
    expect(labels).toContain('Generate Access Key');
    expect(labels).toContain('Create Policy');
    expect(labels).toContain('Attach Policy to User');
    expect(labels).toContain('Create Location');
    expect(labels).toContain('Create Replication Rule');
  });

  it('drops create-source-account when the wizard picked an existing source account', () => {
    const views = buildStepViews({ ...baseInput, isNewSourceAccount: false }, []);
    expect(views.find((v) => v.id === 'create-source-account')).toBeUndefined();
  });

  it('drops the two replication-only steps when the wizard did not opt into replication rule creation', () => {
    const views = buildStepViews({ ...baseInput, createReplicationRule: false }, []);
    expect(views.find((v) => v.id === 'create-source-bucket')).toBeUndefined();
    expect(views.find((v) => v.id === 'create-replication-rule')).toBeUndefined();
  });

  it('never surfaces authenticate, create-role, attach-role-policy or create-bucket-on-destination', () => {
    const ids = buildStepViews(baseInput, []).map((v) => v.id) as string[];
    for (const id of ['authenticate', 'create-role', 'attach-role-policy', 'create-bucket']) {
      expect(ids).not.toContain(id);
    }
  });

  it('leaves every step pending until a matching event lands', () => {
    const views = buildStepViews(baseInput, []);
    expect(views.every((v) => v.state === 'pending')).toBe(true);
  });

  it('marks a step succeeded on step.completed and failed on step.failed with its error message', () => {
    const events: SetupEvent[] = [
      { event: 'step.completed', step: 'import-destination-certificate', at: 't' },
      { event: 'step.completed', step: 'create-source-account', at: 't' },
      {
        event: 'step.failed',
        step: 'create-user',
        at: 't',
        error: { code: 'InternalError', message: 'IAM refused CreateUser: entity already exists' },
      },
    ];
    const views = buildStepViews(baseInput, events);
    expect(views.find((v) => v.id === 'import-destination-certificate')?.state).toBe('succeeded');
    const failed = views.find((v) => v.id === 'create-user');
    expect(failed?.state).toBe('failed');
    expect(failed?.errorMessage).toBe('IAM refused CreateUser: entity already exists');
  });
});

describe('buildStepViews with a globalErrorMessage', () => {
  it('marks the first pending step as failed with the global error message when no step-level failure landed', () => {
    const views = buildStepViews(baseInput, [], { globalErrorMessage: 'network exploded' });
    const firstPending = views[0];
    expect(firstPending.state).toBe('failed');
    expect(firstPending.errorMessage).toBe('network exploded');
    for (const v of views.slice(1)) expect(v.state).toBe('pending');
  });

  it('marks the first still-pending step as failed after some steps already succeeded', () => {
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

  it('leaves the step-level failure in place when both a step.failed and a global error are present', () => {
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
