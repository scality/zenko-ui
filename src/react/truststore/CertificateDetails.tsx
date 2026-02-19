import type { ParsedCertificate } from '@scality/certchain';
import { ConstrainedText, Icon, Modal, Stack, spacing, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { Box, CopyButton } from '@scality/core-ui/dist/next';
import type React from 'react';
import styled from 'styled-components';
import { ModalBody } from '../ui-elements/Modal';
import { downloadCertificate, formatExpiryDate } from './utils';

const CertificateViewFieldWrapper = styled.div`
  width: 12rem;
`;
const MAX_CONTENT_WIDTH = '24rem';

const CertificateViewField = ({ children, ...rest }) => {
  return (
    <CertificateViewFieldWrapper {...rest}>
      <Text color="textSecondary">{children}</Text>
    </CertificateViewFieldWrapper>
  );
};
const Row = ({ children }) => {
  return (
    <Stack role="row" style={{ alignItems: 'baseline' }}>
      {children}
    </Stack>
  );
};

type CertificateDetailRowProps = {
  label: string;
  value: string | string[] | Date | null | undefined;
  copyable?: boolean;
};
const NotSetItem = () => {
  return (
    // biome-ignore lint/a11y/useSemanticElements: used within a styled table layout
    <div role="cell">
      <Text isGentleEmphazed>Not set</Text>
    </div>
  );
};

const CertificateDetailRow = ({ label, value, copyable = false }: CertificateDetailRowProps) => {
  const renderValue = () => {
    // Handle null/undefined
    if (!value) {
      return <NotSetItem />;
    }

    let displayValue: string;
    let content: React.ReactNode;

    // Handle Date objects
    if (value instanceof Date) {
      if (label === 'Expires On') {
        displayValue = formatExpiryDate(value).shortFormatWithPrefix;
      } else {
        displayValue = formatExpiryDate(value).shortFormat;
      }
      content = <ConstrainedText text={displayValue} />;
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      if (value.length === 0) {
        return <NotSetItem />;
      }
      displayValue = value.join(', ');
      content = (
        <Stack direction="vertical" gap="r4">
          {value.map((item, idx) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
            <ConstrainedText key={idx} text={item?.length ? item : <NotSetItem />} />
          ))}
        </Stack>
      );
    }
    // Handle single string
    else {
      displayValue = value;
      content = <ConstrainedText text={value} />;
    }

    return (
      <Stack direction="horizontal" gap="r8" style={{ maxWidth: MAX_CONTENT_WIDTH, flex: 1 }}>
        <div style={{ flex: 1, minWidth: 0 }}>{content}</div>
        {copyable && <CopyButton textToCopy={displayValue} />}
      </Stack>
    );
  };

  return (
    <Row>
      <CertificateViewField role="cell">{label}</CertificateViewField>
      {renderValue()}
    </Row>
  );
};
const certificatePropertiesWithLabels = [
  {
    label: 'Common Name',
    property: 'commonName',
  },
  { label: 'Authority', property: 'authority' },
  {
    label: 'Organization',
    property: 'organizations',
  },
  {
    label: 'Issued On',
    property: 'issuedOn',
  },
  {
    label: 'Expires On',
    property: 'expiresOn',
  },
  {
    label: 'Certificate',
    property: 'certificateHash',
    copyable: true,
  },
  {
    label: 'Public Key',
    property: 'publicKey',
    copyable: true,
  },
];

const CertificateDetails = ({
  selectedCertificate,
  isModalOpen,
  handleClose,
}: {
  selectedCertificate: ParsedCertificate[];
  isModalOpen: boolean;
  handleClose: () => void;
}) => {
  return (
    <Modal
      close={handleClose}
      footer={
        <Box display="flex" justifyContent="flex-end">
          <Button label="Close" onClick={handleClose} variant="primary" style={{ minWidth: '80px' }} />
        </Box>
      }
      isOpen={isModalOpen}
      title="Certificate Details"
    >
      <ModalBody style={{ maxHeight: '24rem' }}>
        <Stack direction="vertical" gap="r32" withSeparators>
          {selectedCertificate.map((certificate, index) => (
            <Stack direction="vertical" gap="r16" key={`${certificate.name}-${index}`}>
              <Wrap
                style={{
                  marginBottom: spacing.r8,
                  alignItems: 'center',
                  height: '2rem',
                }}
              >
                <Box maxWidth="28rem">
                  <ConstrainedText
                    text={
                      <Text isEmphazed color="textPrimary">
                        {`${certificate.commonName}`}
                        {selectedCertificate.length > 1 && selectedCertificate.length === index + 1
                          ? ' (Root certificate)'
                          : ''}
                      </Text>
                    }
                  />
                </Box>
                <Button
                  icon={<Icon name="Download" />}
                  variant="secondary"
                  label="Download"
                  aria-label={`Download ${certificate.commonName} certificate`}
                  onClick={() => downloadCertificate(certificate)}
                />
              </Wrap>
              {certificatePropertiesWithLabels.map((property) => (
                <CertificateDetailRow
                  key={property.property}
                  label={property.label}
                  copyable={property.copyable}
                  value={certificate[property.property]}
                />
              ))}
            </Stack>
          ))}
        </Stack>
      </ModalBody>
    </Modal>
  );
};

export default CertificateDetails;
