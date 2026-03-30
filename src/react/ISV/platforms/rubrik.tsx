import { FormGroup, FormSection, Stack, Text } from '@scality/core-ui';
import { CopyButton } from '@scality/core-ui/dist/next';
import { spacing, Wrap } from '@scality/core-ui/dist/spacing';
import styled from 'styled-components';
import { IAMUSerTooltip } from '../components/IAMUserTooltip';
import { DEFAULT_REGION } from '../components/ISVSummary';
import RubrikLogo from '../components/Modal/Logos/RubrikLogo';
import { AccountTooltip, BucketNameTooltip } from '../components/shared/PlatformTooltips';
import { definePlatform, RubrikValidator } from '../engine';
import { GET_RUBRIK_POLICY } from '../utils/ISVPolicy';

const WrapperWithWidth = styled(Wrap)`
  width: 20rem;
`;

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
        id: 'region',
        render: () => (
          <FormSection forceLabelWidth={150}>
            <FormGroup
              id="region"
              required
              label="Region"
              content={
                <WrapperWithWidth>
                  <Text>{DEFAULT_REGION}</Text>
                  <CopyButton textToCopy={DEFAULT_REGION} aria-label="copy region" />
                </WrapperWithWidth>
              }
            />
          </FormSection>
        ),
      },
      { id: 'credentials' },
      {
        id: 'serviceEndpoint',
        render: ({ s3ServicePoint }) => (
          <FormSection forceLabelWidth={150}>
            <FormGroup
              id="service-endpoint"
              label="S3 Endpoint (Host Name in Rubrik)"
              required
              content={
                <WrapperWithWidth>
                  <Text>{s3ServicePoint}</Text>
                  <CopyButton textToCopy={s3ServicePoint} aria-label="copy s3 endpoint" />
                </WrapperWithWidth>
              }
            />
          </FormSection>
        ),
      },
      {
        id: 'bucketPrefix',
        render: ({ formData }) => {
          const bucketName = (formData.buckets[0] as { name: string } | undefined)?.name ?? '';
          const rubrikSuffixMatch = bucketName.match(/^(.+)-rubrik-\d+$/);
          const prefix = rubrikSuffixMatch ? rubrikSuffixMatch[1] : bucketName;
          return (
            <Stack gap="r8" direction="vertical">
              <Text>
                When configuring the Archival Location in Rubrik CDM, select{' '}
                <b>Object Store (S3 Compatible)</b> then <b>Amazon S3 compatible</b>.
              </Text>
              <Text>
                Use the <b>Bucket Prefix</b> field in Rubrik to enter the prefix portion of your bucket name — the
                part before <b>-rubrik-0</b>.
                {prefix ? (
                  <>
                    {' '}
                    For your bucket <b>{bucketName}</b>, enter <b>{prefix}</b> as the Bucket Prefix.
                  </>
                ) : null}
              </Text>
            </Stack>
          );
        },
      },
      { id: 'buckets' },
      {
        id: 'rsaKey',
        render: () => (
          <Stack gap="r8" direction="vertical" style={{ paddingTop: spacing.r8 }}>
            <Text>
              Rubrik requires an RSA private key to encrypt archived data. Generate one on a secure computer before
              configuring the Archive Location:
            </Text>
            <code>{'openssl genrsa -traditional -out rubrik_encryption_key.pem 2048'}</code>
          </Stack>
        ),
      },
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
