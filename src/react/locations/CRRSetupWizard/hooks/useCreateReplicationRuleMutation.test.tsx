import { useSetBucketReplication } from '@scality/data-browser-library';
import { renderHook, waitFor } from '@testing-library/react';
import { Wrapper } from '../../../utils/testUtil';
import { useCreateReplicationRuleMutation } from './useCreateReplicationRuleMutation';

const locationNotActiveYet = () => Object.assign(new Error('save the replication rule'), { name: 'MalformedXML' });

const RULE = { Bucket: 'source-bucket', ReplicationConfiguration: { Role: 'role', Rules: [] } };

// Short enough that giving up is quick; long enough that a wrongly-retried error
// would still be pending when the assertion runs, instead of passing by accident.
const GIVES_UP_FAST = { intervalMs: 5, windowMs: 200 };
const WOULD_RETRY_FOR_A_WHILE = { intervalMs: 20, windowMs: 60_000 };

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
});
