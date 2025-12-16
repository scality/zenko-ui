import { act, renderHook } from '@testing-library/react-hooks';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { NewWrapper } from '../../utils/testUtil';
import { useCreateVeeamRepository } from './useCreateVeeamRepository';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useCreateVeeamRepository', () => {
  it('creates a Veeam repository successfully', async () => {
    const repositoryConfig = {
      repositoryName: 'test-repo',
      servicePoint: 'https://s3.test.local',
      accessKey: 'AKIAIOSFODNN7EXAMPLE',
      secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      bucketName: 'test-bucket',
      region: 'us-east-1',
      immutable: true,
      immutablePeriodDays: 14,
      storageConsumptionLimitKind: 'TB' as const,
      storageConsumptionLimitCount: 1,
    };

    server.use(
      rest.post(`*/api/veeam-automation/create-s3-repo`, (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            repositoryId: 'repo-123',
            repositoryName: 'test-repo',
            message: 'Repository created successfully',
          }),
        );
      }),
    );

    const { result, waitFor } = renderHook(() => useCreateVeeamRepository(), {
      wrapper: NewWrapper(),
    });

    act(() => {
      result.current.mutate(repositoryConfig);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      repositoryId: 'repo-123',
      repositoryName: 'test-repo',
      message: 'Repository created successfully',
    });
  });

  it('handles API errors correctly', async () => {
    const repositoryConfig = {
      repositoryName: 'test-repo',
      servicePoint: 'https://s3.test.local',
      accessKey: 'AKIAIOSFODNN7EXAMPLE',
      secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      bucketName: 'test-bucket',
      region: 'us-east-1',
      storageConsumptionLimitKind: 'TB' as const,
      storageConsumptionLimitCount: 1,
    };

    server.use(
      rest.post(`*/api/veeam-automation/create-s3-repo`, (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            message: 'Invalid repository configuration',
          }),
        );
      }),
    );

    const { result, waitFor } = renderHook(() => useCreateVeeamRepository(), {
      wrapper: NewWrapper(),
    });

    act(() => {
      result.current.mutate(repositoryConfig);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      'Invalid repository configuration',
    );
  });
});
