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
import { useMockData } from './useMockData';

type VeeamTableProps = Record<string, never>;

export default function VeeamTable(_: VeeamTableProps) {
  const [id, setId] = useState<number>(0);
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);

  const theme = useTheme();
  const history = useHistory();
  const { data } = useMockData({ id, setId });
  const { next } = useStepper(VeeamStepsIndexes.Table, VEEAM_STEPS);

  const columns: Column<{
    action: string;
    status?: string;
  }>[] = [
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
      Cell: ({ value }) => {
        const indexOf = data.findIndex((row) => row.status === 'error');
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
              label={'Retry'}
              onClick={() => {
                setId(indexOf);
              }}
            />
          </Box>
        ) : (
          <>Pending...</>
        );
      },
    },
  ];

  const isCancellable = data.some((row) => row.status !== undefined);
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
            label={'Cancel'}
            onClick={() => {
              setConfirmCancel(true);
            }}
          />
          <Button
            disabled={!isContinue}
            variant="primary"
            label={'Continue'}
            onClick={() => {
              next({});
            }}
          />
        </Stack>
      }
    >
      <div style={{ height: '25rem', width: '40rem' }}>
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
