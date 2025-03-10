import { useMutation, useQuery } from 'react-query';
import { useMemo } from 'react';
import { useIAMClient } from '../../IAMProvider';
import { useAssumeRoleQuery } from '../../next-architecture/ui/S3ClientProvider';

interface IAMUser {
  id: string;
  name: string;
}

interface UseIAMUserProps {
  IAMUserName: string;
  onIAMUsersLoaded?: (users: IAMUser[]) => void;
  onShouldGenerateKey?: (shouldGenerate: boolean) => void;
}

export const useIAMUser = ({
  IAMUserName,
  onIAMUsersLoaded,
  onShouldGenerateKey,
}: UseIAMUserProps) => {
  const IAMClient = useIAMClient();
  const { getQuery } = useAssumeRoleQuery();

  const { data: accessKeysData, status: accessKeysStatus } = useQuery({
    queryKey: ['userAccessKeys', IAMUserName],
    queryFn: async () => {
      try {
        const { AccessKeyMetadata } = await IAMClient.listAccessKeys(
          IAMUserName,
        );
        const activeKeys = AccessKeyMetadata.filter(
          (key) => key.Status === 'Active',
        );
        const shouldGenerateKey = !AccessKeyMetadata.some(
          (key) => key.Status === 'Active',
        );
        return { shouldGenerateKey, activeKeys };
      } catch (error) {
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
        accessKey: Credentials.AccessKeyId,
        secretKey: Credentials.SecretAccessKey,
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
    () =>
      mutation.status === 'success' &&
      mutation.data?.Users.some((user) => user.UserName === IAMUserName),
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
    accessKeys:
      accessKeysData?.activeKeys.map((key) => key.AccessKeyId) ?? null,
    accessKeysStatus,
  } as const;
};
