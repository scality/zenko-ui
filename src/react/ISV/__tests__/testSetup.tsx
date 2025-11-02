jest.mock('../../next-architecture/adapters/s3/DataBrowserHookFactory', () => ({
  useS3Hooks: () => ({
    useCreateBucket: () => ({ status: 'idle', mutate: jest.fn() }),
    useSetBucketTagging: () => ({ status: 'idle', mutate: jest.fn() }),
    usePutObject: () => ({ status: 'idle', mutate: jest.fn() }),
  }),
  S3ConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('../DataBrowserIsolatedWrapper', () => ({
  DataBrowserIsolatedWrapper: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('../../next-architecture/ui/ConfigProvider', () => ({
  ...jest.requireActual('../../next-architecture/ui/ConfigProvider'),
  useConfig: () => ({
    zenkoEndpoint: 'http://test-endpoint',
  }),
}));

jest.mock('../../DataServiceRoleProvider', () => ({
  ...jest.requireActual('../../DataServiceRoleProvider'),
  useAssumedRole: () => ({
    Credentials: {
      AccessKeyId: 'test-key',
      SecretAccessKey: 'test-secret',
      SessionToken: 'test-token',
    },
  }),
}));
