# ISV Template System Design Document

## 1. Background

### 1.1 Current Problems

The existing ISV system has several pain points:

| Problem | Description |
|---------|-------------|
| **Scattered Configuration** | Field definitions in `fieldOverrides`, validation in separate Joi schema, mutations hardcoded in `ISVApplyActions.tsx` |
| **Difficult to Extend** | Adding a new platform requires modifying 3-4 files |
| **Tight Coupling** | Mutation logic is coupled with components, hard to reuse |
| **High Maintenance Cost** | Separated field and validation definitions can easily become inconsistent |

### 1.2 Design Goals

- **Centralized Configuration**: One Template file defines all platform configuration
- **Declarative Mutations**: Describe execution flow with arrays, not hardcoded logic
- **Preserve Flexibility**: Support custom components and hook extensions
- **Easy to Understand**: New developers can quickly get started

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      ISVTemplate                            │
├─────────────────────────────────────────────────────────────┤
│  Base Info (id, name, logo, description)                    │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Configuration Page                                 │
│  ├── fields[]        → UI field definitions                 │
│  └── validator       → Joi validation schema                │
├─────────────────────────────────────────────────────────────┤
│  Step 2: Apply Actions Page                                 │
│  └── mutations[]     → Declarative mutation pipeline        │
├─────────────────────────────────────────────────────────────┤
│  Step 3: Summary Page                                       │
│  └── summary         → Summary page configuration           │
├─────────────────────────────────────────────────────────────┤
│  Common                                                     │
│  └── skipModalContent, hooks                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Template Compiler                        │
│  - Expands loop mutations                                   │
│  - Generates variables resolvers                            │
│  - Maps actions to mutation hooks                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  useChainedMutations                        │
│  - Sequential execution engine                              │
│  - Retry support                                            │
│  - Status tracking                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Type Definitions

### 3.1 ISVTemplate Main Structure

```typescript
interface ISVTemplate {
  // ============ Base Info ============
  id: string;
  name: string;
  logo: ReactElement;
  description?: ReactNode;

  // ============ Step 1: Configuration Page ============
  fields: FieldDef[];
  validator: Joi.ObjectSchema;

  // ============ Step 2: Apply Actions Page ============
  mutations: MutationDef[];

  // ============ Step 3: Summary Page ============
  summary?: SummaryConfig;

  // ============ Common ============
  skipModalContent?: ReactNode;

  // ============ Extension Points ============
  hooks?: {
    getPolicy?: (buckets: string[], immutable: boolean) => string;
    beforeSubmit?: (form: FormData) => FormData;
  };
}
```

### 3.2 Field Definition (FieldDef)

Fields only define UI rendering and display logic. Validation is handled by the separate Joi schema.

```typescript
interface FieldDef {
  name: string;
  type: 'text' | 'number' | 'toggle' | 'select' | 'bucketArray' | 'custom';
  label: string;

  // UI Properties
  placeholder?: string;
  tooltip?: ReactNode;
  helpText?: string;
  defaultValue?: any;

  // Conditional Display
  showWhen?: (form: FormData) => boolean;

  // For 'select' type
  options?: Array<{ label: string; value: string }>;

  // For 'bucketArray' type
  itemFields?: FieldDef[];

  // For 'custom' type
  render?: (props: FieldRenderProps) => ReactElement;
}
```

### 3.3 Mutation Definition

```typescript
type MutationDef = SingleMutation | LoopMutation;

// Single Mutation
interface SingleMutation {
  id: string;
  label: string;
  action: string;  // Built-in action name
  variables: VariablesConfig;
  when?: (form: FormData) => boolean;
}

// Loop Mutation Group
interface LoopMutation {
  each: string;  // Array field name to loop over
  steps: LoopStep[];
}

interface LoopStep {
  id: string;
  label: string;  // Supports template syntax: {{name}}, {{capacity}}
  action: string;
  variables: LoopVariablesConfig;
  when?: (form: FormData, item: any) => boolean;
}

// Variables Configuration
type VariablesConfig =
  | Record<string, string>  // Simple mapping: { userName: 'accountName' }
  | ((form: FormData, prev: PreviousResults) => Record<string, any>);

type LoopVariablesConfig =
  (form: FormData, prev: PreviousResults, item: any, index: number) => Record<string, any>;
```

### 3.4 Summary Configuration

```typescript
interface SummaryConfig {
  // Service endpoint label (default: "Service point")
  serviceEndpointLabel?: string;

  // Banner above bucket section
  bucketBanner?: ReactNode;

  // Immutability display configuration
  immutability?: {
    show?: boolean | ((form: FormData) => boolean);
    label?: string;
    helpText?: string | ((isImmutable: boolean) => string);
  };

  // Extra sections
  extraSections?: Array<{
    title: string;
    render: (data: SummaryData) => ReactNode;
  }>;
}
```

---

## 4. Built-in Actions

The execution engine provides these built-in actions that map to existing mutation hooks:

| Action | Description | Required Parameters | Maps To |
|--------|-------------|---------------------|---------|
| `enableSOSAPI` | Enable SOS API | - | `useEnableSOSAPIMutation` |
| `createAccount` | Create account | `userName`, `email` | `useCreateAccountMutation` |
| `refetchConfig` | Refresh configuration | - | `useRefetchConfig` |
| `assumeRole` | Assume account role | `roleArn` | `useAssumeRole` |
| `createBucket` | Create bucket | `Bucket`, `ObjectLockEnabledForBucket?` | `useCreateBucket` |
| `tagBucket` | Set bucket tags | `Bucket`, `Tagging` | `useSetBucketTagging` |
| `putObject` | Upload object | `Bucket`, `Key`, `Body`, `ContentType?` | `usePutObject` |
| `createIAMUser` | Create IAM user | `userName` | `useCreateIAMUserMutation` |
| `createAccessKey` | Create access key | `userName` | `useCreateUserAccessKeyMutation` |
| `createPolicy` | Create IAM policy | `policyName`, `buckets`, `isImmutable` | `useCreateOrAddBucketToPolicyMutation` |
| `attachPolicy` | Attach policy to user | `userName`, `policyArn` | `useAttachPolicyToUserMutation` |

---

## 5. Mutation Execution Mechanism

### 5.1 Compilation Phase

The Template Compiler transforms the declarative mutation array into the format required by `useChainedMutations`:

```typescript
// Input: Template mutations
mutations: [
  { id: 'createAccount', action: 'createAccount', ... },
  {
    each: 'buckets',
    steps: [
      { id: 'createBucket', action: 'createBucket', ... },
      { id: 'tagBucket', action: 'tagBucket', ... },
    ],
  },
  { id: 'createPolicy', action: 'createPolicy', ... },
]

// Output: Expanded mutations + variables resolvers
{
  mutations: [
    { id: 'createAccount', label: '...', mutation: createAccountMutation },
    { id: 'createBucket-0', label: '...', hook: useCreateBucket },
    { id: 'tagBucket-0', label: '...', hook: useSetBucketTagging },
    { id: 'createBucket-1', label: '...', hook: useCreateBucket },
    { id: 'tagBucket-1', label: '...', hook: useSetBucketTagging },
    { id: 'createPolicy', label: '...', mutation: createPolicyMutation },
  ],
  variables: {
    'createAccount': (prev) => ({ ... }),
    'createBucket-0': (prev) => ({ ... }),
    'tagBucket-0': (prev) => ({ ... }),
    // ...
  }
}
```

### 5.2 Loop Expansion

Loop mutations (`LoopMutation`) are expanded **per item**, meaning all steps for one item complete before moving to the next:

```typescript
// Form data: buckets = [{ name: 'backup-1' }, { name: 'backup-2' }]

// Expansion order:
1. createBucket-0 (backup-1)
2. tagBucket-0 (backup-1)
3. createBucket-1 (backup-2)
4. tagBucket-1 (backup-2)

// NOT this order:
1. createBucket-0 (backup-1)
2. createBucket-1 (backup-2)  // Wrong: should complete backup-1 first
3. tagBucket-0 (backup-1)
4. tagBucket-1 (backup-2)
```

### 5.3 Execution Phase

Execution is handled by `useChainedMutations`:

1. **Sequential Execution**: Mutations execute one by one in order
2. **Automatic Continuation**: On success, automatically proceeds to next mutation
3. **Error Handling**: On failure, stops execution and enables retry
4. **Result Passing**: Previous results are available via `PreviousResults`

### 5.4 Accessing Previous Results

The `prev` parameter in variables resolvers provides access to completed mutation results:

```typescript
// Access by mutation id (recommended)
variables: (form, prev) => ({
  accountId: prev.createAccount?.data?.id,
})

// Access by index (legacy support)
variables: (form, prev) => ({
  accountId: prev[0]?.data?.id,
})

// Access loop mutation results
variables: (form, prev) => ({
  // Access specific item result
  firstBucketArn: prev['createBucket-0']?.data?.arn,

  // Or collect all results (helper function)
  allBucketArns: form.buckets.map((_, i) =>
    prev[`createBucket-${i}`]?.data?.arn
  ),
})
```

### 5.5 Conditional Execution

Use `when` to control whether a mutation executes:

```typescript
// Single mutation condition
{
  id: 'createAccount',
  action: 'createAccount',
  when: (form) => form.isNewAccount,  // Only when creating new account
  ...
}

// Loop step condition
{
  each: 'buckets',
  steps: [
    {
      id: 'setCapacity',
      action: 'putObject',
      when: (form, item) => item.capacity > 0,  // Only if capacity is set
      ...
    },
  ],
}
```

### 5.6 Label Templates

Loop mutation labels support template syntax for dynamic text:

```typescript
{
  each: 'buckets',
  steps: [
    {
      id: 'createBucket',
      label: 'Create Bucket: {{name}}',  // Replaced with item.name
      ...
    },
  ],
}

// With buckets = [{ name: 'backup-1' }, { name: 'backup-2' }]
// Produces labels:
// - "Create Bucket: backup-1"
// - "Create Bucket: backup-2"
```

---

## 6. Runtime Context Injection

Some values are injected at runtime before form submission:

| Field | Description | Source |
|-------|-------------|--------|
| `_sosApiAvailable` | Whether SOS API is available | `useCheckSOSAPIStatus` |
| `_existingAccountArn` | Selected existing account's role ARN | Account selection |
| `_existingAccountId` | Selected existing account's ID | Account selection |
| `_iamUserType` | 'create' or 'existing' | IAM user selection |

These are prefixed with `_` to indicate they are system-injected, not user input.

---

## 7. Complete Example: Veeam

```typescript
import Joi from 'joi';
import { VeeamLogo } from './components/VeeamLogo';
import { GET_VEEAM_POLICY } from '../utils/ISVPolicy';
import { bucketNameValidationSchema } from '../utils/bucketNameValidation';
import { SYSTEM_XML_CONTENT, VEEAM_XML_PREFIX } from '../constants';

export const VeeamTemplate: ISVTemplate = {
  // ============ Base Info ============
  id: 'veeam-vbr',
  name: 'Veeam Backup & Replication',
  logo: <VeeamLogo />,
  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <VeeamLogo />
      <Text variant="Large" isEmphazed>Veeam Backup & Replication</Text>
    </Stack>
  ),

  // ============ Step 1: Fields ============
  fields: [
    {
      name: 'accountName',
      type: 'text',
      label: 'Account',
      placeholder: 'Enter account name',
      tooltip: (
        <ul>
          <li>Enter a unique ARTESCA account name</li>
          <li>This info won't be required by Veeam console</li>
        </ul>
      ),
    },
    {
      name: 'isNewAccount',
      type: 'toggle',
      label: 'Create New Account',
      defaultValue: true,
    },
    {
      name: 'IAMUserName',
      type: 'text',
      label: 'IAM User Name',
      placeholder: 'Enter IAM user name',
      showWhen: (form) => !form.isNewAccount,
      tooltip: <IAMUserTooltip platform="Veeam" />,
    },
    {
      name: 'generateKey',
      type: 'toggle',
      label: 'Generate New Access Key',
      defaultValue: false,
      showWhen: (form) => !form.isNewAccount,
    },
    {
      name: 'buckets',
      type: 'bucketArray',
      label: 'Buckets',
      itemFields: [
        {
          name: 'name',
          type: 'text',
          label: 'Bucket Name',
          placeholder: 'Enter bucket name',
        },
        {
          name: 'capacity',
          type: 'number',
          label: 'Capacity',
          placeholder: '100',
        },
        {
          name: 'capacityUnit',
          type: 'select',
          label: 'Unit',
          defaultValue: 'GiB',
          options: [
            { label: 'GiB', value: 'GiB' },
            { label: 'TiB', value: 'TiB' },
            { label: 'PiB', value: 'PiB' },
          ],
        },
      ],
    },
    {
      name: 'enableImmutableBackup',
      type: 'toggle',
      label: 'Immutable Backup',
      defaultValue: false,
      tooltip: (
        <ul>
          <li>Uses S3 Object-lock technology</li>
          <li>Data backed up will be immutable</li>
        </ul>
      ),
    },
  ],

  // ============ Step 1: Validation ============
  validator: Joi.object({
    accountName: Joi.string()
      .required()
      .min(3)
      .max(64)
      .pattern(/^[a-z0-9-]+$/),
    isNewAccount: Joi.boolean().required(),
    IAMUserName: Joi.when('isNewAccount', {
      is: false,
      then: Joi.string().required().pattern(/^[a-z0-9-]+$/),
      otherwise: Joi.optional(),
    }),
    generateKey: Joi.when('isNewAccount', {
      is: false,
      then: Joi.boolean(),
      otherwise: Joi.optional(),
    }),
    buckets: Joi.array()
      .min(1)
      .max(20)
      .items(
        Joi.object({
          name: bucketNameValidationSchema,
          capacity: Joi.number().min(1).max(1024).required(),
          capacityUnit: Joi.string().valid('GiB', 'TiB', 'PiB').required(),
        })
      ),
    enableImmutableBackup: Joi.boolean().default(false),
  }),

  // ============ Step 2: Mutations ============
  mutations: [
    // --- SOS API ---
    {
      id: 'enableSOSAPI',
      label: 'Enable Veeam Smart Object Storage API',
      action: 'enableSOSAPI',
      variables: {},
      when: (form) => form._sosApiAvailable,
    },

    // --- Account ---
    {
      id: 'createAccount',
      label: 'Create Account',
      action: 'createAccount',
      variables: (form) => ({
        userName: form.accountName,
        email: `${form.accountName}@artesca.local`,
      }),
      when: (form) => form.isNewAccount,
    },
    {
      id: 'refetchConfig',
      label: 'Update Configuration',
      action: 'refetchConfig',
      variables: {},
      when: (form) => form.isNewAccount,
    },
    {
      id: 'assumeRole',
      label: 'Assume Account Role',
      action: 'assumeRole',
      variables: (form, prev) => ({
        roleArn: prev.createAccount?.data
          ? `arn:aws:iam::${prev.createAccount.data.id}:role/scality-internal/storage-manager-role`
          : form._existingAccountArn,
      }),
    },

    // --- Bucket Loop Group ---
    {
      each: 'buckets',
      steps: [
        {
          id: 'createBucket',
          label: 'Create Bucket: {{name}}',
          action: 'createBucket',
          variables: (form, prev, item) => ({
            Bucket: item.name,
            ObjectLockEnabledForBucket: form.enableImmutableBackup,
          }),
        },
        {
          id: 'tagBucket',
          label: 'Tag Bucket: {{name}}',
          action: 'tagBucket',
          variables: (form, prev, item) => ({
            Bucket: item.name,
            Tagging: {
              TagSet: [
                { Key: 'X-Scality-Application', Value: 'Veeam Backup & Replication' },
              ],
            },
          }),
        },
        {
          id: 'veeamFolder',
          label: 'Prepare Veeam repository: {{name}}',
          action: 'putObject',
          variables: (form, prev, item) => ({
            Bucket: item.name,
            Key: `${VEEAM_XML_PREFIX}/`,
            Body: '',
          }),
        },
        {
          id: 'veeamSystem',
          label: 'Enforce Veeam repository: {{name}}',
          action: 'putObject',
          variables: (form, prev, item) => ({
            Bucket: item.name,
            Key: `${VEEAM_XML_PREFIX}/system.xml`,
            Body: SYSTEM_XML_CONTENT,
            ContentType: 'text/xml',
          }),
        },
        {
          id: 'veeamCapacity',
          label: 'Set repository capacity: {{name}}',
          action: 'putObject',
          variables: (form, prev, item) => ({
            Bucket: item.name,
            Key: `${VEEAM_XML_PREFIX}/capacity.xml`,
            Body: `<capacity>${item.capacityBytes}</capacity>`,
            ContentType: 'text/xml',
          }),
          when: (form, item) => item.capacity > 0,
        },
      ],
    },

    // --- IAM ---
    {
      id: 'createIAMUser',
      label: 'Create IAM User',
      action: 'createIAMUser',
      variables: (form) => ({
        userName: form.IAMUserName || form.accountName,
      }),
      when: (form) => form.isNewAccount || form._iamUserType === 'create',
    },
    {
      id: 'createAccessKey',
      label: 'Generate Access Key',
      action: 'createAccessKey',
      variables: (form) => ({
        userName: form.IAMUserName || form.accountName,
      }),
      when: (form) => form.isNewAccount || form.generateKey,
    },

    // --- Policy ---
    {
      id: 'createPolicy',
      label: 'Create Policy',
      action: 'createPolicy',
      variables: (form, prev) => ({
        policyName: `${form.IAMUserName || form.accountName}-veeam-vbr-${
          form.enableImmutableBackup ? 'immutable' : 'non-immutable'
        }`,
        buckets: form.buckets.map((b) => b.name),
        isImmutable: form.enableImmutableBackup,
      }),
    },
    {
      id: 'attachPolicy',
      label: 'Attach Policy to User',
      action: 'attachPolicy',
      variables: (form, prev) => ({
        userName: form.IAMUserName || form.accountName,
        policyArn: prev.createPolicy.data.arn,
      }),
    },
  ],

  // ============ Step 3: Summary ============
  summary: {
    serviceEndpointLabel: 'Service point',
    bucketBanner: (
      <Banner variant="warning" title="Configuration warning">
        When configuring VBR, "Automatic bucket creation" must be disabled.
        In VBR v12.3.1.1139 and above, this option is enabled by default.
      </Banner>
    ),
    immutability: {
      label: 'Immutable Backup',
      helpText: (isImmutable) =>
        isImmutable
          ? 'Ensure "Make recent backups immutable" is checked when configuring the bucket in Veeam.'
          : undefined,
    },
  },

  // ============ Common ============
  skipModalContent: (
    <Text>
      To restart Veeam assistant, go to <b>Accounts</b> or <b>Data Browser</b>.
    </Text>
  ),

  hooks: {
    getPolicy: GET_VEEAM_POLICY,
  },
};
```

---

## 8. Comparison with Current System

| Aspect | Current System | New Template System |
|--------|----------------|---------------------|
| **Field Definition** | `fieldOverrides` only overrides UI props | Complete field definition |
| **Validation** | Separate Joi schema in module | Co-located in Template file |
| **Mutations** | Hardcoded in component (~500 lines) | Declarative array (~100 lines) |
| **Adding New Platform** | Modify 3-4 files | Create 1 Template file |
| **Loop Logic** | Manual forEach assembly | `each` + `steps` declaration |
| **Conditional Execution** | Scattered if statements | Unified `when` functions |
| **Summary Config** | Spread across multiple props | Grouped in `summary` object |

---

## 9. Implementation Plan

### 9.1 Directory Structure

```
src/react/ISV/
├── templates/                    # NEW: Template definitions
│   ├── index.ts                  # Template registry
│   ├── veeam-vbr.tsx
│   ├── veeam-vbo.tsx
│   └── commvault.tsx
├── engine/                       # NEW: Template engine
│   ├── compiler.ts               # Compiles template to mutations
│   ├── actions.ts                # Action -> Hook mapping
│   ├── FormRenderer.tsx          # Renders fields to UI
│   └── useTemplateMutations.ts   # Wrapper around useChainedMutations
├── components/
│   ├── ISVSteps.tsx
│   ├── ISVConfiguration.tsx      # Uses FormRenderer
│   ├── ISVApplyActions.tsx       # Uses useTemplateMutations (replaces V7)
│   └── ISVSummary.tsx
└── types/
    └── template.ts               # Template type definitions
```

### 9.2 Migration Steps

1. **Phase 1**: Create type definitions and template engine
2. **Phase 2**: Implement FormRenderer for field rendering
3. **Phase 3**: Implement template compiler for mutations
4. **Phase 4**: Migrate Veeam VBR as pilot
5. **Phase 5**: Migrate remaining platforms
6. **Phase 6**: Remove legacy code

### 9.3 Compatibility

- New system can coexist with old system
- Platforms can be migrated one by one
- Built-in actions reuse existing mutation hooks
- `useChainedMutations` remains the execution engine

---

## 10. Error Handling

### 10.1 Compilation Errors

Detected at compile/render time:

- Unknown action name
- Missing required variables
- Invalid field type
- Loop over non-array field

### 10.2 Runtime Errors

Handled by `useChainedMutations`:

- Mutation failure → Shows error status, enables retry
- Variables resolver throws → Shows error, enables retry
- Network errors → Caught and displayed

### 10.3 Retry Mechanism

Each step has a `retry` function that:

1. Clears the error state for that step
2. Re-evaluates the variables resolver
3. Re-executes the mutation
4. On success, continues to next step

---

## 11. Composable Template Pattern

To avoid code duplication across platforms, we use a **Composition Pattern** with reusable blocks.

### 11.1 Block Types

```typescript
// ============ Block Type Definitions ============
interface FieldBlock {
  fields: FieldDef[];
  validator: Joi.ObjectSchema;
}

interface MutationBlock {
  mutations: MutationDef[];
}

type Block = FieldBlock | MutationBlock | (FieldBlock & MutationBlock);
```

### 11.2 Pre-built Blocks

```typescript
// ============ blocks/account.ts ============
export const AccountBlock: FieldBlock & MutationBlock = {
  fields: [
    {
      name: 'accountName',
      type: 'text',
      label: 'Account',
      placeholder: 'Enter account name',
    },
    {
      name: 'isNewAccount',
      type: 'toggle',
      label: 'Create New Account',
      defaultValue: true,
    },
  ],
  validator: Joi.object({
    accountName: Joi.string().required().min(3).max(64).pattern(/^[a-z0-9-]+$/),
    isNewAccount: Joi.boolean().required(),
  }),
  mutations: [
    {
      id: 'createAccount',
      label: 'Create Account',
      action: 'createAccount',
      variables: (form) => ({
        userName: form.accountName,
        email: `${form.accountName}@artesca.local`,
      }),
      when: (form) => form.isNewAccount,
    },
    {
      id: 'refetchConfig',
      label: 'Update Configuration',
      action: 'refetchConfig',
      variables: {},
      when: (form) => form.isNewAccount,
    },
    {
      id: 'assumeRole',
      label: 'Assume Account Role',
      action: 'assumeRole',
      variables: (form, prev) => ({
        roleArn: prev.createAccount?.data
          ? `arn:aws:iam::${prev.createAccount.data.id}:role/scality-internal/storage-manager-role`
          : form._existingAccountArn,
      }),
    },
  ],
};

// ============ blocks/iam.ts ============
export const IAMBlock: FieldBlock & MutationBlock = {
  fields: [
    {
      name: 'IAMUserName',
      type: 'text',
      label: 'IAM User Name',
      showWhen: (form) => !form.isNewAccount,
    },
    {
      name: 'generateKey',
      type: 'toggle',
      label: 'Generate New Access Key',
      defaultValue: false,
      showWhen: (form) => !form.isNewAccount,
    },
  ],
  validator: Joi.object({
    IAMUserName: Joi.when('isNewAccount', {
      is: false,
      then: Joi.string().required().pattern(/^[a-z0-9-]+$/),
      otherwise: Joi.optional(),
    }),
    generateKey: Joi.when('isNewAccount', {
      is: false,
      then: Joi.boolean(),
      otherwise: Joi.optional(),
    }),
  }),
  mutations: [
    {
      id: 'createIAMUser',
      label: 'Create IAM User',
      action: 'createIAMUser',
      variables: (form) => ({
        userName: form.IAMUserName || form.accountName,
      }),
      when: (form) => form.isNewAccount || form._iamUserType === 'create',
    },
    {
      id: 'createAccessKey',
      label: 'Generate Access Key',
      action: 'createAccessKey',
      variables: (form) => ({
        userName: form.IAMUserName || form.accountName,
      }),
      when: (form) => form.isNewAccount || form.generateKey,
    },
    {
      id: 'createPolicy',
      label: 'Create Policy',
      action: 'createPolicy',
      variables: (form, prev) => ({
        policyName: `${form.IAMUserName || form.accountName}-${form._platformId}-${
          form.enableImmutableBackup ? 'immutable' : 'non-immutable'
        }`,
        buckets: form.buckets.map((b) => b.name),
        isImmutable: form.enableImmutableBackup,
      }),
    },
    {
      id: 'attachPolicy',
      label: 'Attach Policy to User',
      action: 'attachPolicy',
      variables: (form, prev) => ({
        userName: form.IAMUserName || form.accountName,
        policyArn: prev.createPolicy.data.arn,
      }),
    },
  ],
};

// ============ blocks/buckets.ts ============
export const BucketsBlock: FieldBlock & MutationBlock = {
  fields: [
    {
      name: 'buckets',
      type: 'bucketArray',
      label: 'Buckets',
      itemFields: [
        {
          name: 'name',
          type: 'text',
          label: 'Bucket Name',
          placeholder: 'Enter bucket name',
        },
      ],
    },
    {
      name: 'enableImmutableBackup',
      type: 'toggle',
      label: 'Immutable Backup',
      defaultValue: false,
    },
  ],
  validator: Joi.object({
    buckets: Joi.array()
      .min(1)
      .max(20)
      .items(
        Joi.object({
          name: bucketNameValidationSchema,
        })
      ),
    enableImmutableBackup: Joi.boolean().default(false),
  }),
  mutations: [
    {
      each: 'buckets',
      steps: [
        {
          id: 'createBucket',
          label: 'Create Bucket: {{name}}',
          action: 'createBucket',
          variables: (form, prev, item) => ({
            Bucket: item.name,
            ObjectLockEnabledForBucket: form.enableImmutableBackup,
          }),
        },
        {
          id: 'tagBucket',
          label: 'Tag Bucket: {{name}}',
          action: 'tagBucket',
          variables: (form, prev, item) => ({
            Bucket: item.name,
            Tagging: {
              TagSet: [
                { Key: 'X-Scality-Application', Value: form._bucketTag },
              ],
            },
          }),
        },
      ],
    },
  ],
};
```

### 11.3 Compose Function

```typescript
// ============ engine/composeTemplate.ts ============

interface TemplateBase {
  id: string;
  name: string;
  logo: ReactElement;
  description?: ReactNode;
}

interface TemplateOverrides {
  // Extend or override fields
  fields?: FieldDef[];

  // Extend validation schema
  validator?: Joi.ObjectSchema;

  // Additional mutations (appended after blocks)
  mutations?: MutationDef[];

  // Steps to insert into bucket loop
  bucketSteps?: LoopStep[];

  // Summary configuration
  summary?: SummaryConfig;

  // Skip modal content
  skipModalContent?: ReactNode;

  // Extension hooks
  hooks?: {
    getPolicy?: (buckets: string[], immutable: boolean) => string;
    beforeSubmit?: (form: FormData) => FormData;
  };
}

export function composeTemplate(
  base: TemplateBase,
  blocks: Block[],
  overrides?: TemplateOverrides
): ISVTemplate {
  // 1. Collect fields from all blocks
  const blockFields = blocks.flatMap((b) => ('fields' in b ? b.fields : []));

  // 2. Merge validators from all blocks
  const blockValidators = blocks
    .filter((b): b is FieldBlock => 'validator' in b)
    .map((b) => b.validator);

  const mergedValidator = blockValidators
    .reduce((acc, v) => acc.concat(v), Joi.object())
    .concat(overrides?.validator ?? Joi.object());

  // 3. Collect mutations from all blocks
  const blockMutations = blocks.flatMap((b) =>
    'mutations' in b ? b.mutations : []
  );

  // 4. Insert bucket steps if provided
  const finalMutations = overrides?.bucketSteps
    ? insertBucketSteps(blockMutations, overrides.bucketSteps)
    : blockMutations;

  // 5. Merge override fields (extend bucket itemFields if specified)
  const mergedFields = mergeFields(blockFields, overrides?.fields ?? []);

  return {
    ...base,
    fields: mergedFields,
    validator: mergedValidator,
    mutations: [...finalMutations, ...(overrides?.mutations ?? [])],
    summary: overrides?.summary,
    skipModalContent: overrides?.skipModalContent,
    hooks: overrides?.hooks,
  };
}

// Helper: Insert steps into bucket loop mutation
function insertBucketSteps(
  mutations: MutationDef[],
  bucketSteps: LoopStep[]
): MutationDef[] {
  return mutations.map((m) => {
    if ('each' in m && m.each === 'buckets') {
      return {
        ...m,
        steps: [...m.steps, ...bucketSteps],
      };
    }
    return m;
  });
}

// Helper: Merge fields, extending itemFields for matching names
function mergeFields(base: FieldDef[], overrides: FieldDef[]): FieldDef[] {
  const result = [...base];

  for (const override of overrides) {
    const existingIndex = result.findIndex((f) => f.name === override.name);

    if (existingIndex >= 0) {
      const existing = result[existingIndex];
      // Merge itemFields for bucketArray type
      if (existing.type === 'bucketArray' && override.itemFields) {
        result[existingIndex] = {
          ...existing,
          itemFields: [...(existing.itemFields ?? []), ...override.itemFields],
        };
      } else {
        // Replace entirely
        result[existingIndex] = { ...existing, ...override };
      }
    } else {
      result.push(override);
    }
  }

  return result;
}
```

### 11.4 Platform Definitions (Minimal Code)

```typescript
// ============ templates/veeam-vbr.ts ============
import { composeTemplate } from '../engine/composeTemplate';
import { AccountBlock, BucketsBlock, IAMBlock } from '../blocks';

export const VeeamTemplate = composeTemplate(
  {
    id: 'veeam-vbr',
    name: 'Veeam Backup & Replication',
    logo: <VeeamLogo />,
    description: (
      <Stack gap="r8">
        <Text variant="Large">Prepare ARTESCA for</Text>
        <VeeamLogo />
      </Stack>
    ),
  },
  [AccountBlock, BucketsBlock, IAMBlock],
  {
    // Extend bucket fields with capacity
    fields: [
      {
        name: 'buckets',
        type: 'bucketArray',
        itemFields: [
          { name: 'capacity', type: 'number', label: 'Capacity' },
          {
            name: 'capacityUnit',
            type: 'select',
            label: 'Unit',
            defaultValue: 'GiB',
            options: [
              { label: 'GiB', value: 'GiB' },
              { label: 'TiB', value: 'TiB' },
              { label: 'PiB', value: 'PiB' },
            ],
          },
        ],
      },
    ],

    // Extend validation
    validator: Joi.object({
      buckets: Joi.array().items(
        Joi.object({
          capacity: Joi.number().min(1).max(1024).required(),
          capacityUnit: Joi.string().valid('GiB', 'TiB', 'PiB').required(),
        })
      ),
    }),

    // Veeam-specific bucket operations
    bucketSteps: [
      {
        id: 'veeamFolder',
        label: 'Prepare Veeam repository: {{name}}',
        action: 'putObject',
        variables: (form, prev, item) => ({
          Bucket: item.name,
          Key: `${VEEAM_XML_PREFIX}/`,
          Body: '',
        }),
      },
      {
        id: 'veeamSystem',
        label: 'Enforce Veeam repository: {{name}}',
        action: 'putObject',
        variables: (form, prev, item) => ({
          Bucket: item.name,
          Key: `${VEEAM_XML_PREFIX}/system.xml`,
          Body: SYSTEM_XML_CONTENT,
          ContentType: 'text/xml',
        }),
      },
      {
        id: 'veeamCapacity',
        label: 'Set repository capacity: {{name}}',
        action: 'putObject',
        variables: (form, prev, item) => ({
          Bucket: item.name,
          Key: `${VEEAM_XML_PREFIX}/capacity.xml`,
          Body: `<capacity>${item.capacityBytes}</capacity>`,
          ContentType: 'text/xml',
        }),
        when: (form, item) => item.capacity > 0,
      },
    ],

    summary: {
      serviceEndpointLabel: 'Service point',
      bucketBanner: (
        <Banner variant="warning" title="Configuration warning">
          When configuring VBR, "Automatic bucket creation" must be disabled.
        </Banner>
      ),
      immutability: {
        label: 'Immutable Backup',
        helpText: (isImmutable) =>
          isImmutable
            ? 'Ensure "Make recent backups immutable" is checked in Veeam.'
            : undefined,
      },
    },

    skipModalContent: (
      <Text>
        To restart Veeam assistant, go to <b>Accounts</b> or <b>Data Browser</b>.
      </Text>
    ),

    hooks: {
      getPolicy: GET_VEEAM_POLICY,
    },
  }
);

// ============ templates/commvault.ts ============
export const CommvaultTemplate = composeTemplate(
  {
    id: 'commvault',
    name: 'Commvault',
    logo: <CommvaultLogo />,
  },
  [AccountBlock, BucketsBlock, IAMBlock],
  {
    summary: {
      bucketBanner: <CommvaultBanner />,
    },
    hooks: {
      getPolicy: GET_COMMVAULT_POLICY,
    },
  }
);

// ============ templates/veeam-vbo.ts ============
export const VeeamVBOTemplate = composeTemplate(
  {
    id: 'veeam-vbo',
    name: 'Veeam Backup for Microsoft 365',
    logo: <VeeamLogo />,
  },
  [AccountBlock, BucketsBlock, IAMBlock],
  {
    summary: {
      immutability: {
        show: (form) => form.application === 'VEEAM_OFFICE_365_V8',
      },
    },
    hooks: {
      getPolicy: GET_VEEAM_POLICY,
    },
  }
);
```

### 11.5 Code Comparison

| Platform | Without Composition | With Composition | Reduction |
|----------|---------------------|------------------|-----------|
| Veeam VBR | ~250 lines | ~80 lines | **68%** |
| Commvault | ~200 lines | ~20 lines | **90%** |
| Veeam VBO | ~220 lines | ~25 lines | **89%** |

### 11.6 Block Responsibility

| Block | Fields | Validation | Mutations |
|-------|--------|------------|-----------|
| `AccountBlock` | accountName, isNewAccount | Account name rules | createAccount, refetchConfig, assumeRole |
| `IAMBlock` | IAMUserName, generateKey | IAM user rules | createIAMUser, createAccessKey, createPolicy, attachPolicy |
| `BucketsBlock` | buckets, enableImmutableBackup | Bucket name rules | createBucket, tagBucket (loop) |

### 11.7 Directory Structure

```
src/react/ISV/
├── blocks/                       # Reusable blocks
│   ├── index.ts
│   ├── account.ts
│   ├── iam.ts
│   └── buckets.ts
├── templates/                    # Platform definitions
│   ├── index.ts
│   ├── veeam-vbr.ts
│   ├── veeam-vbo.ts
│   └── commvault.ts
├── engine/
│   ├── composeTemplate.ts        # Composition function
│   ├── compiler.ts
│   └── ...
└── ...
```
