import { useMutation } from 'react-query';
import { useMemo, useState, useEffect } from 'react';
import { useIAMClient } from '../../IAMProvider';
import { useAssumeRoleQuery } from '../../next-architecture/ui/S3ClientProvider';

interface IAMUser {
  id: string;
  name: string;
}

type IAMUserStatus = 'loading' | 'success' | 'error';

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
  const [status, setStatus] = useState<IAMUserStatus>('loading');
  const [users, setUsers] = useState<IAMUser[]>([]);
  const [accessKeys, setAccessKeys] = useState<string[] | null>(null);
  const checkUserAccessKeys = async (userName: string) => {
    try {
      const userExists = users.some((user) => user.name === userName);
      if (!userExists) {
        return true;
      }

      const { AccessKeyMetadata } = await IAMClient.listAccessKeys(userName);
      const activeKeys = AccessKeyMetadata.filter(
        (key) => key.Status === 'Active',
      );
      if (activeKeys.length > 0) {
        setAccessKeys(activeKeys.map((key) => key.AccessKeyId));
      }
      const shouldGenerateKey = !AccessKeyMetadata.some(
        (key) => key.Status === 'Active',
      );
      onShouldGenerateKey?.(shouldGenerateKey);
      return shouldGenerateKey;
    } catch (error) {
      onShouldGenerateKey?.(true);
      return true;
    }
  };

  useEffect(() => {
    if (IAMUserNameType === 'existing' && IAMUserName) {
      checkUserAccessKeys(IAMUserName);
    }
  }, [IAMUserName, IAMUserNameType]);

  const isUserExist = useMemo(
    () =>
      status === 'success' && users.some((user) => user.name === IAMUserName),
    [IAMUserName, status, users],
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
        await checkUserAccessKeys(mappedUsers[0].name);
      }
    },
    onError: (error) => {
      setStatus('error');
      console.error('Failed to fetch IAM users:', error);
    },
  });

  return {
    isIAMUserExist: isUserExist,
    IAMUsersStatus: status,
    IAMUsers: users,
    IAMUserNameType,
    getIAMUsersMutation: mutation,
    accessKeys,
  } as const;
};
