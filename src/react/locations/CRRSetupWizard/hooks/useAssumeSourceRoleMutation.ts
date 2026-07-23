import { useMutation } from 'react-query';
import { useSetAssumedRolePromise } from '../../../DataServiceRoleProvider';

/**
 * ARN of the platform-provisioned storage-manager role for an account — the
 * role the wizard assumes to run S3 operations (create bucket, put replication)
 * as that account. Matches the convention used by the ISV apply chain.
 */
export const sourceStorageManagerRoleArn = (accountId: string): string =>
  `arn:aws:iam::${accountId}:role/scality-internal/storage-manager-role`;

/**
 * Assumes the source account's storage-manager role so the data-browser S3
 * hooks target that account: the DataBrowserProvider S3 client is rebuilt from
 * the newly assumed role between chain steps (same mechanism as the ISV chain).
 */
export const useAssumeSourceRoleMutation = () => {
  const setRolePromise = useSetAssumedRolePromise();
  return useMutation({
    mutationFn: ({ roleArn }: { roleArn: string }) => setRolePromise({ roleArn }),
  });
};
