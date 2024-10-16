import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  InfoMessage,
  Text,
} from '@scality/core-ui';
import { Button, CopyButton } from '@scality/core-ui/dist/next';
import { Wrap, spacing } from '@scality/core-ui/dist/spacing';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { CertificateDownloadButton } from '../../next-architecture/ui/CertificateDownloadButton';
import { useAuthGroups } from '../../utils/hooks';
import { HideCredential } from '../Hide';
import { useGetS3ServicePoint } from './useGetS3ServicePoint';

type VeeamSummaryProps = {
  accountName: string;
  bucketName: string;
  enableImmutableBackup: boolean;
  accessKey: string;
  secretKey: string;
};

export const VEEAM_SUMMARY_TITLE = 'Veeam Repository preparation summary';
export const CREDENTIALS_SECTION_TITLE = 'Credentials';
export const BUCKET_SECTION_TITLE = 'Bucket';
export const CERTIFICATE_SECTION_TITLE = '1. Certificates';
export const ACCOUNT_SECTION_TITLE =
  '2. Information for the Veeam configuration';

export const DEFAULT_REGION = 'us-east-1';

const WrapperWithWidth = styled(Wrap)`
  width: 20rem;
`;

const Level4FormSection = ({
  children,
  title,
}: Parameters<typeof FormSection>[0]) => {
  const Container = styled.div`
    background-color: ${(props) => props.theme.backgroundLevel4};
    padding: ${spacing.r16};
  `;
  return (
    <Container>
      <FormSection title={title}>{children}</FormSection>
    </Container>
  );
};

const Separator = styled.div`
  width: 100%;
  height: ${spacing.r32};
`;

export const VeeamSummary = ({
  accountName,
  bucketName,
  enableImmutableBackup,
  accessKey,
  secretKey,
}: VeeamSummaryProps) => {
  const history = useHistory();
  const { isPlatformAdmin } = useAuthGroups();
  const { s3ServicePoint } = useGetS3ServicePoint();

  return (
    <Form
      layout={{
        title: VEEAM_SUMMARY_TITLE,
        kind: 'page',
      }}
      requireMode="all"
      rightActions={
        <Button
          variant="primary"
          //TODO: Add flag icon in core-ui
          label="Finish"
          onClick={() => {
            history.push(`/accounts/${accountName}/buckets/${bucketName}`);
          }}
        />
      }
    >
      <Text isEmphazed>
        Your ARTESCA is now configured and ready to integrate with Veeam. <br />
        The next steps involve managing Certificates and entering specific
        ARTESCA details within the Veeam application
      </Text>
      {isPlatformAdmin ? (
        <Level4FormSection title={{ name: CERTIFICATE_SECTION_TITLE }}>
          <InfoMessage
            title={'How to manage Certificates?'}
            link="/docs/standard_operations/change_certificates.html"
            content={
              <ul>
                <li>
                  By default, all certificates are generated using the ARTESCA
                  built-in Certificate Authority and are valid for 3 months.
                  After that time period, the certificates are automatically
                  renewed.
                </li>
                <li>
                  To avoid a service interruption every time a certificate is
                  being renewed, you must either trust the ARTESCA built-in
                  Certificate Authority (which is valid for 10 years), or
                  replace certificates using a custom or external Certificate
                  Authority.
                </li>
              </ul>
            }
          />
          <FormGroup
            id="certificate"
            label="ARTESCA built-in Certificate Authority"
            content={<CertificateDownloadButton />}
            required
          ></FormGroup>
        </Level4FormSection>
      ) : (
        <></>
      )}

      <Level4FormSection>
        <Wrap>
          <Text isEmphazed>{ACCOUNT_SECTION_TITLE}</Text>
          <CopyButton
            textToCopy={`Service point\t${s3ServicePoint}\nRegion\t${DEFAULT_REGION}\nAccess key ID\t${accessKey}\nSecret Access key\t${secretKey}\nBucket name\t${bucketName}`}
            label="all"
            variant="outline"
            tooltip={{
              overlay:
                'Copy all the information below and paste it in a safe place. You will not be able to retrieve the Secret Access key afterwards.',
              placement: 'right',
            }}
            size="inline"
            aria-label="copy all"
          />
        </Wrap>
        <Separator />
        <FormGroup
          id="service-point"
          label="Service point"
          required
          content={
            <WrapperWithWidth>
              <Text>{s3ServicePoint}</Text>{' '}
              <CopyButton
                textToCopy={s3ServicePoint}
                aria-label="copy service point"
              />
            </WrapperWithWidth>
          }
        />
        <FormGroup
          id="region"
          required
          label="Region"
          content={
            <WrapperWithWidth>
              <Text>{DEFAULT_REGION}</Text>{' '}
              <CopyButton
                textToCopy={DEFAULT_REGION}
                aria-label="copy region"
              />
            </WrapperWithWidth>
          }
        />
        <Separator />

        <Text isEmphazed>{CREDENTIALS_SECTION_TITLE}</Text>
        <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
          The Secret Access key cannot be retrieved afterwards, so make sure to
          keep and secure it now. <br />
          You will be able to create new Access keys at any time.
        </Banner>
        <FormGroup
          id="access-key"
          label="Access key ID"
          required
          content={
            <WrapperWithWidth>
              <Text>{accessKey}</Text>
              <CopyButton textToCopy={accessKey} aria-label="copy access key" />
            </WrapperWithWidth>
          }
        />
        <FormGroup
          id="secret-key"
          label="Secret Access key"
          required
          content={
            <WrapperWithWidth>
              <HideCredential credentials={secretKey} />
              <CopyButton
                textToCopy={secretKey}
                aria-label="copy secret access key"
              />
            </WrapperWithWidth>
          }
        />
        <Separator />

        <Text isEmphazed>{BUCKET_SECTION_TITLE}</Text>
        <FormGroup
          id="bucket-name"
          label="Name"
          required
          content={
            <WrapperWithWidth>
              <Text>{bucketName}</Text>
              <CopyButton
                textToCopy={bucketName}
                aria-label="copy bucket name"
              />
            </WrapperWithWidth>
          }
        />
        <FormGroup
          id="immutable-backup"
          required
          label="Immutable backup"
          helpErrorPosition="bottom"
          help={
            enableImmutableBackup
              ? 'Ensure "Make recent backups immutable" is checked when configuring the bucket in Veeam.'
              : undefined
          }
          content={
            enableImmutableBackup ? <Text>Active</Text> : <Text>Inactive</Text>
          }
        />
      </Level4FormSection>
    </Form>
  );
};
