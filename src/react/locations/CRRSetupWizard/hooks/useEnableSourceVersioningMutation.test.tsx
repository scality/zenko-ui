import { useGetBucketVersioning, useSetBucketVersioning } from '@scality/data-browser-library';
import { renderHook, waitFor } from '@testing-library/react';
import { Wrapper } from '../../../utils/testUtil';
import { useEnableSourceVersioningMutation } from './useEnableSourceVersioningMutation';

const INPUT = { Bucket: 'source-bucket', VersioningConfiguration: { Status: 'Enabled' as const } };

const objectLockRejection = () =>
  Object.assign(new Error('The bucket is in an invalid state'), { name: 'InvalidBucketState' });

const bucketVersioningIs = (refetch: jest.Mock) =>
  (useGetBucketVersioning as jest.Mock).mockReturnValue({
    data: undefined,
    status: 'idle',
    isLoading: false,
    isError: false,
    error: null,
    refetch,
  });

const putAnswers = (mutateAsync: jest.Mock) =>
  (useSetBucketVersioning as jest.Mock).mockReturnValue({
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

describe('enabling versioning on the source bucket', () => {
  const defaultGet = (useGetBucketVersioning as jest.Mock).getMockImplementation();
  const defaultSet = (useSetBucketVersioning as jest.Mock).getMockImplementation();
  afterEach(() => {
    (useGetBucketVersioning as jest.Mock).mockReset().mockImplementation(defaultGet);
    (useSetBucketVersioning as jest.Mock).mockReset().mockImplementation(defaultSet);
  });

  const run = async (checkFirst: boolean) => {
    const { result } = renderHook(
      () => useEnableSourceVersioningMutation({ bucketName: 'source-bucket', checkFirst }),
      {
        wrapper: Wrapper,
      },
    );
    result.current.mutate(INPUT);
    return result;
  };

  it('does not send the PUT when the reused bucket is already Enabled, as an Object Lock bucket is', async () => {
    bucketVersioningIs(jest.fn().mockResolvedValue({ data: { Status: 'Enabled' } }));
    const mutateAsync = jest.fn().mockRejectedValue(objectLockRejection());
    putAnswers(mutateAsync);

    const result = await run(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['not versioned', undefined],
    ['suspended', 'Suspended'],
  ])('enables versioning on a reused bucket that is %s', async (_label, status) => {
    bucketVersioningIs(jest.fn().mockResolvedValue({ data: { Status: status } }));
    const mutateAsync = jest.fn().mockResolvedValue({ $metadata: {} });
    putAnswers(mutateAsync);

    const result = await run(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    expect(mutateAsync).toHaveBeenCalledWith(INPUT);
  });

  it('enables versioning on a new bucket without reading it first', async () => {
    const refetch = jest.fn().mockResolvedValue({ data: { Status: 'Enabled' } });
    bucketVersioningIs(refetch);
    const mutateAsync = jest.fn().mockResolvedValue({ $metadata: {} });
    putAnswers(mutateAsync);

    const result = await run(false);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(refetch).not.toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalledWith(INPUT);
  });

  it('reports a failed read, instead of guessing, so the row fails and can be retried', async () => {
    const accessDenied = Object.assign(new Error('Access Denied'), { name: 'AccessDenied' });
    const refetch = jest
      .fn()
      .mockRejectedValueOnce(accessDenied)
      .mockResolvedValue({ data: { Status: 'Enabled' } });
    bucketVersioningIs(refetch);
    const mutateAsync = jest.fn().mockResolvedValue({ $metadata: {} });
    putAnswers(mutateAsync);

    const result = await run(true);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(accessDenied);
    expect(mutateAsync).not.toHaveBeenCalled();

    result.current.mutate(INPUT);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
