import { Form, Icon, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import {
  Column,
  Table,
} from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { VEEAM_STEPS, VeeamStepsIndexes } from './VeeamSteps';
import { useMutationTableData } from './useMutationTableData';
import { useQueryClient } from 'react-query';

export type VeeamTableProps = {
  accountName: string;
  bucketName: string;
  application: string;
  capacityBytes: string;
  enableImmutableBackup: boolean;
};

export default function VeeamTable(propsConfiguration: VeeamTableProps) {
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);

  const theme = useTheme();
  const history = useHistory();
  const queryClient = useQueryClient();
  const { next } = useStepper(VeeamStepsIndexes.Table, VEEAM_STEPS);
  const { bucketName, enableImmutableBackup } = propsConfiguration;
  const { data, accessKey, secretKey } = useMutationTableData({
    propsConfiguration,
  });

  const columns: Column<(typeof data)[number]>[] = [
    {
      Header: 'Step',
      accessor: 'step',
      Cell: ({ value }) => {
        return <Text>{value}</Text>;
      },
    },
    {
      Header: 'Action',
      accessor: 'action',
      cellStyle: {
        width: '50%',
      },
      Cell: ({ value }) => {
        return <Text>{value}</Text>;
      },
    },
    {
      Header: 'Status',
      accessor: 'status',
      cellStyle: {
        width: '12.5%',
      },
      Cell: ({ value, row }) => {
        return value === 'success' ? (
          <Box display="flex" gap={8} alignItems="center">
            <Icon name="Check" color={theme.statusHealthy} />
            Success
          </Box>
        ) : value === 'error' ? (
          <Box display="flex" gap={8} alignItems="center">
            <Icon name="Exclamation-triangle" color={theme.statusCritical} />
            Failed
            <Button
              icon={<Icon name="Redo" />}
              variant="secondary"
              type="button"
              label={'Retry'}
              onClick={() => {
                row.original.retry();
              }}
            />
          </Box>
        ) : (
          <>Pending...</>
        );
      },
    },
  ];

  const isCancellable = data.some((row) => row.status === 'error');
  const isContinue = data.every((row) => row.status === 'success');

  if (confirmCancel) {
    return (
      <Modal
        isOpen={confirmCancel}
        footer={
          <Wrap>
            <p></p>
            <Stack>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmCancel(false);
                  history.push('/');
                }}
                label="Cancel"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmCancel(false);
                }}
                label="Continue"
              />
            </Stack>
          </Wrap>
        }
        title="Confirmation"
      >
        Are you sure you want to cancel ARTESCA Configuration for Veeam?
      </Modal>
    );
  }

  return (
    <Form
      layout={{
        title: 'Configure ARTESCA for Veeam',
        kind: 'page',
      }}
      requireMode="all"
      rightActions={
        <Stack gap="r16">
          <Button
            disabled={!isCancellable}
            variant="outline"
            label="Exit"
            onClick={() => {
              setConfirmCancel(true);
            }}
          />
          <Button
            disabled={!isContinue}
            variant="primary"
            label={'Continue'}
            icon={<Icon name="Arrow-right" />}
            onClick={() => {
              queryClient.invalidateQueries(['WebIdentityRoles']);
              next({ bucketName, enableImmutableBackup, accessKey, secretKey });
            }}
          />
        </Stack>
      }
    >
      <div style={{ height: '30rem', width: '40rem' }}>
        <Table columns={columns} data={data}>
          <Table.SingleSelectableContent
            rowHeight="h32"
            separationLineVariant="backgroundLevel3"
            backgroundVariant="backgroundLevel1"
            children={(Rows) => {
              return <>{Rows}</>;
            }}
          ></Table.SingleSelectableContent>
        </Table>
      </div>
    </Form>
  );
}
