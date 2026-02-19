import { useMemo } from 'react';
import { useMutation, useQuery } from 'react-query';
import { useAssumeRoleQuery } from '../../DataServiceRoleProvider';
import { useIAMClient } from '../../IAMProvider';

export interface IAMUser {
  id: string;
  name: string;
}

interface UseIAMUserProps {
  IAMUserName: string;
  onIAMUsersLoaded?: (users: IAMUser[]) => void;
  onShouldGenerateKey?: (shouldGenerate: boolean) => void;
}

export const useIAMUser = ({ IAMUserName, onIAMUsersLoaded, onShouldGenerateKey }: UseIAMUserProps) => {
  const IAMClient = useIAMClient();
  const { getQuery } = useAssumeRoleQuery();

  const { data: accessKeysData, status: accessKeysStatus } = useQuery({
    queryKey: ['userAccessKeys', IAMUserName],
    queryFn: async () => {
      if (!IAMUserName) {
        return { shouldGenerateKey: true, activeKeys: [] };
      }
      try {
        const { AccessKeyMetadata } = await IAMClient.listAccessKeys(IAMUserName);
        const activeKeys = AccessKeyMetadata.filter((key) => key.Status === 'Active');
        const shouldGenerateKey = !activeKeys.length;
        return { shouldGenerateKey, activeKeys };
      } catch (_error) {
        return { shouldGenerateKey: true, activeKeys: [] };
      }
    },
    onSuccess: (data) => {
      onShouldGenerateKey?.(data.shouldGenerateKey);
    },
  });

  const mutation = useMutation({
    mutationFn: async (roleArn: string) => {
      const { Credentials } = await getQuery(roleArn).queryFn();

      IAMClient.login({
        accessKeyId: Credentials.AccessKeyId,
        secretAccessKey: Credentials.SecretAccessKey,
        sessionToken: Credentials.SessionToken,
      });

      return IAMClient.listUsers(100);
    },
    onSuccess: async ({ Users }) => {
      const mappedUsers = Users.map(({ UserId: id, UserName: name }) => ({
        id,
        name,
      }));

      onIAMUsersLoaded?.(mappedUsers);
    },
  });

  const isUserExist = useMemo(
    () => mutation.status === 'success' && mutation.data?.Users.some((user) => user.UserName === IAMUserName),
    [IAMUserName, mutation.status, mutation.data],
  );

  return {
    isIAMUserExist: isUserExist,
    IAMUsers:
      mutation.data?.Users.map(({ UserId: id, UserName: name }) => ({
        id,
        name,
      })) ?? [],
    getIAMUsersMutation: mutation,
    accessKeys: accessKeysData?.activeKeys.map((key) => key.AccessKeyId) ?? null,
    accessKeysStatus,
  } as const;
};
