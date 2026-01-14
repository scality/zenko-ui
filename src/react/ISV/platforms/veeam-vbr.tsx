import { useEffect } from 'react';
import { Banner, Stack, Text } from '@scality/core-ui';
import { definePlatform, VeeamVBRValidator } from '../engine';
import type {
  BucketItem,
  FormData,
  PreviousResults,
  FullContext,
  DisabledMessageProps,
} from '../engine';
import { GET_VEEAM_POLICY } from '../utils/ISVPolicy';
import { VeeamLogo } from '../components/logos/VeeamLogo';
import { VeeamMultipleBucketCapture } from '../components/veeam/VeeamMultipleBucketCapture';
import { IAMUSerTooltip } from '../components/IAMUserTooltip';
import { VeeamRepositoryFields } from '../components/VeeamRepositoryFields';
import { useCheckSOSAPIStatus } from '../hooks/useCheckSOSAPIStatus';
import {
  AccountTooltip,
  BucketNameTooltip,
  VeeamImmutableBackupTooltip,
  CapacityTooltip,
} from '../components/shared/PlatformTooltips';
import {
  VEEAM_BACKUP_REPLICATION,
  VEEAM_XML_PREFIX,
  SYSTEM_XML_CONTENT,
  GET_CAPACITY_XML_CONTENT,
  VEEAM_ARCHIVE_FOLDER_PATH,
  VEEAM_BACKUP_CLIENTS_FOLDER_PATH,
  VEEAM_BACKUP_CONFIG_FOLDER_PATH,
} from '../constants';
import { calculateStorageConsumptionLimit } from '../utils/capacityCalculations';
import { VeeamRepositorySummary } from '../components/VeeamRepositorySummary';
import { ensureHttpsPrefix } from '../utils/ensureHttpsPrefix';

const VeeamVBRDisabledMessage = ({
  onDisabledChange,
}: DisabledMessageProps) => {
  const status = useCheckSOSAPIStatus();

  useEffect(() => {
    const isDisabled = status === 'wrongAccess' || status === 'unauthorized';
    onDisabledChange?.(isDisabled);
  }, [status, onDisabledChange]);

  if (status === 'wrongAccess') {
    return (
      <Text>
        Smart Object Storage API is not available <br />
        Ensure to connect to the UI from the Management IP
      </Text>
    );
  } else if (status === 'unauthorized') {
    return (
      <Text>
        As Smart Object Storage API is not available, you need to be a platform
        admin to configure Veeam Backup and Replication. You can also contact
        your platform admin to enable the Smart Object Storage API.
      </Text>
    );
  }
  return null;
};

const VeeamBucketBanner = () => (
  <Banner variant="warning" title="Configuration warning">
    When configuring Veeam Backup and Replication (VBR) application, the option
    "Automatic bucket creation" must be disabled to ensure Veeam connects
    properly.
    <br />
    In VBR v12.3.1.1139 and above, Automatic Bucket Creation is enabled by
    default.
    <br />
    You'll find the option next to the Bucket name in the S3 compatible
    repository wizard.
    <VeeamMultipleBucketCapture />
  </Banner>
);

export const VeeamVBRPlatform = definePlatform({
  id: 'veeam-vbr',
  name: 'Veeam',
  logo: <VeeamLogo />,
  policy: GET_VEEAM_POLICY,
  documentationLink:
    '/artesca/docs/partner_applications/backup_and_archives/veeam/index.html',
  disabledMessage: VeeamVBRDisabledMessage,
  bucketTag: VEEAM_BACKUP_REPLICATION,
  application: VEEAM_BACKUP_REPLICATION,

  sosAPI: true,
  bucketCapacity: true,
  customValidator: VeeamVBRValidator,

  fieldOverrides: {
    accountName: {
      label: 'Account',
      placeholder: 'Enter account name',
      tooltip: <AccountTooltip platform="Veeam" />,
    },
    bucketName: {
      label: 'Bucket name',
      placeholder: 'Enter bucket name',
      tooltip: <BucketNameTooltip platform="Veeam" />,
    },
    capacity: {
      label: 'Repository Capacity',
      placeholder: 'Enter capacity',
      tooltip: <CapacityTooltip />,
    },
    enableImmutableBackup: {
      label: 'Immutable Backup',
      tooltip: <VeeamImmutableBackupTooltip />,
    },
    IAMUserName: {
      label: 'IAM User Name',
      tooltip: <IAMUSerTooltip platform="Veeam" />,
    },
  },

  perBucketSteps: [
    {
      id: 'veeamFolder',
      label: 'Create Veeam folder: {{name}}',
      action: 'putObject',
      variables: (
        _form: FormData,
        bucket: BucketItem,
        prev: PreviousResults,
        _ctx: FullContext,
      ) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: `${VEEAM_XML_PREFIX}/`,
        Body: '',
      }),
    },
    // Folder creation steps for auto-create repository feature
    {
      id: 'veeamArchiveFolder',
      label: `Create Archive folder: ${VEEAM_ARCHIVE_FOLDER_PATH}`,
      action: 'putObject',
      when: (form: FormData, _bucket: BucketItem, _ctx: FullContext) =>
        form.autoCreateRepository === true,
      variables: (
        _form: FormData,
        bucket: BucketItem,
        prev: PreviousResults,
        _ctx: FullContext,
      ) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: VEEAM_ARCHIVE_FOLDER_PATH,
        Body: '',
      }),
    },
    {
      id: 'veeamBackupClientsFolder',
      label: `Create Backup Clients folder: ${VEEAM_BACKUP_CLIENTS_FOLDER_PATH}`,
      action: 'putObject',
      when: (form: FormData, _bucket: BucketItem, _ctx: FullContext) =>
        form.autoCreateRepository === true,
      variables: (
        _form: FormData,
        bucket: BucketItem,
        prev: PreviousResults,
        _ctx: FullContext,
      ) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: VEEAM_BACKUP_CLIENTS_FOLDER_PATH,
        Body: '',
      }),
    },
    {
      id: 'veeamBackupConfigFolder',
      label: `Create Backup Config folder: ${VEEAM_BACKUP_CONFIG_FOLDER_PATH}`,
      action: 'putObject',
      when: (form: FormData, _bucket: BucketItem, _ctx: FullContext) => {
        return form.autoCreateRepository === true;
      },
      variables: (
        _form: FormData,
        bucket: BucketItem,
        prev: PreviousResults,
        _ctx: FullContext,
      ) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: VEEAM_BACKUP_CONFIG_FOLDER_PATH,
        Body: '',
      }),
    },
    {
      id: 'veeamSystem',
      label: 'Setup repository: {{name}}',
      action: 'putObject',
      variables: (
        _form: FormData,
        bucket: BucketItem,
        prev: PreviousResults,
        _ctx: FullContext,
      ) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: `${VEEAM_XML_PREFIX}/system.xml`,
        Body: SYSTEM_XML_CONTENT,
        ContentType: 'text/xml',
      }),
    },
    {
      id: 'veeamCapacity',
      label: 'Set capacity: {{name}}',
      action: 'putObject',
      variables: (
        _form: FormData,
        bucket: BucketItem,
        prev: PreviousResults,
        _ctx: FullContext,
      ) => ({
        s3Client: prev.assumeRole?.data,
        Bucket: bucket.name,
        Key: `${VEEAM_XML_PREFIX}/capacity.xml`,
        Body: GET_CAPACITY_XML_CONTENT(String(bucket.capacityBytes ?? 0)),
        ContentType: 'text/xml',
      }),
    },
  ],
  additionalMutations: [
    {
      each: 'buckets',
      steps: [
        {
          id: 'createVeeamRepo',
          label: 'Create Veeam Repository: {{name}}',
          action: 'createVeeamRepository',
          when: (form: FormData, _bucket: BucketItem, _ctx: FullContext) =>
            form.autoCreateRepository === true && _ctx.needsAccessKey,
          variables: (
            form: FormData,
            bucket: BucketItem,
            prev: PreviousResults,
            ctx: FullContext,
          ) => {
            const capacityBytes = bucket.capacityBytes ?? 0;
            const { kind, count } =
              calculateStorageConsumptionLimit(capacityBytes);
            const servicePoint = ensureHttpsPrefix(ctx._s3ServicePoint || '');

            const accessKeyData = prev.createAccessKey?.data as
              | {
                  AccessKey?: {
                    AccessKeyId: string;
                    SecretAccessKey: string;
                  };
                }
              | undefined;

            if (!accessKeyData?.AccessKey) {
              throw new Error(
                'Access key not available. Ensure access key creation completed successfully.',
              );
            }

            return {
              repositoryName: bucket.name,
              servicePoint,
              accessKey: accessKeyData.AccessKey.AccessKeyId,
              secretKey: accessKeyData.AccessKey.SecretAccessKey,
              bucketName: bucket.name,
              region: 'us-east-1',
              immutable: form.enableImmutableBackup,
              immutablePeriodDays: form.immutablePeriodDays,
              storageConsumptionLimitKind: kind,
              storageConsumptionLimitCount: count,
            };
          },
        },
      ],
    },
  ],
  summary: {
    serviceEndpointLabel: 'Service Endpoint',
    bucketBanner: <VeeamBucketBanner />,
    immutabilityLabel: 'Immutable Backup',
    immutabilityHelpText: (enabled: boolean) =>
      enabled
        ? 'Ensure "Make recent backups immutable" is checked when configuring the bucket in Veeam.'
        : undefined,
    customRender: ({ formData, onFinish, renderDefault }) => {
      if (!formData.autoCreateRepository) {
        return renderDefault();
      }

      return <VeeamRepositorySummary formData={formData} onFinish={onFinish} />;
    },
  },

  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <VeeamLogo />
      <Text variant="Large" isEmphazed>
        Veeam Backup & Replication
      </Text>
    </Stack>
  ),

  skipModalContent: (
    <Text>
      To start Veeam assistant configuration again, you can go to the{' '}
      <b>Accounts</b> page or <b>Data Browser</b> page. If the platform doesn't
      have any accounts, it will also prompt you on your next login.
    </Text>
  ),
  additionalFields: {
    afterImmutable: [
      {
        name: 'veeamRepositoryConfig',
        type: 'custom',
        label: '',
        render: () => <VeeamRepositoryFields />,
      },
    ],
  },
});
