import { useMutation, useQuery } from 'react-query';
import { useMemo, useState } from 'react';
import { useIAMClient } from '../../IAMProvider';
import { useAssumeRoleQuery } from '../../next-architecture/ui/S3ClientProvider';

interface IAMUser {
  id: string;
  name: string;
}

interface UseIAMUserProps {
  IAMUserName: string;
  IAMUserNameType: 'create' | 'existing';
  onIAMUsersLoaded?: (users: IAMUser[]) => void;
  onShouldGenerateKey?: (shouldGenerate: boolean) => void;
}

export const useIAMUser = ({
  IAMUserName,
  IAMUserNameType,
  onIAMUsersLoaded,
  onShouldGenerateKey,
}: UseIAMUserProps) => {
  const IAMClient = useIAMClient();
  const { getQuery } = useAssumeRoleQuery();
  const [users, setUsers] = useState<IAMUser[]>([]);
  const [accessKeys, setAccessKeys] = useState<string[] | null>(null);

  useQuery(
    ['userAccessKeys', IAMUserName],
    async () => {
      try {
        const userExists = users.some((user) => user.name === IAMUserName);
        if (!userExists) {
          return { shouldGenerateKey: true, activeKeys: [] };
        }

        const { AccessKeyMetadata } = await IAMClient.listAccessKeys(IAMUserName);
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
    {
      enabled: IAMUserNameType === 'existing' && Boolean(IAMUserName),
      onSuccess: (data) => {
        if (data.activeKeys.length > 0) {
          setAccessKeys(data.activeKeys.map((key) => key.AccessKeyId));
        }
        onShouldGenerateKey?.(data.shouldGenerateKey);
      },
    },
  );

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
      const mappedUsers = Users.map(
        ({ UserId: id, UserName: name, Tags: tags }) => ({
          id,
          name,
          tags,
        }),
      );
      setUsers(mappedUsers);

      if (mappedUsers.length > 0) {
        onIAMUsersLoaded?.(mappedUsers);
      }
    },
  });

  const isUserExist = useMemo(
    () =>
      mutation.status === 'success' &&
      users.some((user) => user.name === IAMUserName),
    [IAMUserName, mutation.status, users],
  );

  return {
    isIAMUserExist: isUserExist,
    IAMUsers: users,
    IAMUserNameType,
    getIAMUsersMutation: mutation,
    accessKeys,
  } as const;
};
