import type { SetupEvent } from '../../api/types';

export type StepId =
  | 'import-destination-certificate'
  | 'create-source-account'
  | 'create-source-bucket'
  | 'create-destination-account'
  | 'create-user'
  | 'create-access-key'
  | 'create-policy'
  | 'attach-policy'
  | 'create-location'
  | 'create-replication-rule';

export type StepState = 'pending' | 'succeeded' | 'failed';

export type StepView = {
  id: StepId;
  step: number;
  label: string;
  state: StepState;
  errorMessage?: string;
};

export type StepListInput = {
  isNewSourceAccount: boolean;
  createReplicationRule: boolean;
  sourceAccountName: string;
  sourceBucketName: string;
  destinationAccountName: string;
};

export type BuildStepViewsOptions = {
  globalErrorMessage?: string;
};

type StepDef = {
  id: StepId;
  when: (input: StepListInput) => boolean;
  label: (input: StepListInput) => string;
};

const STEPS: StepDef[] = [
  {
    id: 'import-destination-certificate',
    when: () => true,
    label: () => 'Import Destination Certificate',
  },
  {
    id: 'create-source-account',
    when: (i) => i.isNewSourceAccount,
    label: (i) => `Create Account on Source: ${i.sourceAccountName}`,
  },
  {
    id: 'create-source-bucket',
    when: (i) => i.createReplicationRule,
    label: (i) => `Create Bucket on Source: ${i.sourceBucketName}`,
  },
  {
    id: 'create-destination-account',
    when: () => true,
    label: (i) => `Create Account on Destination: ${i.destinationAccountName}`,
  },
  { id: 'create-user', when: () => true, label: () => 'Create IAM User' },
  { id: 'create-access-key', when: () => true, label: () => 'Generate Access Key' },
  { id: 'create-policy', when: () => true, label: () => 'Create Policy' },
  { id: 'attach-policy', when: () => true, label: () => 'Attach Policy to User' },
  { id: 'create-location', when: () => true, label: () => 'Create Location' },
  {
    id: 'create-replication-rule',
    when: (i) => i.createReplicationRule,
    label: () => 'Create Replication Rule',
  },
];

export const buildStepViews = (
  input: StepListInput,
  events: SetupEvent[],
  options: BuildStepViewsOptions = {},
): StepView[] => {
  const active = STEPS.filter((def) => def.when(input));
  const views: StepView[] = active.map((def, index) => {
    let state: StepState = 'pending';
    let errorMessage: string | undefined;
    for (const event of events) {
      if (!('step' in event) || event.step !== def.id) continue;
      if (event.event === 'step.completed') state = 'succeeded';
      else if (event.event === 'step.failed') {
        state = 'failed';
        errorMessage = event.error.message;
      }
    }
    return { id: def.id, step: index + 1, label: def.label(input), state, errorMessage };
  });

  const hasStepFailure = views.some((v) => v.state === 'failed');
  if (options.globalErrorMessage && !hasStepFailure) {
    const firstPending = views.find((v) => v.state === 'pending');
    if (firstPending) {
      firstPending.state = 'failed';
      firstPending.errorMessage = options.globalErrorMessage;
    }
  }
  return views;
};

export const allSucceeded = (views: StepView[]): boolean => views.every((v) => v.state === 'succeeded');
export const hasFailure = (views: StepView[]): boolean => views.some((v) => v.state === 'failed');
