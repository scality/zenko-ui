# ISV Template Engine

A declarative API for defining ISV platform configurations. Write minimal config, get complete wizard flows.

## Quick Start

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

That's it. The engine auto-generates fields, validators, and mutation steps.

## API Reference

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| `id` | `ISVId` | Unique platform identifier |
| `name` | `string` | Display name |
| `logo` | `ReactElement` | Platform logo component |
| `policy` | `(buckets, isImmutable) => string` | IAM policy generator |
| `documentationLink` | `string` | Link to documentation |

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
      label: 'WORM Storage',  // Rename "Immutable Backup"
    },
  },
});
```

Available fields: `accountName`, `bucketName`, `enableImmutableBackup`, `IAMUserName`, `capacity`

### Insert Custom Fields

```tsx
definePlatform({
  // ...
  insertFields: {
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
      label: 'Create folder: {{name}}',
      action: 'putObject',
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

### FullContext

The `ctx` parameter provides runtime context for `when` conditions and `variables` functions:

```tsx
type FullContext = {
  // Runtime state
  _sosApiStatus: 'activated' | 'available' | 'wrongAccess' | 'unauthorized';
  _existingAccount: { id: string; name: string; roleArn: string } | null;
  _platformId: string;      // e.g., 'veeam-vbr'
  _bucketTag: string;       // Tag value for buckets
  _instanceId: string;      // Instance identifier

  // Computed helpers
  isNewAccount: boolean;    // true if creating new account
  needsIAMUser: boolean;    // true if IAM user creation needed
  needsAccessKey: boolean;  // true if access key generation needed
};
```

Usage in mutations:

```tsx
{
  id: 'createAccount',
  action: 'createAccount',
  when: (_form, ctx) => ctx.isNewAccount,  // Only run if creating new account
  variables: (form, prev, ctx) => ({
    instanceId: ctx._instanceId,
    // ...
  }),
}
```

### PreviousResults

The `prev` parameter contains results from earlier mutation steps:

```tsx
type PreviousResults = Record<string, { data?: unknown; error?: Error }>;
```

Access previous step results by mutation ID:

```tsx
{
  id: 'putObject',
  action: 'putObject',
  variables: (form, bucket, prev, ctx) => ({
    s3Client: prev.assumeRole?.data,  // S3 client from assumeRole step
    Bucket: bucket.name,
    // ...
  }),
}
```

Common patterns:

- `prev.assumeRole?.data` - S3 client after role assumption
- `prev.createAccount?.data` - New account info
- `prev.createIAMUser?.data` - IAM user info

### Summary Configuration

```tsx
definePlatform({
  // ...
  summary: {
    serviceEndpointLabel: 'Service Host',
    bucketBanner: <MyWarningBanner />,
    immutabilityLabel: 'WORM Lock',
    immutabilityHelpText: (enabled) => enabled ? 'Enable WORM in app' : undefined,
    customRender: MySummaryComponent,  // Full custom summary
  },
});
```

### Custom Validator

```tsx
import { VeeamVBRValidator } from './engine';

definePlatform({
  // ...
  customValidator: VeeamVBRValidator,
});
```

### Disabled State

```tsx
const MyDisabledMessage = ({ onDisabledChange }) => {
  useEffect(() => {
    onDisabledChange?.(shouldDisable);
  }, [shouldDisable]);
  
  return shouldDisable ? <Text>Not available</Text> : null;
};

definePlatform({
  // ...
  disabledMessage: MyDisabledMessage,
});
```

## Adding a New Platform

1. Add your platform ID to `ISVId` type in `engine/types.ts`:

```tsx
export type ISVId = 'veeam-vbr' | 'commvault' | 'my-platform' | ...;
```

2. Create your platform file in `platforms/`:

```tsx
// platforms/my-platform.tsx
export const MyPlatform = definePlatform({ ... });
```

3. Register in `platforms/registry.ts`:

```tsx
export const platformRegistry: ISVPlatform[] = [
  VeeamVBRPlatform,
  CommvaultPlatform,
  MyPlatform,
];
```

## Available Actions

For `perBucketSteps` and custom mutations:

| Action | Description |
|--------|-------------|
| `enableSOSAPI` | Enable SOS API |
| `createAccount` | Create new account |
| `refetchConfig` | Refresh configuration |
| `assumeRole` | Assume IAM role (returns S3 client) |
| `createBucket` | Create S3 bucket |
| `tagBucket` | Tag bucket with application |
| `putObject` | Upload object to bucket |
| `createIAMUser` | Create IAM user |
| `createAccessKey` | Generate access key |
| `createPolicy` | Create IAM policy |
| `attachPolicy` | Attach policy to user |

## File Structure

```
ISV/
├── engine/
│   ├── index.ts           # Public API exports
│   ├── definePlatform.ts  # Main definePlatform function
│   ├── types.ts           # Type definitions
│   ├── validators.ts      # Validation schemas
│   └── builders/          # Internal builders
├── platforms/
│   ├── index.ts           # Platform exports
│   ├── registry.ts        # Platform registry
│   ├── veeam-vbr.tsx      # Example: Veeam VBR
│   └── commvault.tsx      # Example: Commvault
└── components/            # Shared UI components
```

## Examples

See `platforms/commvault.tsx` for a simple platform, and `platforms/veeam-vbr.tsx` for a complex one with SOS API, capacity, and custom per-bucket steps.
