import type { SetupEvent } from '../../api/types';

export type StepId =
  | 'import-destination-certificate'
  | 'create-source-account'
  | 'create-source-bucket'
  | 'create-account'
  | 'create-user'
  | 'create-access-key'
  | 'create-policy'
  | 'create-role'
  | 'attach-role-policy'
  | 'create-bucket'
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
  targetBucketName: string;
  destinationAccountName: string;
};

export type ChainStepState = 'idle' | 'pending' | 'success' | 'error';
export type ChainStatus = { status: ChainStepState; errorMessage?: string };

export type StepStateSources = {
  configuratorEvents: SetupEvent[];
  chainStatusById: Record<string, ChainStatus | undefined>;
  /** Set when the stream failed without emitting a step.failed to pin the error on a row. */
  configuratorError?: string;
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
    id: 'create-account',
    when: () => true,
    label: (i) => `Create Account on Destination: ${i.destinationAccountName}`,
  },
  { id: 'create-user', when: () => true, label: () => 'Create IAM User' },
  { id: 'create-access-key', when: () => true, label: () => 'Generate Access Key' },
  { id: 'create-policy', when: () => true, label: () => 'Create Policy' },
  { id: 'create-role', when: () => true, label: () => 'Create IAM Role' },
  { id: 'attach-role-policy', when: () => true, label: () => 'Attach Policy to Role' },
  {
    id: 'create-bucket',
    when: (i) => i.createReplicationRule,
    label: (i) => `Create Target Bucket: ${i.targetBucketName}`,
  },
  { id: 'create-location', when: () => true, label: () => 'Create Location' },
  {
    id: 'create-replication-rule',
    when: (i) => i.createReplicationRule,
    label: () => 'Create Replication Rule',
  },
];

/** Contract rows whose state is derived from the crr-configurator NDJSON stream. */
const CONFIGURATOR_STEP_IDS = new Set<StepId>([
  'create-account',
  'create-user',
  'create-access-key',
  'create-policy',
  'create-role',
  'attach-role-policy',
  'create-bucket',
]);

/** The single crr-configurator chain link; every configurator row retries by re-running it. */
export const CONFIGURATOR_CHAIN_LINK_ID = 'configurator-setup';

/**
 * Wizard-run contract row -> the chain link id(s) whose combined status drives it.
 * `create-source-bucket` folds three links — assuming the source role, creating
 * the bucket, enabling versioning — so a failure in any of them (including the
 * otherwise row-less assume-source-role) surfaces on that row instead of leaving
 * the chain silently stuck.
 */
const WIZARD_ROW_LINKS: Partial<Record<StepId, string[]>> = {
  'import-destination-certificate': ['import-destination-certificate'],
  'create-source-account': ['create-source-account'],
  'create-source-bucket': ['assume-source-role', 'create-source-bucket', 'create-source-bucket-versioning'],
  'create-location': ['create-location'],
  'create-replication-rule': ['create-replication-rule'],
};

const configuratorRowState = (events: SetupEvent[], id: StepId): { state: StepState; errorMessage?: string } => {
  let state: StepState = 'pending';
  let errorMessage: string | undefined;
  for (const event of events) {
    if (!('step' in event) || event.step !== id) continue;
    if (event.event === 'step.completed') state = 'succeeded';
    else if (event.event === 'step.failed') {
      state = 'failed';
      errorMessage = event.error.message;
    }
  }
  return { state, errorMessage };
};

const wizardRowState = (
  linkIds: string[],
  chainStatusById: Record<string, ChainStatus | undefined>,
): { state: StepState; errorMessage?: string } => {
  const statuses = linkIds.map((id) => chainStatusById[id]);
  const errored = statuses.find((s) => s?.status === 'error');
  if (errored) return { state: 'failed', errorMessage: errored.errorMessage };
  if (statuses.every((s) => s?.status === 'success')) return { state: 'succeeded' };
  return { state: 'pending' };
};

/**
 * Merges the two state sources into the 12 contract rows: configurator rows come
 * from the NDJSON events, wizard rows from their chain link statuses. A
 * configurator stream failure that pinned no step surfaces on its first pending row.
 */
export const buildStepViews = (input: StepListInput, sources: StepStateSources): StepView[] => {
  const active = STEPS.filter((def) => def.when(input));
  const views: StepView[] = active.map((def, index) => {
    const base = { id: def.id, step: index + 1, label: def.label(input) };
    const { state, errorMessage } = CONFIGURATOR_STEP_IDS.has(def.id)
      ? configuratorRowState(sources.configuratorEvents, def.id)
      : wizardRowState(WIZARD_ROW_LINKS[def.id] ?? [def.id], sources.chainStatusById);
    return { ...base, state, errorMessage };
  });

  if (sources.configuratorError && !views.some((v) => v.state === 'failed')) {
    const firstPendingConfiguratorRow = views.find((v) => CONFIGURATOR_STEP_IDS.has(v.id) && v.state === 'pending');
    if (firstPendingConfiguratorRow) {
      firstPendingConfiguratorRow.state = 'failed';
      firstPendingConfiguratorRow.errorMessage = sources.configuratorError;
    }
  }
  return views;
};

export const retryLinkIdForRow = (id: StepId, chainStatusById: Record<string, ChainStatus | undefined>): string => {
  if (CONFIGURATOR_STEP_IDS.has(id)) return CONFIGURATOR_CHAIN_LINK_ID;
  const links = WIZARD_ROW_LINKS[id] ?? [id];
  // Re-run the failed link of a folded row (e.g. versioning), not one already succeeded.
  return links.find((linkId) => chainStatusById[linkId]?.status === 'error') ?? links[0];
};

export const allSucceeded = (views: StepView[]): boolean => views.every((v) => v.state === 'succeeded');
export const hasFailure = (views: StepView[]): boolean => views.some((v) => v.state === 'failed');
