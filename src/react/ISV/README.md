# ISV Template Engine

A declarative API for defining ISV platform configurations. Write minimal config, get complete wizard flows.

## Table of Contents

- [Concepts](#concepts)
- [Quick Start](#quick-start)
- [Decision Guide: When to Use What](#decision-guide-when-to-use-what)
- [API Reference](#api-reference)
  - [Mutation Builders (Advanced)](#mutation-builders-advanced)
- [Examples](#examples)
  - [Examples 1-8: Fields, Validators, Summary](#example-1-simple-platform-commvault)
  - [Example 9: Extra Mutations](#example-9-extra-mutations-append-to-standard-flow)
  - [Examples 10-14: Custom Mutation Orchestration](#example-10-custom-mutation-orchestration-full-override)
- [File Structure](#file-structure)
- [Adding a New Platform](#adding-a-new-platform)
- [Troubleshooting](#troubleshooting)

---

## Concepts

### What is this?

The ISV Template Engine is a **declarative framework** that generates complete configuration wizards for ISV (Independent Software Vendor) integrations. Instead of manually wiring up forms, validations, API calls, and UI states, you describe **what** your platform needs, and the engine generates **how** it works.

### Why does it exist?

Before this engine, adding a new ISV platform meant:

- Copy-pasting 500+ lines of boilerplate
- Manually wiring React Hook Form fields
- Writing Joi validators from scratch
- Chaining 10+ API mutations with error handling
- Building summary screens

Now it's just ~50 lines of config per platform.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         definePlatform()                            │
│   Your config goes in → ISVPlatform object comes out                │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         ISVPlatform                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   fields     │  │  validator   │  │  mutations   │              │
│  │  (auto-gen)  │  │  (auto-gen)  │  │  (auto-gen)  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Runtime Components                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ FormRenderer │  │ MutationExec │  │  ISVSummary  │              │
│  │  (uses fields)│  │(runs mutations)│  │(shows results)│           │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### What gets auto-generated?

| Component | Auto-Generated Content |
|-----------|----------------------|
| **Fields** | Account selector, IAM user selector, bucket array, immutable toggle |
| **Validators** | Account name, bucket name, IAM fields, immutability |
| **Mutations** | Create account → Assume role → Create buckets → Tag buckets → Create IAM user → Create policy → Attach policy |
| **Summary** | Endpoint, credentials, bucket list, immutability status |

### Core Abstractions

| Concept | Description |
|---------|-------------|
| **Platform** | A complete ISV configuration (Veeam, Commvault, etc.) |
| **Field** | A form input (text, toggle, selector, bucket array) |
| **Mutation** | An API action (createAccount, createBucket, etc.) |
| **PerBucketStep** | A mutation that runs once per bucket |
| **FullContext** | Runtime state (account info, SOS API status, etc.) |
| **PreviousResults** | Results from earlier mutations in the chain |

---

## Quick Start

### Simplest Platform (Copy-Paste Template)

```tsx
import { definePlatform } from './engine';
import { GET_MY_POLICY } from './utils/ISVPolicy';
import { MyLogo } from './components/logos/MyLogo';

export const MyPlatform = definePlatform({
  id: 'my-platform',
  name: 'My Platform',
  logo: <MyLogo />,
  policy: GET_MY_POLICY,
  documentationLink: '/docs/my-platform.html',
});
```

That's it. The engine generates:

- Account creation/selection
- IAM user management
- Bucket creation with object-lock support
- Policy creation and attachment
- Summary screen with credentials

### What you get for free

With zero additional config, you get:

1. **Form fields**: Account name, IAM user, bucket name, immutable backup toggle
2. **Validation**: Names follow S3/IAM naming rules
3. **Mutations**: Full account + bucket + IAM setup flow
4. **Summary**: Shows endpoint, credentials, buckets

---

## Decision Guide: When to Use What

### Feature Flags

| Flag | Use When | Example |
|------|----------|---------|
| `sosAPI: true` | Platform needs SOS API (Smart Object Storage) | Veeam VBR |
| `bucketCapacity: true` | Buckets need capacity quotas | Veeam VBR repositories |

### Field Customization

| Approach | Use When | Example |
|----------|----------|---------|
| `fieldOverrides` | Change label, tooltip, placeholder of built-in fields | Rename "Immutable Backup" to "WORM Storage" |
| `additionalFields.afterAccount` | Add fields after account selection | Application version dropdown |
| `additionalFields.afterImmutable` | Add fields after immutable toggle | Repository configuration panel |
| Custom `type: 'custom'` field | Need complex UI that doesn't fit standard types | Multi-step configuration wizard |

### Mutation Customization

| Approach | Use When | Example |
|----------|----------|---------|
| `perBucketSteps` | Add steps after standard bucket create + tag | Upload config files, create folders |
| `additionalMutations` | Append steps after standard flow (no override) | Final cleanup, notifications |
| `mutationOverrides` (full override) | Need completely custom mutation flow | Skip IAM, reorder steps |
| `when` function | Conditionally skip a step | Skip immutable setup when toggle is off |
| `buildAccountMutations()` | Reuse standard account setup in custom flow | Custom flow that still needs account |
| `buildBucketLoopMutation()` | Reuse standard bucket loop in custom flow | Insert steps between account and IAM |
| `buildIAMMutations()` | Reuse standard IAM setup in custom flow | Custom flow that still needs IAM |
| `STANDARD_BUCKET_STEPS` | Reference standard bucket steps directly | Understand what's auto-generated |

**Decision Tree:**

```
Need to customize mutations?
│
├─ Add steps per bucket (after createBucket + tagBucket)?
│   └─ Use `perBucketSteps`
│
├─ Add steps at the END of standard flow?
│   └─ Use `additionalMutations` (simplest, no override needed)
│
├─ Need to REORDER or SKIP standard steps?
│   └─ Use `mutationOverrides` (full override)
│       ├─ Keep standard account flow? → `...buildAccountMutations(config)`
│       ├─ Keep standard bucket flow? → `buildBucketLoopMutation(config)`
│       └─ Keep standard IAM flow? → `...buildIAMMutations(config)`
│
└─ Conditionally skip a single step?
    └─ Use `when` function on that step
```

### Validation Customization

| Approach | Use When | Example |
|----------|----------|---------|
| Default validators | Standard account + bucket + IAM validation | Most platforms |
| `customValidator` | Need additional fields validated | Veeam VBO needs `application` field |
| Compose from parts | Mix and match validation rules | `...bucketsWithCapacityValidator` for capacity |

### Summary Customization

| Approach | Use When | Example |
|----------|----------|---------|
| `summary.serviceEndpointLabel` | Different label for endpoint | "Service Host" vs "Service Endpoint" |
| `summary.bucketBanner` | Show warning/info above buckets | Veeam auto-bucket warning |
| `summary.immutabilityHelpText` | Add context about immutability | "Enable WORM in app" instructions |
| `summary.customRender` | Completely custom summary screen | Auto-repository results |

### Disabled State

| Approach | Use When | Example |
|----------|----------|---------|
| `disabledMessage` component | Platform needs prerequisites | SOS API must be accessible |

---

## API Reference

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `id` | `ISVId` | Unique platform identifier (add to `types.ts` first) |
| `name` | `string` | Display name |
| `logo` | `ReactElement` | Platform logo component |
| `policy` | `(buckets, isImmutable) => string` | IAM policy generator |
| `documentationLink` | `string` | Link to documentation |

### Optional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `assistant` | `boolean` | `true` | Enable configuration wizard |
| `application` | `string` | - | Application tag value |
| `bucketTag` | `string` | `name` | Tag value for buckets |
| `description` | `ReactNode` | - | Wizard header content |
| `skipModalContent` | `ReactNode` | - | Content shown when skipping |

### Feature Flags

```tsx
definePlatform({
  // ...
  sosAPI: true,          // Enable SOS API integration
  bucketCapacity: true,  // Add capacity fields to buckets
});
```

### Field Overrides

Customize default fields without redefining them:

```tsx
definePlatform({
  // ...
  fieldOverrides: {
    accountName: {
      label: 'Custom Account Label',
      tooltip: <MyTooltip />,
      placeholder: 'Enter account...',
    },
    enableImmutableBackup: {
      label: 'WORM Storage',
      hideWhen: (form) => form.application !== 'v8',  // Conditionally hide
    },
  },
});
```

Available fields: `accountName`, `bucketName`, `enableImmutableBackup`, `IAMUserName`, `capacity`

### Additional Custom Fields

```tsx
definePlatform({
  // ...
  additionalFields: {
    afterAccount: [
      { name: 'customField', type: 'text', label: 'My Field' },
    ],
    afterImmutable: [
      { name: 'config', type: 'custom', label: '', render: () => <MyComponent /> },
    ],
  },
});
```

### Per-Bucket Steps

Add custom mutation steps that run for each bucket:

```tsx
definePlatform({
  // ...
  perBucketSteps: [
    {
      id: 'setupFolder',
      label: 'Create folder: {{name}}',  // {{name}} replaced with bucket.name
      action: 'putObject',
      when: (form, bucket, ctx) => form.enableImmutableBackup,  // Optional condition
      variables: (form, bucket, prev, ctx) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: 'my-folder/',
        Body: '',
      }),
    },
  ],
});
```

### Additional Mutations

Append mutations after the auto-generated flow without overriding:

```tsx
definePlatform({
  // ...
  additionalMutations: [
    {
      id: 'finalCleanup',
      label: 'Finalize configuration',
      action: 'refetchConfig',
      variables: () => ({}),
    },
    {
      id: 'notify',
      label: 'Send notification',
      action: 'putObject',
      variables: (form, prev, ctx) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: form.buckets[0].name,
        Key: '.setup-complete',
        Body: JSON.stringify({ completedAt: new Date().toISOString() }),
      }),
    },
  ],
});
```

**When to use `additionalMutations` vs `perBucketSteps` vs `mutationOverrides`:**

| Option | Runs | Use Case |
|--------|------|----------|
| `perBucketSteps` | Once per bucket, after createBucket + tagBucket | Bucket-specific setup |
| `additionalMutations` | Once, after all standard mutations | Final steps, cleanup, notifications |
| `mutationOverrides` | Replaces all auto-generated mutations | Full control over flow |

### FullContext

The `ctx` parameter provides runtime context:

```tsx
type FullContext = {
  // Runtime state (from hooks/store)
  _sosApiStatus: 'activated' | 'available' | 'wrongAccess' | 'unauthorized';
  _existingAccount: { id: string; name: string; roleArn: string } | null;
  _platformId: string;      // e.g., 'veeam-vbr'
  _bucketTag: string;       // Tag value for buckets
  _instanceId: string;      // Instance identifier

  // Computed helpers (derived from form + runtime)
  isNewAccount: boolean;    // true if accountNameType === 'create'
  needsIAMUser: boolean;    // true if creating new IAM user
  needsAccessKey: boolean;  // true if generating new access key
};
```

Usage:

```tsx
{
  id: 'createAccount',
  action: 'createAccount',
  when: (_form, ctx) => ctx.isNewAccount,  // Only run if creating new account
  variables: (form, prev, ctx) => ({
    instanceId: ctx._instanceId,
  }),
}
```

### PreviousResults

Access results from earlier mutation steps:

```tsx
type PreviousResults = Record<string, { data?: unknown; error?: Error }>;
```

Common patterns:

```tsx
// Get S3 client from assumeRole step
prev.assumeRole?.data

// Get new account info
prev.createAccount?.data  // { id: string }

// Get IAM user info
prev.createIAMUser?.data  // { userName: string }
```

### Summary Configuration

Customize the summary screen display:

```tsx
definePlatform({
  // ...
  summary: {
    serviceEndpointLabel: 'Service Host',
    bucketBanner: <MyWarningBanner />,
    immutabilityLabel: 'WORM Lock',
    immutabilityHelpText: (enabled) => enabled ? 'Enable WORM in app' : undefined,
    customRender: (props: SummaryRenderProps) => <MySummaryComponent {...props} />,
  },
});
```

**Type signature:**
```typescript
type SummaryRenderProps = {
  formData: FormData;
  accessKey: string;
  secretKey: string;
  accessKeys?: string[];
  onFinish: () => void;
  renderDefault: () => React.ReactNode;
};

customRender?: (props: SummaryRenderProps) => React.ReactNode;
```

### Custom Validator

```tsx
import Joi from '@hapi/joi';
import { accountValidator, iamValidator, bucketsValidator, immutableValidator } from './engine';

// Compose from parts
const MyValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsValidator,
  ...immutableValidator,
  myCustomField: Joi.string().required(),
});

definePlatform({
  // ...
  customValidator: MyValidator,
});
```

### Disabled State

```tsx
const MyDisabledMessage = ({ onDisabledChange }) => {
  const isReady = useMyCheck();
  
  useEffect(() => {
    onDisabledChange?.(!isReady);
  }, [isReady, onDisabledChange]);
  
  if (!isReady) {
    return <Text>Prerequisites not met</Text>;
  }
  return null;
};

definePlatform({
  // ...
  disabledMessage: MyDisabledMessage,
});
```

### Available Actions

For `perBucketSteps` and custom mutations:

| Action | Description | Returns |
|--------|-------------|---------|
| `enableSOSAPI` | Enable SOS API | - |
| `createAccount` | Create new account | `{ id: string }` |
| `refetchConfig` | Refresh configuration | - |
| `assumeRole` | Assume IAM role | S3 client |
| `createBucket` | Create S3 bucket | - |
| `tagBucket` | Tag bucket with application | - |
| `putObject` | Upload object to bucket | - |
| `createIAMUser` | Create IAM user | `{ userName: string }` |
| `createAccessKey` | Generate access key | `{ accessKey, secretKey }` |
| `createPolicy` | Create IAM policy | - |
| `attachPolicy` | Attach policy to user | - |

### Mutation Builders (Advanced)

The engine exports reusable mutation building blocks for custom orchestration:

```tsx
import {
  buildSOSAPIMutation,
  buildAccountMutations,
  buildBucketLoopMutation,
  buildIAMMutations,
  STANDARD_BUCKET_STEPS,
} from './engine';
```

| Builder | Returns | Description |
|---------|---------|-------------|
| `buildSOSAPIMutation(config)` | `SingleMutationDef \| null` | SOS API enablement step |
| `buildAccountMutations(config)` | `SingleMutationDef[]` | [createAccount, refetchConfig, assumeRole] |
| `buildBucketLoopMutation(config)` | `LoopMutationDef` | Bucket loop with standard + custom steps |
| `buildIAMMutations(config)` | `SingleMutationDef[]` | [createIAMUser, createAccessKey, createPolicy, attachPolicy] |
| `STANDARD_BUCKET_STEPS` | `PerBucketStep[]` | [createBucket, tagBucket] |

---

## Examples

### Example 1: Simple Platform (Commvault)

Minimal config with label customizations:

```tsx
export const CommvaultPlatform = definePlatform({
  id: 'commvault',
  name: 'Commvault',
  logo: <CommvaultLogo />,
  policy: GET_COMMVAULT_POLICY,
  documentationLink: '/docs/commvault.html',

  // Just rename some labels
  fieldOverrides: {
    enableImmutableBackup: { label: 'WORM bucket' },
  },

  summary: {
    serviceEndpointLabel: 'Service Host',
    immutabilityLabel: 'WORM Storage lock',
  },

  customValidator: CommvaultValidator,
});
```

### Example 2: Platform with Application Selection (Veeam VBO)

Add a dropdown after account selection:

```tsx
export const VeeamVBOPlatform = definePlatform({
  id: 'veeam-vbo',
  name: 'Veeam VB365',
  logo: <VeeamLogo />,
  policy: GET_VEEAM_POLICY,
  documentationLink: '/docs/veeam-vbo.html',

  // Additional application selector after account
  additionalFields: {
    afterAccount: [
      {
        name: 'application',
        type: 'select',
        label: 'Veeam application',
        tooltip: <ApplicationTooltip />,
        defaultValue: 'Veeam Backup for Microsoft 365',
        options: [
          { label: 'Veeam Backup for Microsoft 365', value: 'Veeam Backup for Microsoft 365' },
          { label: 'Veeam Backup for Microsoft 365 v8', value: 'Veeam Backup for Microsoft 365 v8' },
        ],
      },
    ],
  },

  // Conditionally hide immutable toggle based on application
  fieldOverrides: {
    enableImmutableBackup: {
      hideWhen: (form) => form.application !== 'Veeam Backup for Microsoft 365 v8',
    },
  },

  customValidator: VeeamVBOValidator,
});
```

### Example 3: Platform with Capacity and Per-Bucket Steps (Veeam VBR)

Full-featured platform with SOS API, capacity, and custom bucket setup:

```tsx
export const VeeamVBRPlatform = definePlatform({
  id: 'veeam-vbr',
  name: 'Veeam',
  logo: <VeeamLogo />,
  policy: GET_VEEAM_POLICY,
  documentationLink: '/docs/veeam.html',
  disabledMessage: VeeamVBRDisabledMessage,  // Check SOS API access

  // Enable features
  sosAPI: true,
  bucketCapacity: true,

  // Customize all labels
  fieldOverrides: {
    accountName: {
      label: 'Account',
      tooltip: <AccountTooltip platform="Veeam" />,
    },
    capacity: {
      label: 'Repository Capacity',
      tooltip: <CapacityTooltip />,
    },
  },

  // Upload Veeam config files to each bucket
  perBucketSteps: [
    {
      id: 'veeamFolder',
      label: 'Create Veeam folder: {{name}}',
      action: 'putObject',
      variables: (form, bucket, prev) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: '.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/',
        Body: '',
      }),
    },
    {
      id: 'veeamSystem',
      label: 'Setup repository: {{name}}',
      action: 'putObject',
      variables: (form, bucket, prev) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: '.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/system.xml',
        Body: SYSTEM_XML_CONTENT,
        ContentType: 'text/xml',
      }),
    },
    {
      id: 'veeamCapacity',
      label: 'Set capacity: {{name}}',
      action: 'putObject',
      variables: (form, bucket, prev) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: '.system-d26a9498-cb7c-4a87-a44a-8ae204f5ba6c/capacity.xml',
        Body: GET_CAPACITY_XML_CONTENT(String(bucket.capacityBytes ?? 0)),
        ContentType: 'text/xml',
      }),
    },
  ],

  // Additional fields after immutable toggle
  additionalFields: {
    afterImmutable: [
      {
        name: 'veeamRepositoryConfig',
        type: 'custom',
        label: '',
        render: () => <VeeamRepositoryFields />,
      },
    ],
  },

  // Summary with warning banner
  summary: {
    bucketBanner: <VeeamBucketBanner />,
    immutabilityHelpText: (enabled) =>
      enabled ? 'Ensure "Make recent backups immutable" is checked in Veeam.' : undefined,
  },

  customValidator: VeeamVBRValidator,
});
```

### Example 4: Field Types Reference

All available field types:

```tsx
additionalFields: {
  afterAccount: [
    // Text input
    {
      name: 'serverName',
      type: 'text',
      label: 'Server Name',
      placeholder: 'Enter server name',
      tooltip: <Text>Your backup server hostname</Text>,
    },

    // Number input
    {
      name: 'retentionDays',
      type: 'number',
      label: 'Retention Days',
      defaultValue: 30,
    },

    // Toggle (boolean)
    {
      name: 'enableEncryption',
      type: 'toggle',
      label: 'Enable Encryption',
      defaultValue: true,
      helpText: 'Encrypts data at rest',
    },

    // Select (dropdown)
    {
      name: 'region',
      type: 'select',
      label: 'Region',
      options: [
        { label: 'US East', value: 'us-east-1' },
        { label: 'EU West', value: 'eu-west-1' },
      ],
      defaultValue: 'us-east-1',
    },

    // Conditional field (only show when another field matches)
    {
      name: 'encryptionKey',
      type: 'text',
      label: 'Encryption Key',
      showWhen: (form) => form.enableEncryption === true,
    },

    // Custom component (full control)
    {
      name: 'advancedConfig',
      type: 'custom',
      label: '',
      render: ({ control, errors, formValues }) => (
        <MyAdvancedConfigPanel
          control={control}
          errors={errors}
          values={formValues}
        />
      ),
    },
  ],
},
```

### Example 5: Conditional Per-Bucket Steps

Only run certain steps based on form values:

```tsx
perBucketSteps: [
  {
    id: 'createVersioning',
    label: 'Enable versioning: {{name}}',
    action: 'putObject',
    // Only run if versioning is enabled
    when: (form, bucket, ctx) => form.enableVersioning === true,
    variables: (form, bucket, prev, ctx) => ({
      s3Client: prev.assumeRole?.data,
      Bucket: bucket.name,
      // ...
    }),
  },
  {
    id: 'createLifecycle',
    label: 'Set lifecycle: {{name}}',
    action: 'putObject',
    // Only run for buckets with capacity set
    when: (form, bucket, ctx) => bucket.capacity !== undefined && bucket.capacity > 0,
    variables: (form, bucket, prev, ctx) => ({
      // ...
    }),
  },
],
```

### Example 6: Custom Validator Composition

Build validators from reusable parts:

```tsx
import Joi from '@hapi/joi';
import {
  accountValidator,
  iamValidator,
  bucketsValidator,
  bucketsWithCapacityValidator,
  immutableValidator,
} from './engine/validators';

// Standard platform (no capacity)
const StandardValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsValidator,
  ...immutableValidator,
});

// Platform with capacity
const CapacityValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsWithCapacityValidator,
  ...immutableValidator,
});

// Platform with custom fields
const CustomValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsValidator,
  ...immutableValidator,
  // Add custom field validation
  application: Joi.string().valid('v7', 'v8').required(),
  retentionDays: Joi.number().min(1).max(365).optional(),
});

// Conditional validation
const ConditionalValidator = Joi.object({
  ...accountValidator,
  ...iamValidator,
  ...bucketsValidator,
  enableImmutableBackup: Joi.when('application', {
    is: 'v8',
    then: Joi.boolean().required(),
    otherwise: Joi.optional(),
  }),
});
```

### Example 7: Disabled Message Component

Check prerequisites before allowing configuration:

```tsx
import { useEffect } from 'react';
import { Text } from '@scality/core-ui';
import { useCheckSOSAPIStatus } from '../hooks/useCheckSOSAPIStatus';

const VeeamDisabledMessage = ({ onDisabledChange }) => {
  const status = useCheckSOSAPIStatus();

  useEffect(() => {
    const isDisabled = status === 'wrongAccess' || status === 'unauthorized';
    onDisabledChange?.(isDisabled);
  }, [status, onDisabledChange]);

  if (status === 'wrongAccess') {
    return (
      <Text>
        Smart Object Storage API is not available.
        Ensure you're connected via Management IP.
      </Text>
    );
  }
  
  if (status === 'unauthorized') {
    return (
      <Text>
        Platform admin access required to configure Veeam.
      </Text>
    );
  }
  
  return null;
};

export const VeeamVBRPlatform = definePlatform({
  // ...
  disabledMessage: VeeamDisabledMessage,
});
```

### Example 8: Custom Summary Component

Full control over the summary screen:

```tsx
const MySummaryComponent = (props: SummaryRenderProps) => {
  const { formData, accessKey, secretKey, onFinish, renderDefault } = props;
  
  return (
    <Stack>
      <Text variant="Large">Configuration Complete!</Text>
      
      <Card>
        <Text isEmphazed>Credentials</Text>
        <CopyableText label="Access Key" value={accessKey} />
        <CopyableText label="Secret Key" value={secretKey} />
      </Card>

      <Card>
        <Text isEmphazed>Buckets Created</Text>
        {formData.buckets.map((bucket) => (
          <Text key={bucket.name}>{bucket.name}</Text>
        ))}
      </Card>

      {formData.enableImmutableBackup && (
        <Banner variant="info">
          Remember to enable immutability in your backup application.
        </Banner>
      )}

      <Button onClick={onFinish}>Done</Button>
    </Stack>
  );
};

definePlatform({
  // ...
  summary: {
    customRender: MySummaryComponent,
  },
});
```

### Example 9: Extra Mutations (Append to Standard Flow)

Add steps at the end without overriding anything:

```tsx
export const MyPlatform = definePlatform({
  id: 'my-platform',
  name: 'My Platform',
  logo: <MyLogo />,
  policy: GET_MY_POLICY,
  documentationLink: '/docs/my-platform.html',

  // Standard flow runs first, then these run at the end
  additionalMutations: [
    {
      id: 'createReadme',
      label: 'Create README in first bucket',
      action: 'putObject',
      variables: (form, prev, ctx) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: form.buckets[0].name,
        Key: 'README.md',
        Body: `# ${form.accountName}\nSetup completed for ${ctx._platformId}`,
      }),
    },
    {
      id: 'logSetup',
      label: 'Log setup completion',
      action: 'putObject',
      when: (form) => form.buckets.length > 1,  // Only if multiple buckets
      variables: (form, prev) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: form.buckets[0].name,
        Key: '.logs/setup.json',
        Body: JSON.stringify({
          buckets: form.buckets.map((b) => b.name),
          timestamp: new Date().toISOString(),
        }),
      }),
    },
  ],
});

// Execution order:
// 1. createAccount (if new)
// 2. refetchConfig (if new)
// 3. assumeRole
// 4. For each bucket: createBucket, tagBucket
// 5. createIAMUser, createAccessKey, createPolicy, attachPolicy
// 6. createReadme  ← additionalMutations
// 7. logSetup      ← additionalMutations
```

### Example 10: Custom Mutation Orchestration (Full Override)

When you need complete control over the mutation flow, use the `mutationOverrides` option:

```tsx
import {
  buildAccountMutations,
  buildBucketLoopMutation,
  buildIAMMutations,
} from './engine';

export const MyPlatform = definePlatform({
  id: 'my-platform',
  name: 'My Platform',
  logo: <MyLogo />,
  policy: GET_MY_POLICY,
  documentationLink: '/docs/my-platform.html',

  // Full control over mutation order
  mutationOverrides: [
    // Use standard account mutations
    ...buildAccountMutations({ policy: GET_MY_POLICY }),

    // Custom step before bucket creation
    {
      id: 'preCheck',
      label: 'Pre-flight check',
      action: 'refetchConfig',
      variables: () => ({}),
    },

    // Standard bucket loop
    buildBucketLoopMutation({ policy: GET_MY_POLICY }),

    // Custom step after buckets, before IAM
    {
      id: 'postBucketSetup',
      label: 'Finalize bucket configuration',
      action: 'putObject',
      variables: (form, prev, ctx) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: form.buckets[0].name,
        Key: '.config/setup-complete',
        Body: JSON.stringify({ timestamp: Date.now() }),
      }),
    },

    // Standard IAM mutations
    ...buildIAMMutations({ policy: GET_MY_POLICY }),
  ],
});
```

### Example 11: Compose Mutation Blocks

Mix standard blocks with custom mutations for maximum flexibility:

```tsx
import {
  buildSOSAPIMutation,
  buildAccountMutations,
  buildBucketLoopMutation,
  buildIAMMutations,
  STANDARD_BUCKET_STEPS,
} from './engine';

// Scenario: Skip IAM user creation, use account-level credentials
export const NoIAMPlatform = definePlatform({
  id: 'no-iam-platform',
  name: 'Simple Platform',
  logo: <SimpleLogo />,
  policy: GET_SIMPLE_POLICY,
  documentationLink: '/docs/simple.html',

  mutationOverrides: [
    ...buildAccountMutations({ policy: GET_SIMPLE_POLICY }),
    buildBucketLoopMutation({ policy: GET_SIMPLE_POLICY }),
    // Omit buildIAMMutations() - no IAM user needed
  ],
});

// Scenario: Custom bucket steps without standard ones
export const CustomBucketPlatform = definePlatform({
  id: 'custom-bucket',
  name: 'Custom Bucket Platform',
  logo: <CustomLogo />,
  policy: GET_CUSTOM_POLICY,
  documentationLink: '/docs/custom.html',

  mutationOverrides: [
    ...buildAccountMutations({ policy: GET_CUSTOM_POLICY }),

    // Custom bucket loop (no standard createBucket + tagBucket)
    {
      each: 'buckets',
      steps: [
        // Only our custom steps
        {
          id: 'customBucketSetup',
          label: 'Setup bucket: {{name}}',
          action: 'createBucket',
          variables: (form, bucket, prev) => ({
            s3Client: prev.assumeRole?.data,
            request: {
              Bucket: bucket.name,
              ObjectLockEnabledForBucket: false,  // Force no object lock
            },
          }),
        },
      ],
    },

    ...buildIAMMutations({ policy: GET_CUSTOM_POLICY }),
  ],
});
```

### Example 12: Reorder Mutation Blocks

Change the execution order of mutation blocks:

```tsx
import {
  buildAccountMutations,
  buildBucketLoopMutation,
  buildIAMMutations,
} from './engine';

// Scenario: Create IAM user BEFORE bucket creation
export const IAMFirstPlatform = definePlatform({
  id: 'iam-first',
  name: 'IAM First Platform',
  logo: <Logo />,
  policy: GET_POLICY,
  documentationLink: '/docs/iam-first.html',

  mutationOverrides: [
    // 1. Account setup
    ...buildAccountMutations({ policy: GET_POLICY }),

    // 2. IAM setup FIRST (before buckets)
    ...buildIAMMutations({ policy: GET_POLICY }),

    // 3. Bucket creation (uses IAM user's credentials)
    buildBucketLoopMutation({ policy: GET_POLICY }),
  ],
});
```

### Example 13: Extend Standard Bucket Steps

Add steps to the standard bucket flow while keeping createBucket + tagBucket:

```tsx
import { STANDARD_BUCKET_STEPS } from './engine';

export const ExtendedBucketPlatform = definePlatform({
  id: 'extended-bucket',
  name: 'Extended Platform',
  logo: <Logo />,
  policy: GET_POLICY,
  documentationLink: '/docs/extended.html',

  // perBucketSteps are ADDED after STANDARD_BUCKET_STEPS
  // No need to manually include createBucket + tagBucket
  perBucketSteps: [
    {
      id: 'enableVersioning',
      label: 'Enable versioning: {{name}}',
      action: 'putObject',
      variables: (form, bucket, prev) => ({
        // This runs after createBucket and tagBucket
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: '.versioning-enabled',
        Body: '',
      }),
    },
  ],
});

// What actually runs per bucket:
// 1. createBucket (from STANDARD_BUCKET_STEPS)
// 2. tagBucket (from STANDARD_BUCKET_STEPS)
// 3. enableVersioning (from perBucketSteps)
```

### Example 14: Replace Standard Bucket Steps

If you need to completely replace the standard bucket steps:

```tsx
import {
  buildAccountMutations,
  buildIAMMutations,
} from './engine';

export const ReplacedBucketPlatform = definePlatform({
  id: 'replaced-bucket',
  name: 'Replaced Steps Platform',
  logo: <Logo />,
  policy: GET_POLICY,
  documentationLink: '/docs/replaced.html',

  mutationOverrides: [
    ...buildAccountMutations({ policy: GET_POLICY }),

    // Completely custom bucket loop
    {
      each: 'buckets',
      steps: [
        // Our own createBucket with custom logic
        {
          id: 'createBucket',
          label: 'Create bucket: {{name}}',
          action: 'createBucket',
          variables: (form, bucket, prev) => ({
            s3Client: prev.assumeRole?.data,
            request: {
              Bucket: bucket.name,
              ObjectLockEnabledForBucket: form.enableImmutableBackup,
              // Custom: Add bucket policy inline
              ACL: 'private',
            },
          }),
        },
        // Skip tagBucket - we don't want tagging
        // Add our custom step
        {
          id: 'initBucket',
          label: 'Initialize: {{name}}',
          action: 'putObject',
          variables: (form, bucket, prev) => ({
            s3Client: prev.assumeRole?.data,
            Bucket: bucket.name,
            Key: 'README.md',
            Body: `# ${bucket.name}\nCreated by ISV wizard`,
          }),
        },
      ],
    },

    ...buildIAMMutations({ policy: GET_POLICY }),
  ],
});
```

---

## File Structure

```
ISV/
├── engine/
│   ├── index.ts              # Public API exports
│   ├── definePlatform.ts     # Main definePlatform function
│   ├── types.ts              # All type definitions
│   ├── validators.ts         # Joi schemas (composable)
│   └── builders/
│       ├── buildFields.ts    # Generates field definitions
│       ├── buildMutations.ts # Generates mutation chain
│       └── index.ts          # Builder exports
├── platforms/
│   ├── index.ts              # Platform exports
│   ├── registry.ts           # Platform registry (array of all platforms)
│   ├── veeam-vbr.tsx         # Complex: SOS API, capacity, per-bucket steps
│   ├── veeam-vbo.tsx         # Medium: application selector, conditional fields
│   └── commvault.tsx         # Simple: just label overrides
├── components/
│   ├── FormRenderer.tsx      # Renders fields from platform.fields
│   ├── ISVSummary.tsx        # Renders summary from platform.summary
│   ├── ISVConfiguration.tsx  # Main wizard component
│   ├── fields/               # Field type components
│   ├── logos/                # Platform logo components
│   └── shared/               # Reusable UI components
├── hooks/
│   ├── useMutationExecutor.ts  # Runs mutation chain
│   ├── useCheckSOSAPIStatus.ts # SOS API status check
│   └── ...
├── utils/
│   ├── ISVPolicy.ts          # Policy generators
│   └── capacityCalculations.ts
└── types/
    └── index.ts              # Shared types
```

---

## Adding a New Platform

### Step 1: Add Platform ID

In `engine/types.ts`, add your ID to `ISVId`:

```tsx
export type ISVId =
  | 'veeam-vbr'
  | 'commvault'
  | 'veeam-vbo'
  | 'my-platform'  // ← Add here
  // ...
```

### Step 2: Create Policy Function

In `utils/ISVPolicy.ts`:

```tsx
export const GET_MY_POLICY = (buckets: string[], isImmutable: boolean): string => {
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['s3:*'],
        Resource: buckets.flatMap((bucket) => [
          `arn:aws:s3:::${bucket}`,
          `arn:aws:s3:::${bucket}/*`,
        ]),
      },
      // Add immutable-specific permissions if needed
      ...(isImmutable ? [/* lock permissions */] : []),
    ],
  });
};
```

### Step 3: Create Platform File

In `platforms/my-platform.tsx`:

```tsx
import { Stack, Text } from '@scality/core-ui';
import { definePlatform } from '../engine';
import { GET_MY_POLICY } from '../utils/ISVPolicy';
import { MyLogo } from '../components/logos/MyLogo';

export const MyPlatform = definePlatform({
  id: 'my-platform',
  name: 'My Platform',
  logo: <MyLogo />,
  policy: GET_MY_POLICY,
  documentationLink: '/docs/my-platform.html',

  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <MyLogo />
    </Stack>
  ),
});
```

### Step 4: Register Platform

In `platforms/registry.ts`:

```tsx
import { MyPlatform } from './my-platform';

export const platformRegistry: ISVPlatform[] = [
  VeeamVBRPlatform,
  CommvaultPlatform,
  VeeamVBOPlatform,
  MyPlatform,  // ← Add here
];
```

### Step 5: Export Platform

In `platforms/index.ts`:

```tsx
export { MyPlatform } from './my-platform';
```

---

## Troubleshooting

### "Field X not showing up"

- Check `showWhen` / `hideWhen` conditions
- Verify field is in `additionalFields.afterAccount` or `afterImmutable`

### "Mutation not running"

- Check `when` condition returns `true`
- Verify previous mutation succeeded (`prev.X?.data` exists)

### "Validation failing"

- Check `customValidator` includes all required fields
- Use `bucketsWithCapacityValidator` if `bucketCapacity: true`

### "Policy not working"

- Verify `policy` function returns valid JSON
- Check bucket ARNs include both bucket and objects (`bucket/*`)
