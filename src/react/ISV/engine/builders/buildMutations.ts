/**
 * Mutation Builder
 *
 * Generates mutation definitions from platform configuration.
 * Handles the standard ISV flow with optional platform-specific steps.
 */

import type {
  PlatformConfig,
  MutationDef,
  SingleMutationDef,
  LoopMutationDef,
  PerBucketStep,
  FormData,
  FullContext,
  PreviousResults,
  BucketItem,
} from '../types';

type AccountResponse = { id: string };

function isAccountResponse(data: unknown): data is AccountResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    typeof (data as AccountResponse).id === 'string'
  );
}

function getAccountId(prev: PreviousResults, ctx: FullContext): string {
  if (ctx.isNewAccount) {
    const data = prev.createAccount?.data;
    if (!isAccountResponse(data)) {
      throw new Error('Account creation response missing or invalid');
    }
    return data.id;
  }
  if (!ctx._existingAccount?.id) {
    throw new Error('Existing account ID not available');
  }
  return ctx._existingAccount.id;
}

/**
 * Standard bucket steps (createBucket + tagBucket)
 */
export const STANDARD_BUCKET_STEPS: PerBucketStep[] = [
  {
    id: 'createBucket',
    label: 'Create Bucket: {{name}}',
    action: 'createBucket',
    variables: (
      form: FormData,
      bucket: BucketItem,
      _prev: PreviousResults
    ) => ({
      Bucket: bucket.name,
      ObjectLockEnabledForBucket: form.enableImmutableBackup,
    }),
  },
  {
    id: 'tagBucket',
    label: 'Tag Bucket: {{name}}',
    action: 'tagBucket',
    variables: (
      _form: FormData,
      bucket: BucketItem,
      _prev: PreviousResults,
      ctx: FullContext
    ) => ({
      Bucket: bucket.name,
      Tagging: {
        TagSet: [{ Key: 'X-Scality-Application', Value: ctx._bucketTag }],
      },
    }),
  },
];

/**
 * Build the SOS API mutation (Veeam VBR only)
 */
export function buildSOSAPIMutation(config: PlatformConfig): SingleMutationDef | null {
  if (!config.sosAPI) return null;

  return {
    id: 'enableSOSAPI',
    label: `Enable ${config.name} Smart Object Storage API`,
    action: 'enableSOSAPI',
    when: (_form: FormData, ctx: FullContext) =>
      ctx._sosApiStatus === 'available',
    variables: () => ({}),
  };
}

/**
 * Build account-related mutations
 */
export function buildAccountMutations(config: PlatformConfig): SingleMutationDef[] {
  return [
    {
      id: 'createAccount',
      label: 'Create Account',
      action: 'createAccount',
      when: (_form: FormData, ctx: FullContext) => ctx.isNewAccount,
      variables: (form: FormData, _prev: PreviousResults, ctx: FullContext) => ({
        user: {
          userName: form.accountName,
          email: `${form.accountName}@artesca.local`,
        },
        instanceId: ctx._instanceId,
      }),
    },
    {
      id: 'refetchConfig',
      label: 'Update Configuration',
      action: 'refetchConfig',
      when: (_form: FormData, ctx: FullContext) => ctx.isNewAccount,
      variables: () => ({}),
    },
    {
      id: 'assumeRole',
      label: 'Assume Account Role',
      action: 'assumeRole',
      variables: (
        _form: FormData,
        prev: PreviousResults,
        ctx: FullContext
      ) => ({
        roleArn: ctx.isNewAccount
          ? `arn:aws:iam::${getAccountId(prev, ctx)}:role/scality-internal/storage-manager-role`
          : ctx._existingAccount!.roleArn,
      }),
    },
  ];
}

/**
 * Build the bucket loop mutation
 */
export function buildBucketLoopMutation(config: PlatformConfig): LoopMutationDef {
  const steps: PerBucketStep[] = [
    ...STANDARD_BUCKET_STEPS,
    ...(config.perBucketSteps ?? []),
  ];

  return {
    each: 'buckets',
    steps,
  };
}

/**
 * Build IAM-related mutations
 */
export function buildIAMMutations(config: PlatformConfig): SingleMutationDef[] {
  return [
    {
      id: 'createIAMUser',
      label: 'Create IAM User',
      action: 'createIAMUser',
      when: (_form: FormData, ctx: FullContext) => ctx.needsIAMUser,
      variables: (form: FormData) => ({
        userName: form.IAMUserName || form.accountName,
      }),
    },
    {
      id: 'createAccessKey',
      label: 'Generate Access Key',
      action: 'createAccessKey',
      when: (_form: FormData, ctx: FullContext) => ctx.needsAccessKey,
      variables: (form: FormData) => ({
        userName: form.IAMUserName || form.accountName,
      }),
    },
    {
      id: 'createPolicy',
      label: (_form: FormData, ctx: FullContext) =>
        ctx.isNewAccount || ctx.needsIAMUser ? 'Create Policy' : 'Update Policy',
      action: 'createPolicy',
      variables: (
        form: FormData,
        prev: PreviousResults,
        ctx: FullContext
      ) => {
        const policyName = `${form.IAMUserName || form.accountName}-${ctx._platformId}-${
          form.enableImmutableBackup ? 'immutable' : 'non-immutable'
        }`;
        const accountId = getAccountId(prev, ctx);
        return {
          policyName,
          bucketsName: form.buckets.map((b) => b.name),
          isImmutable: form.enableImmutableBackup,
          policyArn: `arn:aws:iam::${accountId}:policy/${policyName}`,
          getPolicy: config.policy,
        };
      },
    },
    {
      id: 'attachPolicy',
      label: 'Attach Policy to User',
      action: 'attachPolicy',
      variables: (
        form: FormData,
        prev: PreviousResults,
        ctx: FullContext
      ) => {
        const userName = form.IAMUserName || form.accountName;
        const accountId = getAccountId(prev, ctx);
        return {
          userName,
          policyArn: `arn:aws:iam::${accountId}:policy/${userName}-${ctx._platformId}-${
            form.enableImmutableBackup ? 'immutable' : 'non-immutable'
          }`,
        };
      },
    },
  ];
}

/**
 * Build all mutation definitions for a platform
 *
 * Mutation order:
 * 1. [enableSOSAPI] (if sosAPI: true)
 * 2. createAccount (if new account)
 * 3. refetchConfig (if new account)
 * 4. assumeRole
 * 5. For each bucket:
 *    - createBucket
 *    - tagBucket
 *    - [perBucketSteps]
 * 6. createIAMUser (if needed)
 * 7. createAccessKey (if needed)
 * 8. createPolicy
 * 9. attachPolicy
 */
export function buildMutations(config: PlatformConfig): MutationDef[] {
  // Full override mode - use explicit mutations if provided
  if (config.mutationOverrides) {
    return config.mutationOverrides;
  }

  // Auto-generate standard mutation sequence
  const mutations: MutationDef[] = [];

  // 1. SOS API (optional)
  const sosAPIMutation = buildSOSAPIMutation(config);
  if (sosAPIMutation) {
    mutations.push(sosAPIMutation);
  }

  // 2-4. Account mutations
  mutations.push(...buildAccountMutations(config));

  // 5. Bucket loop
  mutations.push(buildBucketLoopMutation(config));

  // 6-9. IAM mutations
  mutations.push(...buildIAMMutations(config));

  // 10. Additional mutations (appended after auto-generated)
  mutations.push(...(config.additionalMutations ?? []));

  return mutations;
}

/**
 * Check if a mutation definition is a loop mutation
 */
export function isLoopMutation(
  mutation: MutationDef
): mutation is LoopMutationDef {
  return 'each' in mutation;
}

/**
 * Expand a loop mutation into individual steps for a given form
 *
 * For example, with 2 buckets and 3 steps per bucket:
 * Input: { each: 'buckets', steps: [create, tag, setup] }
 * Output: [
 *   { id: 'create-0', ... },
 *   { id: 'tag-0', ... },
 *   { id: 'setup-0', ... },
 *   { id: 'create-1', ... },
 *   { id: 'tag-1', ... },
 *   { id: 'setup-1', ... },
 * ]
 */
export function expandLoopMutation(
  mutation: LoopMutationDef,
  form: FormData,
  ctx: FullContext
): SingleMutationDef[] {
  const items = form[mutation.each];
  if (!Array.isArray(items)) return [];

  const expanded: SingleMutationDef[] = [];

  items.forEach((item: BucketItem, index: number) => {
    for (const step of mutation.steps) {
      // Check if step should be included
      if (step.when && !step.when(form, item, ctx)) {
        continue;
      }

      // Replace {{field}} placeholders in label
      const label = step.label.replace(
        /\{\{(\w+)\}\}/g,
        (_, field) => String(item[field as keyof BucketItem] ?? '')
      );

      expanded.push({
        id: `${step.id}-${index}`,
        label,
        action: step.action,
        variables: (f: FormData, prev: PreviousResults, c: FullContext) =>
          step.variables(f, item, prev, c),
      });
    }
  });

  return expanded;
}

