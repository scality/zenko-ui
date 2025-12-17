import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useIAMClient } from '../../../IAMProvider';
import { useDataServiceRole } from '../../../DataServiceRoleProvider';
import { IAM } from 'aws-sdk';

export const ACCESS_KEYS_QUERY_KEY = 'accountAccessKeys';

export type AccessKeyMetadata = IAM.AccessKeyMetadata;

export const useAccessKeysQuery = () => {
  const iamClient = useIAMClient();
  const { roleArn } = useDataServiceRole();

  return useQuery<AccessKeyMetadata[], Error>(
    [ACCESS_KEYS_QUERY_KEY, roleArn],
    async () => {
      const resp = await iamClient.listOwnAccessKeys();
      return resp.AccessKeyMetadata || [];
    },
    {
      enabled: !!roleArn && !!iamClient.client,
    },
  );
};

export const useDeleteAccessKeyMutation = () => {
  const iamClient = useIAMClient();
  const { roleArn } = useDataServiceRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accessKeyId: string) => {
      //@ts-expect-error fix this when you are working on it - root user delete
      return iamClient.deleteAccessKey(accessKeyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([ACCESS_KEYS_QUERY_KEY, roleArn]);
    },
  });
};
