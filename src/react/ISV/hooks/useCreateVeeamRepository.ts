import { useShellHooks } from '@scality/module-federation';
import { useMutation } from 'react-query';
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
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    repositoryId: `repo-${Date.now()}`,
    repositoryName: repositoryConfig.repositoryName,
    message: 'Repository created successfully (MOCKED)',
  };
  // const response = await fetch('/api/veeam-automation/create-s3-repo', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${token}`,
  //   },
  //   body: JSON.stringify(repositoryConfig),
  // });

  // if (!response.ok) {
  //   const errorData = await response.json().catch(() => ({}));
  //   throw errorData;
  // }

  // const data = await response.json();
  // return data as VeeamRepositoryResponse;
}

export const useCreateVeeamRepository = () => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();

  return useMutation<VeeamRepositoryResponse, unknown, VeeamRepositoryRequest>({
    mutationFn: async (repositoryConfig) => {
      const token = await getToken();
      return createVeeamRepository(repositoryConfig, token);
    },
  });
};
