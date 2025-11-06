import {
  AppContainer,
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
import { useToggleTLSVerificationMutation } from '../../js/mutations';
import { ApiError } from '../../types/actions';
import { getZenkoCRQuery } from '../queries';
import { TableHeaderWrapper } from '../ui-elements/Table';
import CertificateDetails from './CertificateDetails';
import {
  CertificateWithPEM,
  useParseBundleCertificates,
  useParseSecretCertificates,
} from './hooks';
import { formatExpiryDate } from './utils';

const formatCertificateDataForTable = (
  parsedCertificates: CertificateWithPEM[][],
) => {
  const formattedCertificateData: CertificateData[] = parsedCertificates.map(
    (certificateBundle) => {
      const data: CertificateData = {
        metadata: [],
        expireOn: [],
        certificates: certificateBundle,
      };
      certificateBundle.forEach((certificate) => {
        data.metadata.push(certificate.commonName);
        data.expireOn.push(certificate.expiresOn);
      });
      return data;
    },
  );

  return formattedCertificateData;
};

type CertificateData = {
  metadata: string[];
  expireOn: Date[];
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
  const navigate = useBasenameRelativeNavigate();
  const {
    data: zenkoCR,
    status: zenkoCRStatus,
    isLoading: isLoadingZenkoCR,
    isError: isErrorZenkoCR,
  } = useQuery(getZenkoCRQuery());
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
  } = useToggleTLSVerificationMutation(toggleTLSVerificationMutationOptions);

  const isSkippingTLSVerification = useMemo(() => {
    return zenkoCR?.spec?.egress?.skipTLSVerify ?? false;
  }, [zenkoCR]);

  const extraCACerts = useMemo(() => {
    return zenkoCR?.spec?.egress?.extraCACerts ?? [];
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
          <Stack gap="r8">
            {value.map((v, index) => {
              return (
                <Stack
                  key={v}
                  direction="horizontal"
                  gap="r8"
                  style={{ alignItems: 'center' }}
                >
                  <Text>{v}</Text>
                  {index < value.length - 1 && (
                    <Icon name="Chevron-right" size="sm" />
                  )}
                </Stack>
              );
            })}
          </Stack>
        );
      },
    },
    {
      Header: 'Expire On',
      accessor: 'expireOn',
      cellStyle: {
        textAlign: 'right',
        flex: 1,
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
      cellStyle: { flex: 0.75 },
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
              onClick={() => {
                console.log(row.original);
              }}
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
          <Stack gap="r8">
            <Toggle
              label={
                isLoadingToggleTLSVerification
                  ? 'Updating TLS Verification...'
                  : 'Skip TLS Verification'
              }
              toggle={isSkippingTLSVerification}
              onChange={(e) => toggleTLSVerification(e.currentTarget.checked)}
              disabled={isLoadingZenkoCR || isLoadingToggleTLSVerification}
            />
            {isLoadingToggleTLSVerification && <Loader size="base" />}
            <IconHelp tooltipMessage={skipTLSVerificationTooltipMessage} />
          </Stack>
        </Wrap>
      </AppContainer.OverallSummary>
      <AppContainer.MainContent hasPadding>
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
                isSkippingTLSVerification &&
                'Imported certificates are ignored when Skip TLS Verification is enabled.'
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
            ></Table.SingleSelectableContent>
          </Table>
        </Box>
      </AppContainer.MainContent>
    </AppContainer>
  );
};

export default Truststore;
