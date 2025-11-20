import {
  AppContainer,
  Banner,
  ConstrainedText,
  Icon,
  IconHelp,
  Loader,
  spacing,
  Stack,
  Text,
  Toggle,
  useToast,
  Wrap,
} from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/components/box/Box';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useMemo, useState } from 'react';
import { MutationOptions, useQuery, useQueryClient } from 'react-query';
import { CoreUIColumn, Row } from 'react-table';
import {
  useDeleteCertificateFromZenkoConfigurationMutation,
  useToggleTLSVerificationMutation,
} from '../../js/mutations';
import { ApiError } from '../../types/actions';
import { getZenkoCRQuery } from '../queries';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import { TableHeaderWrapper } from '../ui-elements/Table';
import CertificateDetails from './CertificateDetails';
import {
  useParseBundleCertificates,
  useParseSecretCertificates,
  ZenkoCRCertificateBundle,
  ZenkoCRCertificateBundleWithIndex,
} from './hooks';
import { formatExpiryDate } from './utils';
import { ParsedCertificate } from '@scality/certchain';

export type CertificateWithPEM = ParsedCertificate & {
  originalPEM: string;
};

// the index is used to track the order in Zenko CR
export type ParsedCertificatesBundleWithIndex = {
  parsedCertificates: CertificateWithPEM[];
  index: number;
};

const formatCertificateDataForTable = (
  parsedCertificates: ParsedCertificatesBundleWithIndex[],
) => {
  const formattedCertificateData: CertificateData[] = parsedCertificates.map(
    (certificateBundle: ParsedCertificatesBundleWithIndex) => {
      const data: CertificateData = {
        index: certificateBundle.index,
        metadata: [],
        expiresOn: [],
        certificates: certificateBundle.parsedCertificates,
      };
      certificateBundle.parsedCertificates.forEach(
        (certificate: ParsedCertificate) => {
          data.metadata.push(certificate.commonName);
          data.expiresOn.push(certificate.expiresOn);
        },
      );
      return data;
    },
  );

  return formattedCertificateData;
};

type CertificateData = {
  index: number;
  metadata: string[];
  expiresOn: Date[];
  certificates: CertificateWithPEM[];
};

const skipTLSVerificationTooltipMessage = (
  <Stack direction="vertical" gap="r8">
    <Text variant="Small">
      Skip TLS Verification will allow you to access external locations without
      verifying their TLS certificates.
    </Text>
    <Text variant="Small">
      Without TLS verification, you lose the ability to:
      <ul style={{ marginLeft: spacing.r16 }}>
        <li style={{ marginBottom: spacing.r4 }}>
          verify the external location's identity
        </li>
        <li style={{ marginBottom: spacing.r4 }}>ensure non-repudiation</li>
      </ul>
      Your data remains encrypted, but the secure channel verification is
      bypassed.
    </Text>
    <Text variant="Small">
      Toggling this setting will update the Data Management Component
      configuration. This action will take some time to complete.
    </Text>
  </Stack>
);

const Truststore = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isCertificateDetailsModalOpen, setIsCertificateDetailsModalOpen] =
    useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<
    CertificateWithPEM[] | null
  >(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<{
    index: number;
    metadata: string[];
  } | null>(null);
  const navigate = useBasenameRelativeNavigate();
  const {
    data: zenkoCR,
    status: zenkoCRStatus,
    isLoading: isLoadingZenkoCR,
    isError: isErrorZenkoCR,
  } = useQuery(getZenkoCRQuery());

  const hasEgress = useMemo(() => {
    return !!zenkoCR?.spec?.egress;
  }, [zenkoCR]);

  const toggleTLSVerificationMutationOptions: MutationOptions<
    { skipTLSVerify: boolean },
    ApiError,
    { skipTLSVerify: boolean }
  > = {
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['zenkoCR'] });
      showToast({
        message: 'TLS verification updated successfully',
        status: 'success',
        open: true,
      });
    },
    onError: () => {
      showToast({
        message: 'Failed to update TLS verification',
        status: 'error',
        open: true,
      });
    },
  };

  const {
    mutate: toggleTLSVerificationMutation,
    isLoading: isLoadingToggleTLSVerification,
  } = useToggleTLSVerificationMutation(
    hasEgress,
    toggleTLSVerificationMutationOptions,
  );

  const deleteCertificateMutationOptions: MutationOptions<
    { certificateIndex: number },
    ApiError,
    { certificateIndex: number }
  > = {
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['zenkoCR'] });
      showToast({
        message: 'Certificate deleted successfully',
        status: 'success',
        open: true,
      });
      setIsDeleteConfirmationOpen(false);
      setCertificateToDelete(null);
    },
    onError: () => {
      showToast({
        message: 'Failed to delete certificate',
        status: 'error',
        open: true,
      });
    },
  };

  const {
    mutate: deleteCertificateMutation,
    isLoading: isLoadingDeleteCertificate,
  } = useDeleteCertificateFromZenkoConfigurationMutation(
    deleteCertificateMutationOptions,
  );

  const isTLSVerificationActive = useMemo(() => {
    return !zenkoCR?.spec?.egress?.skipTLSVerify;
  }, [zenkoCR]);

  const extraCACerts = useMemo(() => {
    // Add index to the extraCACerts to track the order of the ca/secret certificates
    const extraCACertsWithIndex = zenkoCR?.spec?.egress?.extraCACerts?.map(
      (
        cert: ZenkoCRCertificateBundle,
        index: number,
      ): ZenkoCRCertificateBundleWithIndex => ({
        ...cert,
        index,
      }),
    );
    return extraCACertsWithIndex ?? [];
  }, [zenkoCR]);

  const {
    parsedCertificates: parsedExtraCACerts,
    isLoading: isParsingCertificates,
  } = useParseBundleCertificates(extraCACerts);

  const { parsedSecretCertificates, isLoading: isParsingSecretCertificates } =
    useParseSecretCertificates(extraCACerts);

  const formattedCertificateDataForTable = useMemo(() => {
    const list = [...parsedExtraCACerts, ...parsedSecretCertificates];
    return list.length > 0 ? formatCertificateDataForTable(list) : [];
  }, [parsedExtraCACerts, parsedSecretCertificates]);

  const toggleTLSVerification = (skipTLSVerify: boolean) => {
    toggleTLSVerificationMutation({ skipTLSVerify });
  };

  const handleDeleteClick = (certificateData: CertificateData) => {
    setCertificateToDelete({
      index: certificateData.index,
      metadata: certificateData.metadata,
    });
    setIsDeleteConfirmationOpen(true);
  };

  const handleDeleteApprove = () => {
    if (certificateToDelete) {
      deleteCertificateMutation({
        certificateIndex: certificateToDelete.index,
      });
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteConfirmationOpen(false);
    setCertificateToDelete(null);
  };

  const status = useMemo(() => {
    if (
      isLoadingZenkoCR ||
      isParsingCertificates ||
      isParsingSecretCertificates
    ) {
      return 'loading';
    }
    if (isErrorZenkoCR) {
      return 'error';
    }
    if (zenkoCRStatus === 'success' && parsedExtraCACerts) {
      return 'success';
    }
    return 'idle';
  }, [
    isLoadingZenkoCR,
    isParsingCertificates,
    isParsingSecretCertificates,
    isErrorZenkoCR,
    zenkoCRStatus,
    parsedExtraCACerts,
  ]);

  /* --------------------------------- COLUMNS -------------------------------- */
  const columns: CoreUIColumn<CertificateData>[] = [
    {
      Header: 'Name',
      accessor: 'metadata',
      cellStyle: { flex: 1 },
      Cell: ({ value }: { value: string[] }) => {
        return (
          <ConstrainedText
            lineClamp={1}
            text={value.map((v, index) => (
              <Text key={v}>
                {v}
                {index < value.length - 1 && (
                  <Text>
                    {' '}
                    <Icon name="Chevron-right" size="sm" />{' '}
                  </Text>
                )}
              </Text>
            ))}
          />
        );
      },
    },
    {
      Header: 'Expires On',
      accessor: 'expiresOn',
      cellStyle: {
        textAlign: 'right',
        flex: 0.5,
        paddingRight: spacing.f36,
      },
      Cell: ({ value }: { value: Date[] }) => {
        const closestExpireDate =
          value.length > 1
            ? value.sort((a, b) => {
                return a.getTime() - b.getTime();
              })[0]
            : value[0];
        const { shortFormatWithPrefix, status } =
          formatExpiryDate(closestExpireDate);
        return (
          <Stack
            direction="horizontal"
            style={{ alignItems: 'center', justifyContent: 'flex-end' }}
          >
            {status === 'warning' ? (
              <Icon name="Warning" />
            ) : status === 'critical' ? (
              <Icon name="Critical" />
            ) : null}

            <Text>{shortFormatWithPrefix}</Text>
          </Stack>
        );
      },
    },
    {
      Header: '',
      id: 'actions',
      cellStyle: { flex: 0.5 },
      Cell: ({ row }: { row: Row<CertificateData> }) => {
        return (
          <Stack
            style={{ justifyContent: 'flex-end', marginRight: spacing.r16 }}
          >
            <Button
              label="View Details"
              variant="outline"
              icon={<Icon name="Eye" />}
              onClick={() => {
                setSelectedCertificate(row.original.certificates);
                setIsCertificateDetailsModalOpen(true);
              }}
            />
            <Button
              label="Delete"
              variant="danger"
              icon={<Icon name="Delete" />}
              aria-label="Delete Certificate"
              onClick={() => handleDeleteClick(row.original)}
            />
          </Stack>
        );
      },
    },
  ];

  return (
    <AppContainer>
      <AppContainer.OverallSummary>
        <Wrap>
          <Stack>
            <Icon name="ID-card" size="2x" withWrapper />
            <Text variant="Larger">Truststore</Text>
          </Stack>
          <Stack direction="vertical" gap="r8">
            <Stack
              direction="horizontal"
              gap="r4"
              style={{ marginRight: spacing.r16 }}
            >
              <Text>TLS Verification</Text>
              <IconHelp tooltipMessage={skipTLSVerificationTooltipMessage} />
            </Stack>
            <Stack gap="r8">
              <Toggle
                label={
                  isLoadingToggleTLSVerification
                    ? 'Updating...'
                    : isTLSVerificationActive
                    ? 'Active'
                    : 'Skipped'
                }
                toggle={isTLSVerificationActive}
                onChange={(e) => {
                  toggleTLSVerification(!e.currentTarget.checked);
                }}
                disabled={isLoadingZenkoCR || isLoadingToggleTLSVerification}
              />
              {isLoadingToggleTLSVerification && <Loader size="base" />}
            </Stack>
          </Stack>
        </Wrap>
      </AppContainer.OverallSummary>
      <AppContainer.MainContent hasPadding>
        <DeleteConfirmation
          show={isDeleteConfirmationOpen}
          approve={handleDeleteApprove}
          cancel={handleDeleteCancel}
          isLoading={isLoadingDeleteCertificate}
          titleText={
            <Stack direction="vertical">
              <Text>
                Are you sure you want to delete this certificate from the
                truststore?
              </Text>

              {certificateToDelete?.metadata &&
              certificateToDelete.metadata.length > 0
                ? certificateToDelete.metadata.map((name, index) => (
                    <Stack gap="r4" key={name + index}>
                      <Text isEmphazed>{name}</Text>
                      {index < certificateToDelete.metadata.length - 1 && (
                        <Icon name="Chevron-right" size="sm" />
                      )}
                    </Stack>
                  ))
                : ''}
            </Stack>
          }
        />
        <CertificateDetails
          selectedCertificate={selectedCertificate ?? []}
          isModalOpen={isCertificateDetailsModalOpen}
          handleClose={() => {
            setIsCertificateDetailsModalOpen(false);
            setSelectedCertificate(null);
          }}
        />
        <Box width="100%">
          <Table
            columns={columns}
            status={status}
            data={formattedCertificateDataForTable}
            entityName={{
              en: { singular: 'certificate', plural: 'certificates' },
              fr: { singular: 'certificat', plural: 'certificats' },
            }}
          >
            <TableHeaderWrapper
              search={
                !isTLSVerificationActive && (
                  <Banner
                    variant="warning"
                    icon={
                      <Icon color="statusWarning" name="Exclamation-circle" />
                    }
                  >
                    <Text>
                      Imported certificates listed below are ignored when{' '}
                      <Text isEmphazed>TLS Verification</Text> is skipped.
                    </Text>
                  </Banner>
                )
              }
              actions={
                <Button
                  label="Import Certificate"
                  icon={<Icon name="Upload" />}
                  variant="primary"
                  onClick={() => {
                    navigate('/truststore/import-certificate');
                  }}
                />
              }
            />
            <Table.SingleSelectableContent
              rowHeight="h40"
              separationLineVariant="backgroundLevel2"
            />
          </Table>
        </Box>
      </AppContainer.MainContent>
    </AppContainer>
  );
};

export default Truststore;
