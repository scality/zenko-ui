import { useCreateBucket } from '@scality/data-browser-library';
import { renderHook } from '@testing-library/react';
import { useCreateSourceBucketMutation } from './useCreateSourceBucketMutation';

const mockedUseCreateBucket = useCreateBucket as unknown as jest.Mock;

const alreadyOwned = Object.assign(new Error('Your previous request to create the named bucket succeeded'), {
  name: 'BucketAlreadyOwnedByYou',
});

const innerMutation = (overrides: Record<string, unknown> = {}) => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  status: 'idle',
  isIdle: true,
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
  data: undefined,
  ...overrides,
});

describe('CRR wizard — reusing an existing source bucket', () => {
  it('reports success when S3 says the bucket is already owned', () => {
    mockedUseCreateBucket.mockReturnValue(innerMutation({ status: 'error', isError: true, error: alreadyOwned }));

    const { result } = renderHook(() => useCreateSourceBucketMutation());

    expect(result.current.status).toBe('success');
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('lets the chain continue by turning that failure into onSuccess', () => {
    const mutate = jest.fn((_vars, options) => options.onError(alreadyOwned));
    mockedUseCreateBucket.mockReturnValue(innerMutation({ mutate }));
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() => useCreateSourceBucketMutation());
    result.current.mutate({ Bucket: 'src-bucket' }, { onSuccess, onError });

    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('still fails on a genuine error', () => {
    const denied = Object.assign(new Error('Access Denied'), { name: 'AccessDenied' });
    const mutate = jest.fn((_vars, options) => options.onError(denied));
    mockedUseCreateBucket.mockReturnValue(innerMutation({ mutate, status: 'error', isError: true, error: denied }));
    const onSuccess = jest.fn();
    const onError = jest.fn();

    const { result } = renderHook(() => useCreateSourceBucketMutation());
    result.current.mutate({ Bucket: 'src-bucket' }, { onSuccess, onError });

    expect(onError).toHaveBeenCalledWith(denied);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
  });
});
