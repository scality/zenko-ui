import { InfoMessage, spacing } from '@scality/core-ui';
import { DataBrowserProvider, useBuckets, useIsBucketEmpty } from '@scality/data-browser-library';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTheme } from 'styled-components';
import { useAssumeRoleQuery, useS3ConfigFromAssumeRoleResult } from '../../../../DataServiceRoleProvider';
import { useListAccounts } from '../../../../next-architecture/domain/business/accounts';
import { useAccessibleAccountsAdapter } from '../../../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { NoOpMetricsAdapter } from '../../../../ui-elements/SelectAccountIAMRole';
import { BucketChoiceFields } from './BucketChoiceFields';
import type { ConfigureFormValues } from './schema';

const SOURCE_BUCKET = {
  typeField: 'sourceBucketNameType',
  nameField: 'sourceBucketName',
  label: 'Source Bucket',
  noBucketReason: 'This account has no bucket on the source',
} as const;

const ListedSourceBuckets = () => {
  const { data, isLoading, isError } = useBuckets(undefined, { retry: false });
  // Stable across renders: the form resets a picked bucket whenever this list changes.
  const buckets = useMemo(
    () => ({ names: (data?.Buckets ?? []).flatMap((bucket) => bucket.Name ?? []), isLoading, isError }),
    [data, isLoading, isError],
  );

  const { watch } = useFormContext<ConfigureFormValues>();
  // An empty name leaves the check idle; a bucket about to be created cannot hold anything.
  const reusedBucketName = watch('sourceBucketNameType') === 'existing' ? (watch('sourceBucketName') ?? '') : '';
  const { isEmpty } = useIsBucketEmpty(reusedBucketName);

  return (
    <>
      <BucketChoiceFields {...SOURCE_BUCKET} buckets={buckets} />
      {isEmpty === false && (
        <div style={{ marginBottom: spacing.r24 }}>
          <InfoMessage
            title="Existing objects are not replicated"
            content="Only objects written after the rule is created are copied to the destination."
          />
        </div>
      )}
    </>
  );
};

export const SourceBucketChoiceFields = ({ accountName }: { accountName: string | null }) => {
  const theme = useTheme();
  const { getQuery } = useAssumeRoleQuery();
  const { getS3Config } = useS3ConfigFromAssumeRoleResult();
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = useMemo(() => new NoOpMetricsAdapter(), []);
  const { accounts } = useListAccounts({ accessibleAccountsAdapter, metricsAdapter });
  const roleArn =
    accounts.status === 'success'
      ? accounts.value.find((account) => account.name === accountName)?.preferredAssumableRoleArn
      : undefined;

  if (!roleArn) return <BucketChoiceFields {...SOURCE_BUCKET} buckets={null} />;

  // As the ISV assistant lists an account's IAM users: its role is assumed for the call,
  // the app-wide role stays the one the rest of the UI works as.
  const getSourceS3Config = () => ({
    ...getS3Config(undefined, roleArn),
    credentials: async () => {
      const { Credentials } = await getQuery(roleArn).queryFn();
      return {
        accessKeyId: Credentials.AccessKeyId,
        secretAccessKey: Credentials.SecretAccessKey,
        sessionToken: Credentials.SessionToken,
        expiration: Credentials.Expiration,
      };
    },
  });

  return (
    <DataBrowserProvider getS3Config={getSourceS3Config} theme={theme} enableDevtools={false}>
      <ListedSourceBuckets />
    </DataBrowserProvider>
  );
};
