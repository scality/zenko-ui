import { Stack, Text } from '@scality/core-ui';
import { definePlatform, CommvaultValidator } from '../engine';
import { GET_COMMVAULT_POLICY } from '../utils/ISVPolicy';
import { CommvaultLogo } from '../components/logos/CommvaultLogo';
import { IAMUSerTooltip } from '../components/IAMUserTooltip';
import {
  AccountTooltip,
  BucketNameTooltip,
  CommvaultWORMTooltip,
} from '../components/shared/PlatformTooltips';

export const CommvaultPlatform = definePlatform({
  id: 'commvault',
  name: 'Commvault',
  logo: <CommvaultLogo />,
  policy: GET_COMMVAULT_POLICY,
  documentationLink:
    '/artesca/docs/partner_applications/backup_and_archives/commvault.html',

  fieldOverrides: {
    accountName: {
      label: 'Account',
      placeholder: 'Enter account name',
      tooltip: <AccountTooltip platform="Commvault" />,
    },
    bucketName: {
      label: 'Bucket name',
      placeholder: 'Enter bucket name',
      tooltip: <BucketNameTooltip platform="Commvault" />,
    },
    enableImmutableBackup: {
      label: 'WORM bucket',
      tooltip: <CommvaultWORMTooltip />,
    },
    IAMUserName: {
      label: 'IAM User Name',
      tooltip: <IAMUSerTooltip platform="Commvault" />,
    },
  },

  summary: {
    serviceEndpointLabel: 'Service Host',
    immutabilityLabel: 'WORM Storage lock',
  },

  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <CommvaultLogo />
    </Stack>
  ),

  skipModalContent: (
    <Text>
      To start Commvault assistant configuration again, you can go to the{' '}
      <b>Accounts</b> page or <b>Data Browser</b> page. If the platform doesn't
      have any accounts, it will also prompt you on your next login.
    </Text>
  ),

  customValidator: CommvaultValidator,
});
