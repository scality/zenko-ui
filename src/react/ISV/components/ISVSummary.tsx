import { Banner, Form, FormGroup, FormSection, Icon, InfoMessage, Text } from '@scality/core-ui';
import { Button, CopyButton } from '@scality/core-ui/dist/next';
import { spacing, Wrap } from '@scality/core-ui/dist/spacing';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import React, { useCallback } from 'react';
import styled from 'styled-components';
import { CertificateDownloadButton } from '../../next-architecture/ui/CertificateDownloadButton';
import { HideCredential } from '../../ui-elements/Hide';
import { useAuthGroups } from '../../utils/hooks';
import { VEEAM_OFFICE_365 } from '../constants';
import type {
  BucketItem,
  DefaultSectionId,
  FormData,
  OptionalFailure,
  SectionDef,
  SectionRenderProps,
  SummaryRenderProps,
} from '../engine/types';
import { useGetS3ServicePoint } from '../hooks/useGetS3ServicePoint';
import { useISVStepper } from './ISVStepperContext';

export const DEFAULT_REGION = 'us-east-1';

const WrapperWithWidth = styled(Wrap)`
  width: 20rem;
`;
const Container = styled.div`
  background-color: ${(props) => props.theme.backgroundLevel4};
  padding: ${spacing.r16};
`;

const Level4FormSection = ({ children, title }: Parameters<typeof FormSection>[0]) => {
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

type InternalSectionProps = SectionRenderProps & {
  secretKeyLabel: string;
  baseAccessKeyLabel: string;
  serviceEndpointLabel: string;
  immutableSectionInfos: {
    label: string;
    helpText?: string;
  };
  shouldHideImmutableSection: boolean;
};

const ConnectionInfoSection = ({ s3ServicePoint, serviceEndpointLabel }: InternalSectionProps) => (
  <FormSection forceLabelWidth={150}>
    <FormGroup
      id="service-endpoint"
      label={serviceEndpointLabel}
      required
      content={
        <WrapperWithWidth>
          <Text>{s3ServicePoint}</Text>
          <CopyButton textToCopy={s3ServicePoint} aria-label={`copy ${serviceEndpointLabel.toLowerCase()}`} />
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
          <CopyButton textToCopy={DEFAULT_REGION} aria-label="copy region" />
        </WrapperWithWidth>
      }
    />
  </FormSection>
);

const CredentialsSection = ({
  accessKey,
  secretKey,
  accessKeys,
  secretKeyLabel,
  baseAccessKeyLabel,
}: InternalSectionProps) => {
  if (secretKey) {
    return (
      <FormSection forceLabelWidth={150} title={{ name: 'Credentials' }}>
        <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
          The {secretKeyLabel} cannot be retrieved afterwards, so make sure to keep and secure it now. <br />
          You will be able to create new {baseAccessKeyLabel}s at any time.
        </Banner>
        <FormGroup
          id="access-key"
          label={baseAccessKeyLabel}
          required
          content={
            <WrapperWithWidth>
              <Text style={{ display: 'flex', alignItems: 'center' }}>{accessKey}</Text>
              <CopyButton textToCopy={accessKey} aria-label="copy access key" />
            </WrapperWithWidth>
          }
        />
        <FormGroup
          id="secret-key"
          label={secretKeyLabel}
          required
          content={
            <WrapperWithWidth>
              <HideCredential credentials={secretKey} />
              <CopyButton textToCopy={secretKey} aria-label="copy secret access key" />
            </WrapperWithWidth>
          }
        />
      </FormSection>
    );
  }

  if (accessKeys) {
    return (
      <>
        <Text isEmphazed>{`Credentials`}</Text>
        <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
          An existing user has been chosen and no new {baseAccessKeyLabel} has been created.
          <br />
          You must use an {baseAccessKeyLabel} and {secretKeyLabel} already created. Here is a list of{' '}
          {baseAccessKeyLabel}s that can be used for this user:
        </Banner>
        <FormSection forceLabelWidth={150}>
          {accessKeys.map((ak, index) => (
            <FormGroup
              key={ak}
              id={`access-key-${index}`}
              label={baseAccessKeyLabel}
              required
              content={
                <WrapperWithWidth>
                  <Text style={{ display: 'flex', alignItems: 'center' }}>{ak}</Text>
                  <CopyButton textToCopy={ak} aria-label="copy access key" />
                </WrapperWithWidth>
              }
            />
          ))}
        </FormSection>
      </>
    );
  }

  return null;
};

const BucketsSection = ({ formData, platform }: InternalSectionProps) => {
  const bucketItems = formData.buckets as BucketItem[];
  return (
    <>
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
                <CopyButton textToCopy={bucket.name} aria-label="copy bucket name" />
              </WrapperWithWidth>
            }
          />
        ))}
      </FormSection>
    </>
  );
};

const ImmutabilitySection = ({ formData, immutableSectionInfos, shouldHideImmutableSection }: InternalSectionProps) => {
  if (shouldHideImmutableSection) {
    return null;
  }

  return (
    <FormSection title={{ name: 'Option' }} forceLabelWidth={150}>
      <FormGroup
        id="immutable"
        required
        label={immutableSectionInfos.label}
        helpErrorPosition="bottom"
        help={immutableSectionInfos.helpText}
        content={<Text>{formData.enableImmutableBackup ? 'Active' : 'Inactive'}</Text>}
      />
    </FormSection>
  );
};

export const DEFAULT_SECTIONS: SectionDef[] = [
  { id: 'connectionInfo' },
  { id: 'credentials' },
  { id: 'buckets' },
  { id: 'immutability' },
];

const renderSection = (section: SectionDef, props: InternalSectionProps): React.ReactNode => {
  if ('render' in section) {
    return section.render(props);
  }

  const sectionId = section.id as DefaultSectionId;
  switch (sectionId) {
    case 'connectionInfo':
      return <ConnectionInfoSection {...props} />;
    case 'credentials':
      return <CredentialsSection {...props} />;
    case 'buckets':
      return <BucketsSection {...props} />;
    case 'immutability':
      return <ImmutabilitySection {...props} />;
    default:
      return null;
  }
};

export type ISVSummaryProps = FormData & {
  accessKey: string;
  secretKey: string;
  accessKeys?: string[];
  optionalFailures?: OptionalFailure[];
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

  const immutableSectionInfos = {
    label: platform.summary.immutabilityLabel || 'Object-lock',
    helpText: platform.summary.immutabilityHelpText?.(enableImmutableBackup),
  };

  const shouldHideImmutableSection = application === VEEAM_OFFICE_365;

  const serviceEndpointLabel = platform.summary.serviceEndpointLabel || 'Service point';

  const bucketItems = buckets as BucketItem[];
  const baseAccessKeyLabel = platform.summary.accessKeyLabel || 'Access key ID';
  const accessKeyLabel = accessKey || accessKeys?.length === 1 ? baseAccessKeyLabel : `${baseAccessKeyLabel}s`;
  const secretKeyLabel = platform.summary.secretKeyLabel || 'Secret Access key';
  const textToCopy = `${serviceEndpointLabel}\t${s3ServicePoint}\nRegion\t${DEFAULT_REGION}\n${accessKeyLabel}\t${accessKey ? accessKey : accessKeys?.join(', ')}\n${
    secretKey ? `${secretKeyLabel}\t${secretKey}\n` : ''
  }Bucket names\t${bucketItems.map((bucket) => bucket.name).join(', ')}`;

  return (
    <Form
      layout={{
        title: platform.summary.title || `${platform.name} Repository preparation summary`,
        kind: 'page',
      }}
      requireMode="all"
      rightActions={<Button variant="primary" type="button" label="Finish" onClick={onFinish} />}
    >
      <Text isEmphazed>
        Your ARTESCA is now configured and ready to integrate with {platform.name}. <br />
        The next steps involve managing Certificates and entering specific ARTESCA details within the {platform.name}{' '}
        application.
      </Text>

      {isPlatformAdmin && (
        <Level4FormSection title={{ name: '1. Certificates' }}>
          <InfoMessage
            title={'How to manage Certificates?'}
            link="/artesca/docs/standard_operations/manage_ingress_certificate/index.html"
            content={
              <ul>
                <li>
                  By default, all certificates are generated using the ARTESCA built-in Certificate Authority and are
                  valid for 3 months. After that time period, the certificates are automatically renewed.
                </li>
                <li>
                  To avoid a service interruption every time a certificate is being renewed, you must either trust the
                  ARTESCA built-in Certificate Authority (which is valid for 10 years), or replace certificates using a
                  custom or external Certificate Authority.
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
          <Text isEmphazed>{`${isPlatformAdmin ? '2. ' : ''}Information for the ${platform.name} configuration`}</Text>
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
        <>
          {(platform.summary.sections ?? DEFAULT_SECTIONS).map((section, index, arr) => {
            const sectionProps: InternalSectionProps = {
              formData,
              accessKey,
              secretKey,
              accessKeys,
              s3ServicePoint,
              platform,
              secretKeyLabel,
              baseAccessKeyLabel,
              serviceEndpointLabel,
              immutableSectionInfos,
              shouldHideImmutableSection,
            };
            const rendered = renderSection(section, sectionProps);
            if (!rendered) return null;
            return (
              <React.Fragment key={section.id}>
                {rendered}
                {index < arr.length - 1 && <Separator />}
              </React.Fragment>
            );
          })}
        </>
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
  optionalFailures,
}: ISVSummaryProps) => {
  const navigate = useBasenameRelativeNavigate();
  const { platform } = useISVStepper();

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
    const bucketItems = buckets as BucketItem[];
    const firstBucket = bucketItems[0];
    if (firstBucket) {
      navigate(`/accounts/${accountName}/buckets/${firstBucket.name}`);
    } else {
      navigate(`/accounts/${accountName}`);
    }
  }, [accountName, buckets, navigate]);

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
    optionalFailures,
  };

  if (platform.summary.customRender) {
    const customResult = platform.summary.customRender(summaryProps);
    if (customResult) {
      return customResult;
    }
  }

  return renderDefault();
};
