import { Form, Icon, Stack, Text } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import {
  Column,
  Table,
} from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useState, useMemo, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import styled, { useTheme } from 'styled-components';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useMutationTableData } from '../../ui-elements/Veeam/useMutationTableData';
import { VeeamSkipModal } from '../../ui-elements/Veeam/VeeamSkipModal';
import { ISVStepsIndexes, ISV_STEPS } from './ISVSteps';
import { memo } from 'react';

export const ListItem = styled.li`
  padding: 0.5rem;
`;

export type ISVApplyActionsProps = {
  accountName: string;
  bucketName: string;
  application: string;
  capacityBytes: string;
  enableImmutableBackup: boolean;
};

type TableDataType = {
  step: number;
  action: string;
  status: 'success' | 'error' | 'loading' | 'idle';
  retry: () => void;
};

const getTableColumns = (
  theme: typeof useTheme extends () => infer R ? R : never,
): Column<TableDataType>[] => [
  {
    Header: 'Step',
    accessor: 'step',
    Cell: ({ value }) => <Text>{value}</Text>,
  },
  {
    Header: 'Action',
    accessor: 'action',
    cellStyle: { width: '50%' },
    Cell: ({ value }) => <Text>{value}</Text>,
  },
  {
    Header: 'Status',
    accessor: 'status',
    cellStyle: { width: '12.5%' },
    Cell: ({ value, row }) => {
      if (value === 'success') {
        return (
          <StatusBox>
            <Icon name="Check" color={theme.statusHealthy} />
            <span>Success</span>
          </StatusBox>
        );
      }

      if (value === 'error') {
        return (
          <StatusBox>
            <Icon name="Exclamation-triangle" color={theme.statusCritical} />
            <span>Failed</span>
            <Button
              icon={<Icon name="Redo" />}
              variant="secondary"
              type="button"
              label="Retry"
              onClick={row.original.retry}
            />
          </StatusBox>
        );
      }

      return <span>Pending...</span>;
    },
  },
];

const StatusBox = styled(Box)`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export default memo(function ISVApplyActions(
  propsConfiguration: ISVApplyActionsProps,
) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const theme = useTheme();
  const navigate = useBasenameRelativeNavigate();
  const queryClient = useQueryClient();
  const { next } = useStepper(ISVStepsIndexes.ApplyActions, ISV_STEPS);

  const { bucketName, enableImmutableBackup, accountName, application } =
    propsConfiguration;

  const { data, accessKey, secretKey } = useMutationTableData({
    propsConfiguration,
  });

  const columns = useMemo(() => getTableColumns(theme), [theme]);
  const isCancellable = useMemo(
    () => data.some((row) => row.status === 'error'),
    [data],
  );
  const isContinue = useMemo(
    () => data.every((row) => row.status === 'success'),
    [data],
  );

  const handleContinue = useCallback(() => {
    queryClient.invalidateQueries(['WebIdentityRoles']);
    next({
      accountName,
      bucketName,
      enableImmutableBackup,
      accessKey,
      secretKey,
      application,
    });
  }, [
    accountName,
    bucketName,
    enableImmutableBackup,
    accessKey,
    secretKey,
    application,
  ]);

  const handleExit = useCallback(() => {
    setConfirmCancel(true);
    queryClient.invalidateQueries(['WebIdentityRoles']);
  }, [queryClient]);

  return (
    <>
      <VeeamSkipModal
        isOpen={confirmCancel}
        close={() => setConfirmCancel(false)}
        exitAction={() => navigate('/')}
        modalContent={
          <ul>
            <ListItem>
              <Text>
                Any resources already created in this flow will be kept.
              </Text>
            </ListItem>
            <ListItem>
              <Text>
                To start Veeam assistant configuration again, you can go to the{' '}
                <b>Accounts</b> page.
              </Text>
            </ListItem>
          </ul>
        }
      />
      <Form
        layout={{
          title: 'Configure ARTESCA for Veeam',
          kind: 'page',
        }}
        requireMode="all"
        rightActions={
          <Stack gap="r16">
            <Button
              type="button"
              disabled={!isCancellable}
              variant="outline"
              label="Exit"
              onClick={handleExit}
            />
            <Button
              disabled={!isContinue}
              variant="primary"
              label={'Continue'}
              icon={<Icon name="Arrow-right" />}
              onClick={handleContinue}
            />
          </Stack>
        }
        style={{ width: '50rem' }}
      >
        <div style={{ height: '32rem' }}>
          <Table columns={columns} data={data}>
            <Table.SingleSelectableContent
              rowHeight="h32"
              separationLineVariant="backgroundLevel3"
              children={(Rows) => {
                return <>{Rows}</>;
              }}
            />
          </Table>
        </div>
      </Form>
    </>
  );
});
