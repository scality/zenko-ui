import { useEffect, useState } from 'react';
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

// Rubrik CDM requires PKCS#1 PEM format. The Web Crypto API only exports PKCS#8,
// but PKCS#1 is embedded inside it: the first 26 bytes of the PKCS#8 DER are a
// fixed wrapper (outer SEQUENCE 4B + version INTEGER 3B + AlgorithmIdentifier 15B
// + OCTET STRING header 4B) for RSA-2048.
async function generateRSAPKCS1Pem(): Promise<string> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  const pkcs1 = new Uint8Array(pkcs8, 26);
  const binary = Array.from(pkcs1)
    .map((b) => String.fromCharCode(b))
    .join('');
  const base64 = btoa(binary);
  const body = base64.match(/.{1,64}/g)?.join('\n') ?? base64;
  return `-----BEGIN RSA PRIVATE KEY-----\n${body}\n-----END RSA PRIVATE KEY-----`;
}

function RubrikRSAKeySection() {
  const [pem, setPem] = useState<string | null>(null);

  useEffect(() => {
    generateRSAPKCS1Pem().then(setPem);
  }, []);

  const downloadKey = () => {
    if (!pem) return;
    const blob = new Blob([pem], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rubrik_encryption_key.pem';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Stack gap="r8" direction="vertical" style={{ paddingTop: spacing.r8 }}>
      <Text>
        Rubrik requires an RSA private key to encrypt archived data. A 2048-bit key has been generated below — copy or
        download it and keep it in a safe place before configuring the Archive Location.
      </Text>
      {pem ? (
        <>
          <Stack gap="r4" direction="horizontal">
            <CopyButton textToCopy={pem} aria-label="copy RSA private key" />
            <button type="button" onClick={downloadKey}>
              Download .pem
            </button>
          </Stack>
          <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.75rem' }}>{pem}</code>
        </>
      ) : (
        <Text>Generating key…</Text>
      )}
    </Stack>
  );
}

export const RubrikPlatform = definePlatform({
  id: 'rubrik',
  name: 'Rubrik',
  logo: <RubrikLogo />,
  policy: GET_RUBRIK_POLICY,
  customValidator: RubrikValidator,
  documentationLink: '/artesca/docs/partner_applications/backup_and_archives/rubrik_security_cloud.html',
  category: 'backup-and-archive',

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
        render: () => <RubrikRSAKeySection />,
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
