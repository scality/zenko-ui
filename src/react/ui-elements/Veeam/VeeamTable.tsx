import { Icon, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import {
  Column,
  Table,
} from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';
import { useMockData } from './useMockData';

export const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
`;

export default function VeeamTable() {
  const [id, setId] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(true);
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);

  const theme = useTheme();
  const history = useHistory();
  const { data } = useMockData({ id, setId });

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
      <CustomModal
        isOpen={confirmCancel}
        footer={
          <Wrap>
            <p></p>
            <Stack>
              <Button
                variant="danger"
                onClick={() => {
                  setConfirmCancel(false);
                  setOpen(false);
                  history.push('/');
                }}
                label="Cancel"
              />
              <Button
                variant="primary"
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
      </CustomModal>
    );
  }

  return (
    <CustomModal
      isOpen={open}
      title={<Text>Configure ARTESCA for Veeam</Text>}
      footer={
        <Wrap>
          <p></p>
          <Stack>
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
                setOpen(false);
              }}
            />
          </Stack>
        </Wrap>
      }
    >
      <div style={{ height: '25rem', width: '50rem' }}>
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
    </CustomModal>
  );
}
