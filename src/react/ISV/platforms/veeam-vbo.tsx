import { Stack, Text } from '@scality/core-ui';
import { IAMUSerTooltip } from '../components/IAMUserTooltip';
import { VeeamLogo } from '../components/logos/VeeamLogo';
import {
  AccountTooltip,
  ApplicationTooltip,
  BucketNameTooltip,
  VeeamImmutableBackupTooltip,
} from '../components/shared/PlatformTooltips';
import { VEEAM_OFFICE_365, VEEAM_OFFICE_365_V8, VEEAM_VBO_APPLICATION } from '../constants';
import type { FormData } from '../engine';
import { definePlatform, VeeamVBOValidator } from '../engine';
import { GET_VEEAM_POLICY } from '../utils/ISVPolicy';

export const VeeamVBOPlatform = definePlatform({
  id: 'veeam-vbo',
  name: 'Veeam VB365',
  logo: <VeeamLogo />,
  policy: GET_VEEAM_POLICY,
  documentationLink: '/artesca/docs/partner_applications/backup_and_archives/veeam_backup_for_ms_365.html',
  application: VEEAM_VBO_APPLICATION,
  bucketTag: VEEAM_VBO_APPLICATION,

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
    enableImmutableBackup: {
      label: 'Immutable Backup',
      tooltip: <VeeamImmutableBackupTooltip />,
      hideWhen: (form: FormData) => form.application !== VEEAM_OFFICE_365_V8,
    },
    IAMUserName: {
      label: 'IAM User Name',
      tooltip: <IAMUSerTooltip platform="Veeam" />,
    },
  },

  additionalFields: {
    afterAccount: [
      {
        name: 'application',
        type: 'select',
        label: 'Veeam application',
        tooltip: <ApplicationTooltip />,
        defaultValue: VEEAM_OFFICE_365,
        options: [
          { label: VEEAM_OFFICE_365, value: VEEAM_OFFICE_365 },
          { label: VEEAM_OFFICE_365_V8, value: VEEAM_OFFICE_365_V8 },
        ],
      },
    ],
  },

  summary: {
    serviceEndpointLabel: 'Service Endpoint',
    immutabilityLabel: 'Immutable Backup',
    immutabilityHelpText: (enabled: boolean) =>
      enabled ? 'Ensure "Make recent backups immutable" is checked when configuring the bucket in Veeam.' : undefined,
  },

  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <VeeamLogo />
      <Text variant="Large" isEmphazed>
        Veeam Backup for Microsoft 365
      </Text>
    </Stack>
  ),

  skipModalContent: (
    <Text>
      To start Veeam assistant configuration again, you can go to the <b>Accounts</b> page or <b>Data Browser</b> page.
      If the platform doesn't have any accounts, it will also prompt you on your next login.
    </Text>
  ),

  customValidator: VeeamVBOValidator,
});
