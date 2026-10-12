import { useGetBucketReplication, useSetBucketReplication } from '@scality/data-browser-library';
import { renderHook, waitFor } from '@testing-library/react';
import { Wrapper } from '../../../utils/testUtil';
import { useCreateReplicationRuleMutation } from './useCreateReplicationRuleMutation';

const locationNotActiveYet = () => Object.assign(new Error('save the replication rule'), { name: 'MalformedXML' });

const RULE = {
  sourceBucketName: 'source-bucket',
  targetBucketName: 'target-bucket',
  locationName: 'location-paris-crr-dest-local',
  destinationRoleArn: 'arn:aws:iam::222222222222:role/crr-replication-role',
};

// Short enough that giving up is quick; long enough that a wrongly-retried error
// would still be pending when the assertion runs, instead of passing by accident.
const GIVES_UP_FAST = { bucketName: 'source-bucket', intervalMs: 5, windowMs: 200 };
const WOULD_RETRY_FOR_A_WHILE = { bucketName: 'source-bucket', intervalMs: 20, windowMs: 60_000 };

const destinationAnswers = (mutateAsync: jest.Mock) => {
  (useSetBucketReplication as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    mutateAsync,
    status: 'idle',
    isIdle: true,
    isLoading: false,
    isSuccess: false,
    isError: false,
    data: undefined,
    error: null,
    reset: jest.fn(),
  });
};

describe('setting up the replication rule', () => {
  afterEach(() => jest.clearAllMocks());

  it('completes on its own while the newly created location is not active yet', async () => {
    destinationAnswers(
      jest
        .fn()
        .mockRejectedValueOnce(locationNotActiveYet())
        .mockRejectedValueOnce(locationNotActiveYet())
        .mockResolvedValue({ $metadata: {} }),
    );

    const { result } = renderHook(() => useCreateReplicationRuleMutation(GIVES_UP_FAST), { wrapper: Wrapper });
    result.current.mutate(RULE);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('reports a failure that waiting cannot fix, instead of hiding it behind retries', async () => {
    const accessDenied = Object.assign(new Error('Access Denied'), { name: 'AccessDenied' });
    destinationAnswers(jest.fn().mockRejectedValue(accessDenied));

    const { result } = renderHook(() => useCreateReplicationRuleMutation(WOULD_RETRY_FOR_A_WHILE), {
      wrapper: Wrapper,
    });
    result.current.mutate(RULE);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(accessDenied);
  });

  it('gives up and surfaces the problem when the location never becomes active', async () => {
    const stillNotActive = locationNotActiveYet();
    const mutateAsync = jest.fn().mockRejectedValue(stillNotActive);
    destinationAnswers(mutateAsync);

    const { result } = renderHook(() => useCreateReplicationRuleMutation(GIVES_UP_FAST), { wrapper: Wrapper });
    result.current.mutate(RULE);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(stillNotActive);
    // Without this the test would pass on the very first rejection, proving nothing.
    expect(mutateAsync.mock.calls.length).toBeGreaterThan(1);
  });

  describe('on a bucket that may already replicate elsewhere', () => {
    const ruleTo = (bucket: string, location: string) => ({
      ID: `rule-to-${bucket}`,
      Status: 'Enabled',
      Prefix: '',
      Destination: { Bucket: `arn:aws:s3:::${bucket}`, StorageClass: location },
    });
    const bucketReplicates = (configuration: { Role: string; Rules: object[] }) =>
      (useGetBucketReplication as jest.Mock).mockReturnValue({
        refetch: jest.fn().mockResolvedValue({ data: { ReplicationConfiguration: configuration } }),
      });
    const saveReplication = async () => {
      const mutateAsync = jest.fn().mockResolvedValue({ $metadata: {} });
      destinationAnswers(mutateAsync);
      const { result } = renderHook(() => useCreateReplicationRuleMutation(GIVES_UP_FAST), { wrapper: Wrapper });
      result.current.mutate(RULE);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      return mutateAsync.mock.calls[0][0].ReplicationConfiguration;
    };
    const destinations = (configuration: { Rules: { Destination: { Bucket: string } }[] }) =>
      configuration.Rules.map((rule) => rule.Destination.Bucket);

    it("replicates a bucket without replication to this destination, with this destination's role", async () => {
      bucketReplicates({ Role: '', Rules: [] });

      const saved = await saveReplication();

      expect(destinations(saved)).toEqual(['arn:aws:s3:::target-bucket']);
      expect(saved.Role).toBe(
        'arn:aws:iam::root:role/s3-replication-role,arn:aws:iam::222222222222:role/crr-replication-role',
      );
      expect(saved.Rules[0].Destination).toMatchObject({
        StorageClass: 'location-paris-crr-dest-local',
        Account: '222222222222',
      });
    });

    it('keeps replicating to the destinations the bucket already has', async () => {
      bucketReplicates({ Role: 'source-role,london-role', Rules: [ruleTo('london-bucket', 'location-london')] });

      const saved = await saveReplication();

      expect(destinations(saved)).toEqual(['arn:aws:s3:::london-bucket', 'arn:aws:s3:::target-bucket']);
      expect(saved.Role).toBe('source-role,london-role');
    });

    it("gives this destination's role to a bucket that only replicated to non-CRR locations", async () => {
      bucketReplicates({
        Role: 'arn:aws:iam::root:role/s3-replication-role',
        Rules: [ruleTo('cloud-bucket', 'aws-location')],
      });

      const saved = await saveReplication();

      expect(destinations(saved)).toEqual(['arn:aws:s3:::cloud-bucket', 'arn:aws:s3:::target-bucket']);
      expect(saved.Role).toBe(
        'arn:aws:iam::root:role/s3-replication-role,arn:aws:iam::222222222222:role/crr-replication-role',
      );
    });

    it('writes a V2 rule next to V2 rules, since the backend rejects a V1/V2 mix', async () => {
      bucketReplicates({
        Role: 'arn:aws:iam::root:role/s3-replication-role,arn:aws:iam::111111111111:role/crr-replication-role',
        Rules: [
          { ...ruleTo('london-bucket', 'location-london'), Prefix: undefined, Filter: { Prefix: '' }, Priority: 1 },
        ],
      });

      const saved = await saveReplication();

      expect(saved.Rules[1]).toMatchObject({ Filter: { Prefix: '' } });
      expect(saved.Rules[1]).not.toHaveProperty('Prefix');
    });

    it('replaces, rather than duplicates, the rule of an earlier run to the same destination', async () => {
      bucketReplicates({ Role: 'role', Rules: [ruleTo('target-bucket', 'location-paris-crr-dest-local')] });

      const saved = await saveReplication();

      expect(destinations(saved)).toEqual(['arn:aws:s3:::target-bucket']);
    });
  });
});
