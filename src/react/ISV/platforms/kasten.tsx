import { Stack, Text } from '@scality/core-ui';
import { definePlatform, KastenValidator } from '../engine';
import { GET_KASTEN_POLICY } from '../utils/ISVPolicy';
import { VeeamKastenLogo } from '../components/Modal/Logos/VeeamKastenLogo';
import { IAMUSerTooltip } from '../components/IAMUserTooltip';
import {
  AccountTooltip,
  BucketNameTooltip,
  KastenImmutableBackupTooltip,
} from '../components/shared/PlatformTooltips';

export const KastenPlatform = definePlatform({
  id: 'kasten',
  name: 'Kasten',
  logo: <VeeamKastenLogo />,
  policy: GET_KASTEN_POLICY,
  documentationLink:
    '/artesca/docs/partner_applications/backup_and_archives/kasten.html',

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
    serviceEndpointLabel: 'S3 Endpoint',
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
      To start Kasten assistant configuration again, you can go to the{' '}
      <b>Accounts</b> page or <b>Data Browser</b> page. If the platform doesn't
      have any accounts, it will also prompt you on your next login.
    </Text>
  ),

  customValidator: KastenValidator,
});
