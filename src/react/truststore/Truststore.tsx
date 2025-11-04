import { ParsedCertificate } from '@scality/certchain';
import {
  AppContainer,
  Icon,
  IconHelp,
  Loader,
  SmallerText,
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
  useParseBundleCertificates,
  useParseSecretCertificates,
} from './hooks';

const formatCertificateDataForTable = (
  parsedCertificates: ParsedCertificate[][],
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
  certificates: ParsedCertificate[];
};

const skipTLSVerificationTooltipMessage = (
  <Stack direction="vertical">
    <SmallerText>
      Skip TLS Verification will allow you to access the bucket without
      verifying the TLS certificate.
    </SmallerText>
    <SmallerText>Consequences?</SmallerText>
    <SmallerText>
      Toggling this setting will require to update the configuration of Data
      Managmement Component. This action will take some time to complete.
    </SmallerText>
  </Stack>
);

const Truststore = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isCertificateDetailsModalOpen, setIsCertificateDetailsModalOpen] =
    useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<
    ParsedCertificate[] | null
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
    if (isLoadingZenkoCR || isParsingCertificates) {
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
        return <Text>{new Date(closestExpireDate).toLocaleDateString()}</Text>;
      },
    },
    {
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
