import { BasicText, Icon, IconHelp, Stack, Text } from '@scality/core-ui';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { useMemo } from 'react';
import { maybePluralize } from '../../utils';
import { DELETE_FAILED, DELETE_SUCCESS, TOTAL_ATTEMPTS } from './constants';
import { DeleteSummary, ErrorsListData, TableDeleteSummaryData } from './types';
import { getUniqueErrorMessages } from './utils';

type EmptyBucketSummaryListProps = {
  summaryData: DeleteSummary[];
};

const ErrorsTable = (messages: string[]) => {
  const messagesColumns = [
    {
      Header: 'Error Message',
      accessor: 'message',
      cellStyle: {
        minWidth: '8rem',
      },
      Cell({ value }: { value: string }) {
        return <Text>{value}</Text>;
      },
    },
    {
      Header: 'Number of errors',
      accessor: 'errorNumbers',
      cellStyle: {
        minWidth: '8rem',
      },
      Cell({ value }: { value: number }) {
        return <Text>{value}</Text>;
      },
    },
  ];

  const list = getUniqueErrorMessages(messages);

  const TABLE_HEIGHT = list.filter((l) => typeof l === 'object').length * 5;

  return (
    <IconHelp
      placement="top"
      overlayStyle={{ width: '30rem' }}
      tooltipMessage={
        <div style={{ height: `${TABLE_HEIGHT}rem` }}>
          <Table columns={messagesColumns} data={list as ErrorsListData[]}>
            <Table.SingleSelectableContent
              rowHeight="h32"
              separationLineVariant="backgroundLevel3"
            />
          </Table>
        </div>
      }
    />
  );
};
const SummaryCell = (
  value: number,
  isFailed = false,
  withIcon = false,
  messages?: string[],
) => {
  const text = maybePluralize(value, 'object');
  if (withIcon) {
    return (
      <Stack>
        <Icon
          name={isFailed ? 'Exclamation-circle' : 'Check-circle'}
          color={isFailed ? 'statusCritical' : 'statusHealthy'}
        />
        <BasicText>{text}</BasicText>
        {messages?.length ? ErrorsTable(messages) : null}
      </Stack>
    );
  }

  return <BasicText>{text}</BasicText>;
};

const useCreateDeleteSummaryColumns = () =>
  useMemo(
    () => [
      {
        Header: TOTAL_ATTEMPTS,
        accessor: 'attempts',
        cellStyle: {
          minWidth: '12rem',
        },
        Cell({ value }: { value: number }) {
          return SummaryCell(value);
        },
      },
      {
        Header: DELETE_SUCCESS,
        accessor: 'deleted',
        cellStyle: {
          minWidth: '12rem',
        },
        Cell({ value }: { value: number }) {
          return SummaryCell(value, false, true);
        },
      },
      {
        Header: DELETE_FAILED,
        accessor: 'errors',
        cellStyle: {
          minWidth: '12rem',
        },
        Cell({ value }: { value: { nbErrors: number; messages?: string[] } }) {
          return SummaryCell(value.nbErrors, true, true, value.messages);
        },
      },
    ],
    [],
  );

export const EmptyBucketSummaryList = ({
  summaryData,
}: EmptyBucketSummaryListProps) => {
  const summaryColumns = useCreateDeleteSummaryColumns();

  return (
    <div style={{ height: '15rem' }}>
      <Table
        columns={summaryColumns}
        data={summaryData as TableDeleteSummaryData[]}
      >
        <div style={{ height: '10rem', paddingBottom: '5rem' }}>
          <Table.SingleSelectableContent
            rowHeight="h40"
            separationLineVariant="backgroundLevel1"
          />
        </div>
      </Table>
    </div>
  );
};
