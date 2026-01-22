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
import styled from 'styled-components';
import { CertificateDownloadButton } from '../../next-architecture/ui/CertificateDownloadButton';
import { useAuthGroups } from '../../utils/hooks';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { HideCredential } from '../../ui-elements/Hide';
import { useGetS3ServicePoint } from '../hooks/useGetS3ServicePoint';
import { useISVStepper } from './ISVSteps';
import { FormData, BucketItem, SummaryRenderProps } from '../engine/types';
import { queries } from '../../next-architecture/domain/business/buckets';
import { useS3Client } from '../../next-architecture/ui/S3ClientProvider';
import { useAssumedRole } from '../../DataServiceRoleProvider';
import { useQueryClient } from 'react-query';
import { useCallback } from 'react';
import { VEEAM_OFFICE_365 } from '../constants';

export const DEFAULT_REGION = 'us-east-1';

const WrapperWithWidth = styled(Wrap)`
  width: 20rem;
`;
const Container = styled.div`
  background-color: ${(props) => props.theme.backgroundLevel4};
  padding: ${spacing.r16};
`;

const Level4FormSection = ({
  children,
  title,
}: Parameters<typeof FormSection>[0]) => {
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

export type ISVSummaryProps = FormData & {
  accessKey: string;
  secretKey: string;
  accessKeys?: string[];
};

/**
 * Default ISV Summary component
 *
 * @remarks
 * Must be used within ISVStepperContext as it relies on useISVStepper() hook.
 * For custom summary implementations, import this component for fallback scenarios.
 */
export const DefaultISVSummary = ({
  formData,
  accessKey,
  secretKey,
  accessKeys,
  onFinish,
}: Omit<SummaryRenderProps, 'renderDefault'>) => {
  const { isPlatformAdmin } = useAuthGroups();
  const { s3ServicePoint } = useGetS3ServicePoint();
  const { platform } = useISVStepper();

  const { buckets, enableImmutableBackup, application } = formData;

  const immutabilityConfig = platform.summary.immutability;
  const immutableSectionInfos = {
    label: immutabilityConfig?.label || 'Object-lock',
    helpText: immutabilityConfig?.helpText?.(enableImmutableBackup),
  };

  const shouldHideImmutableSection = application === VEEAM_OFFICE_365;

  const serviceEndpointLabel =
    platform.summary.serviceEndpointLabel || 'Service point';

  const bucketItems = buckets as BucketItem[];
  const accessKeyLabel =
    accessKey || accessKeys?.length === 1 ? 'Access key ID' : 'Access key IDs';
  const textToCopy = `${serviceEndpointLabel}\t${s3ServicePoint}\nRegion\t${DEFAULT_REGION}\n${accessKeyLabel}\t${accessKey ? accessKey : accessKeys?.join(', ')}\n${
    secretKey ? `Secret Access key\t${secretKey}\n` : ''
  }Bucket names\t${bucketItems.map((bucket) => bucket.name).join(', ')}`;

  return (
    <Form
      layout={{
        title: `${platform.name} Repository preparation summary`,
        kind: 'page',
      }}
      requireMode="all"
      rightActions={
        <Button
          variant="primary"
          type="button"
          label="Finish"
          onClick={onFinish}
        />
      }
    >
      <Text isEmphazed>
        Your ARTESCA is now configured and ready to integrate with{' '}
        {platform.name}. <br />
        The next steps involve managing Certificates and entering specific
        ARTESCA details within the {platform.name} application.
      </Text>

      {isPlatformAdmin && (
        <Level4FormSection title={{ name: '1. Certificates' }}>
          <InfoMessage
            title={'How to manage Certificates?'}
            link="/artesca/docs/standard_operations/manage_ingress_certificate/index.html"
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
          />
        </Level4FormSection>
      )}

      <Level4FormSection>
        <Wrap>
          <Text isEmphazed>{`${
            isPlatformAdmin ? '2. ' : ''
          }Information for the ${platform.name} configuration`}</Text>
          <CopyButton
            textToCopy={textToCopy}
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
        <FormSection forceLabelWidth={150}>
          <FormGroup
            id="service-endpoint"
            label={serviceEndpointLabel}
            required
            content={
              <WrapperWithWidth>
                <Text>{s3ServicePoint}</Text>
                <CopyButton
                  textToCopy={s3ServicePoint}
                  aria-label={`copy ${serviceEndpointLabel.toLowerCase()}`}
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
                <Text>{DEFAULT_REGION}</Text>
                <CopyButton
                  textToCopy={DEFAULT_REGION}
                  aria-label="copy region"
                />
              </WrapperWithWidth>
            }
          />
        </FormSection>

        <Separator />

        {secretKey && (
          <FormSection forceLabelWidth={150} title={{ name: 'Credentials' }}>
            <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
              The Secret Access key cannot be retrieved afterwards, so make sure
              to keep and secure it now. <br />
              You will be able to create new Access keys at any time.
            </Banner>
            <FormGroup
              id="access-key"
              label="Access key ID"
              required
              content={
                <WrapperWithWidth>
                  <Text style={{ display: 'flex', alignItems: 'center' }}>
                    {accessKey}
                  </Text>
                  <CopyButton
                    textToCopy={accessKey}
                    aria-label="copy access key"
                  />
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
          </FormSection>
        )}
        {!secretKey && accessKeys && (
          <>
            <Text isEmphazed>{`Credentials`}</Text>
            <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
              An existing user has been chosen and no new Access Key has been
              created.
              <br />
              You must use an Access Key and Secret key already created. Here is
              a list of Access keys that can be used for this user:
            </Banner>
            <FormSection forceLabelWidth={150}>
              {accessKeys.map((accessKey, index) => (
                <FormGroup
                  key={accessKey}
                  id={`access-key-${index}`}
                  label="Access key ID"
                  required
                  content={
                    <WrapperWithWidth>
                      <Text style={{ display: 'flex', alignItems: 'center' }}>
                        {accessKey}
                      </Text>
                      <CopyButton
                        textToCopy={accessKey}
                        aria-label="copy access key"
                      />
                    </WrapperWithWidth>
                  }
                />
              ))}
            </FormSection>
          </>
        )}
        <Separator />

        {platform.summary.bucketBanner && <>{platform.summary.bucketBanner}</>}
        <FormSection title={{ name: 'Buckets' }} forceLabelWidth={150}>
          {bucketItems.map((bucket, index) => (
            <FormGroup
              key={bucket.name}
              id={`bucket-${index}`}
              label={`Bucket #${index + 1}`}
              required
              content={
                <WrapperWithWidth>
                  <Text>{bucket.name}</Text>
                  <CopyButton
                    textToCopy={bucket.name}
                    aria-label="copy bucket name"
                  />
                </WrapperWithWidth>
              }
            />
          ))}
        </FormSection>
        <Separator />
        {!shouldHideImmutableSection && (
          <FormSection title={{ name: 'Option' }} forceLabelWidth={150}>
            <FormGroup
              id="immutable"
              required
              label={immutableSectionInfos.label}
              helpErrorPosition="bottom"
              help={immutableSectionInfos.helpText}
              content={
                <Text>{enableImmutableBackup ? 'Active' : 'Inactive'}</Text>
              }
            />
          </FormSection>
        )}
      </Level4FormSection>
    </Form>
  );
};

export const ISVSummary = ({
  accountName,
  accountNameType,
  buckets,
  enableImmutableBackup,
  accessKey,
  secretKey,
  accessKeys,
  application,
  IAMUserName,
  IAMUserNameType,
  generateKey,
  autoCreateRepository,
  immutablePeriodDays,
}: ISVSummaryProps) => {
  const navigate = useBasenameRelativeNavigate();
  const { platform } = useISVStepper();
  const assumedRole = useAssumedRole();
  const s3Client = useS3Client();
  const queryClient = useQueryClient();

  const formData: FormData = {
    accountName,
    accountNameType,
    buckets,
    enableImmutableBackup,
    application,
    IAMUserName,
    IAMUserNameType,
    generateKey,
    autoCreateRepository,
    immutablePeriodDays,
  };

  const onFinish = useCallback(() => {
    const assumedRoleArn = assumedRole?.AssumedRoleUser?.Arn;
    const bucketItems = buckets as BucketItem[];
    const firstBucket = bucketItems[0];
    queryClient
      .resetQueries(queries.listBuckets(s3Client, assumedRoleArn).queryKey)
      .then(() => {
        if (firstBucket) {
          navigate(`/accounts/${accountName}/buckets/${firstBucket.name}`);
        } else {
          navigate(`/accounts/${accountName}`);
        }
      });
  }, [assumedRole, s3Client, queryClient, accountName, buckets, navigate]);

  const renderDefault = () => (
    <DefaultISVSummary
      formData={formData}
      accessKey={accessKey}
      secretKey={secretKey}
      accessKeys={accessKeys}
      onFinish={onFinish}
    />
  );

  const summaryProps: SummaryRenderProps = {
    formData,
    accessKey,
    secretKey,
    accessKeys,
    onFinish,
    renderDefault,
  };

  if (platform.summary.customRender) {
    const customResult = platform.summary.customRender(summaryProps);
    if (customResult) {
      return customResult;
    }
  }

  return renderDefault();
};
