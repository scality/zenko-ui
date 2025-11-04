import { Modal, Stack, Text } from '@scality/core-ui';
import React from 'react';
import { ModalBody } from '../ui-elements/Modal';
import { ParsedCertificate } from '@scality/certchain';
import styled from 'styled-components';

const CertificateViewFieldWrapper = styled.div`
  width: 12rem;
`;
const CertificateViewField = ({ children, ...rest }) => {
  return (
    <CertificateViewFieldWrapper {...rest}>
      <Text color="textSecondary">{children}</Text>
    </CertificateViewFieldWrapper>
  );
};
const Row = ({ children }) => {
  return (
    //@ts-expect-error - alignItems is missing in coreUI type
    <Stack role="row" alignItems="baseline">
      {children}
    </Stack>
  );
};

type CertificateDetailRowProps = {
  label: string;
  value: string | string[] | Date | null | undefined;
};

const CertificateDetailRow = ({ label, value }: CertificateDetailRowProps) => {
  const renderValue = () => {
    // Handle null/undefined
    if (!value) {
      return (
        <div role="cell">
          <Text isGentleEmphazed>Not set</Text>
        </div>
      );
    }

    // Handle Date objects
    if (value instanceof Date) {
      return <div role="cell">{value.toLocaleDateString()}</div>;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return (
          <div role="cell">
            <Text isGentleEmphazed>Not set</Text>
          </div>
        );
      }
      return (
        <Stack direction="vertical" gap="r4" role="cell">
          {value.map((item, idx) => (
            <div key={idx}>
              {item && item.length ? (
                item
              ) : (
                <Text isGentleEmphazed>Not set</Text>
              )}
            </div>
          ))}
        </Stack>
      );
    }

    // Handle single string
    return <div role="cell">{value}</div>;
  };

  return (
    <Row>
      <CertificateViewField role="cell">{label}</CertificateViewField>
      {renderValue()}
    </Row>
  );
};

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
      footer={<></>}
      isOpen={isModalOpen}
      title="Certificate Details"
    >
      <ModalBody style={{ maxHeight: '36rem' }}>
        <Stack direction="vertical" gap="r16" withSeparators>
          {selectedCertificate.map((certificate, index) => (
            <Stack
              direction="vertical"
              gap="r16"
              key={`${certificate.name}-${index}`}
            >
              <Text
                isEmphazed
                color="textSecondary"
                style={{
                  textAlign: 'center',
                  paddingBottom: '1rem',
                }}
              >
                {`${certificate.name}`}
                {selectedCertificate.length > 1 &&
                selectedCertificate.length === index + 1
                  ? ' (Root certificate)'
                  : ''}
              </Text>
              <CertificateDetailRow label="Name" value={certificate.name} />
              <CertificateDetailRow
                label="Authority"
                value={certificate.authority}
              />
              <CertificateDetailRow
                label="Expires on"
                value={certificate.expiresOn}
              />
              <CertificateDetailRow
                label="Altname(s)"
                value={certificate.altNames}
              />
              <CertificateDetailRow
                label="Common Name (CN)"
                value={certificate.commonName}
              />
              <CertificateDetailRow
                label="Organization (O)"
                value={certificate.organizations}
              />
              <CertificateDetailRow
                label="Org unit (OU)"
                value={certificate.organizationalUnits}
              />
              <CertificateDetailRow
                label="Locality (L)"
                value={certificate.localities}
              />
              <CertificateDetailRow
                label="Countries (C)"
                value={certificate.countries}
              />
              <CertificateDetailRow
                label="State (ST)"
                value={certificate.provinces}
              />
              <CertificateDetailRow
                label="Street Address (STREET)"
                value={certificate.streetAddresses}
              />
              <CertificateDetailRow
                label="Postal Code (PC)"
                value={certificate.postalCodes}
              />
              <CertificateDetailRow
                label="Serial Number (SN)"
                value={certificate.serialNumber}
              />
            </Stack>
          ))}
        </Stack>
      </ModalBody>
    </Modal>
  );
};

export default CertificateDetails;
