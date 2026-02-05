import { Stack, Text } from '@scality/core-ui';
import { IAMUSerTooltip } from '../components/IAMUserTooltip';
import { VeeamKastenLogo } from '../components/Modal/Logos/VeeamKastenLogo';
import { AccountTooltip, BucketNameTooltip, KastenImmutableBackupTooltip } from '../components/shared/PlatformTooltips';
import { definePlatform, KastenValidator } from '../engine';
import { GET_KASTEN_POLICY } from '../utils/ISVPolicy';

export const KastenPlatform = definePlatform({
  id: 'kasten',
  name: 'Kasten',
  logo: <VeeamKastenLogo />,
  policy: GET_KASTEN_POLICY,
  documentationLink: '/artesca/docs/partner_applications/backup_and_archives/kasten.html',

  fieldOverrides: {
    accountName: {
      label: 'Account',
      placeholder: 'Enter account name',
      tooltip: <AccountTooltip platform="Kasten" />,
    },
    bucketName: {
      label: 'Bucket name',
      placeholder: 'Enter bucket name',
      tooltip: <BucketNameTooltip platform="Kasten" />,
    },
    enableImmutableBackup: {
      label: 'Immutable Backup',
      tooltip: <KastenImmutableBackupTooltip />,
    },
    IAMUserName: {
      label: 'IAM User Name',
      tooltip: <IAMUSerTooltip platform="Kasten" />,
    },
  },

  summary: {
    title: 'Kasten Location Profile preparation summary',
    sections: [
      { id: 'customInformation', render: () => <Text>ARTESCA is a "S3 Compatible" Storage Provider for Kasten.</Text> },
      { id: 'credentials' },
      { id: 'connectionInfo' },
      { id: 'buckets' },
      { id: 'immutability' },
    ],
    serviceEndpointLabel: 'S3 Endpoint',
    accessKeyLabel: 'S3 Access Key',
    secretKeyLabel: 'S3 Secret',
    immutabilityLabel: 'Immutable Backup',
    immutabilityHelpText: (enabled: boolean) =>
      enabled
        ? 'Check "Enable Immutable Backups" and set the protection period when creating the Location Profile in Veeam Kasten.'
        : 'When creating a Location Profile in Veeam Kasten, set Storage Provider to "S3 Compatible".',
  },

  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <VeeamKastenLogo />
    </Stack>
  ),

  skipModalContent: (
    <Text>
      To start Kasten assistant configuration again, you can go to the <b>Accounts</b> page or <b>Data Browser</b> page.
      If the platform doesn't have any accounts, it will also prompt you on your next login.
    </Text>
  ),

  customValidator: KastenValidator,
});
