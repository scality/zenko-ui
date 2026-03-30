import { Stack, Text } from '@scality/core-ui';
import { IAMUSerTooltip } from '../components/IAMUserTooltip';
import RubrikLogo from '../components/Modal/Logos/RubrikLogo';
import { AccountTooltip, BucketNameTooltip } from '../components/shared/PlatformTooltips';
import { definePlatform, RubrikValidator } from '../engine';
import { GET_RUBRIK_POLICY } from '../utils/ISVPolicy';

export const RubrikPlatform = definePlatform({
  id: 'rubrik',
  name: 'Rubrik',
  logo: <RubrikLogo />,
  policy: GET_RUBRIK_POLICY,
  documentationLink: '/artesca/docs/partner_applications/backup_and_archives/rubrik_security_cloud.html',
  category: 'backup-and-archive',

  disableImmutability: true,
  customValidator: RubrikValidator,

  fieldOverrides: {
    accountName: {
      label: 'Account',
      placeholder: 'Enter account name',
      tooltip: <AccountTooltip platform="Rubrik" />,
    },
    bucketName: {
      label: 'Bucket name',
      placeholder: 'Enter bucket name (e.g. my-archive-rubrik-0)',
      tooltip: <BucketNameTooltip platform="Rubrik" />,
    },
    IAMUserName: {
      label: 'IAM User Name',
      tooltip: <IAMUSerTooltip platform="Rubrik" />,
    },
  },

  summary: {
    title: 'Rubrik Archive Location preparation summary',
    sections: [
      {
        id: 'customInformation',
        render: () => (
          <Stack gap="r8" direction="vertical">
            <Text>
              When configuring the Archive Location in Rubrik CDM, select{' '}
              <b>Object Store (S3 Compatible)</b> then <b>Amazon S3 compatible</b> (do not select
              "Scality").
            </Text>
            <Text>
              Use the <b>Bucket Prefix</b> field in Rubrik to enter the prefix portion of your
              bucket name — the part before <b>-rubrik-0</b>. For example, if your bucket is named{' '}
              <b>my-archive-rubrik-0</b>, enter <b>my-archive</b> as the Bucket Prefix.
            </Text>
            <Text>
              Rubrik requires an RSA private key to encrypt archived data. Generate one on a secure
              computer before configuring the Archive Location:
            </Text>
            <code>{'openssl genrsa -traditional -out rubrik_encryption_key.pem 2048'}</code>
          </Stack>
        ),
      },
      { id: 'credentials' },
      { id: 'connectionInfo' },
      { id: 'buckets' },
    ],
    serviceEndpointLabel: 'S3 Endpoint (Host Name in Rubrik)',
    accessKeyLabel: 'Access Key',
    secretKeyLabel: 'Secret Key',
  },

  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <RubrikLogo />
    </Stack>
  ),

  skipModalContent: (
    <Text>
      To start Rubrik assistant configuration again, you can go to the <b>Accounts</b> page or{' '}
      <b>Data Browser</b> page. If the platform doesn't have any accounts, it will also prompt you
      on your next login.
    </Text>
  ),
});
