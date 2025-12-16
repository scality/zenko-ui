import { useShellHooks } from '@scality/module-federation';
import { useMutation } from 'react-query';
import { ApiError } from '../../../types/actions';
import { StorageConsumptionLimitKind } from '../utils/capacityCalculations';

export type VeeamRepositoryRequest = {
  repositoryName: string;
  servicePoint: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region: string;
  immutable?: boolean;
  immutablePeriodDays?: number;
  storageConsumptionLimitKind: StorageConsumptionLimitKind;
  storageConsumptionLimitCount: number;
};

export type VeeamRepositoryResponse = {
  repositoryId?: string;
  repositoryName?: string;
  message?: string;
};

async function createVeeamRepository(
  repositoryConfig: VeeamRepositoryRequest,
  token: string,
): Promise<VeeamRepositoryResponse> {
  const response = await fetch('/api/veeam-automation/create-s3-repo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      repositoryName: repositoryConfig.repositoryName,
      servicePoint: repositoryConfig.servicePoint,
      accessKey: repositoryConfig.accessKey,
      secretKey: repositoryConfig.secretKey,
      bucketName: repositoryConfig.bucketName,
      region: repositoryConfig.region,
      immutable: repositoryConfig.immutable,
      immutablePeriodDays: repositoryConfig.immutablePeriodDays,
      storageConsumptionLimitKind: repositoryConfig.storageConsumptionLimitKind,
      storageConsumptionLimitCount:
        repositoryConfig.storageConsumptionLimitCount,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw errorData;
  }

  const data = await response.json();
  return {
    repositoryId: data.repositoryId,
    repositoryName: data.repositoryName,
    message: data.message,
  };
}

export const useCreateVeeamRepository = () => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();

  return useMutation<VeeamRepositoryResponse, ApiError, VeeamRepositoryRequest>(
    {
      mutationFn: async (repositoryConfig) => {
        const token = await getToken();
        return createVeeamRepository(repositoryConfig, token);
      },
    },
  );
};
