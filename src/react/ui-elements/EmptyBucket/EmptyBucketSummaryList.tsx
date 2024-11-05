import { BasicText, Icon, IconHelp, Stack, Text } from '@scality/core-ui';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { useMemo } from 'react';
import { maybePluralize } from '../../utils';
import { DELETE_FAILED, DELETE_SUCCESS, TOTAL_ATTEMPTS } from './constants';
import {
  DeleteSummary,
  ErrorsList,
  ErrorsListData,
  TableDeleteSummaryData,
} from './types';
import { getUniqueErrorMessages } from './utils';
import { CoreUIColumn } from 'react-table';

type EmptyBucketSummaryListProps = {
  summaryData: DeleteSummary[];
};

const ErrorsTable = ({ messages }: { messages: string[] }) => {
  const messagesColumns: CoreUIColumn<ErrorsList>[] = [
    {
      Header: 'Error Message',
      accessor: 'message',
      cellStyle: {
        minWidth: '8rem',
      },
      Cell({ value }) {
        return <Text>{value}</Text>;
      },
    },
    {
      Header: 'Number of errors',
      accessor: 'errorNumbers',
      cellStyle: {
        minWidth: '8rem',
      },
      Cell({ value }) {
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
        {messages?.length ? <ErrorsTable messages={messages} /> : null}
      </Stack>
    );
  }

  return <BasicText>{text}</BasicText>;
};

const useCreateDeleteSummaryColumns = (): CoreUIColumn<DeleteSummary>[] =>
  useMemo(
    () => [
      {
        Header: TOTAL_ATTEMPTS,
        accessor: 'attempts',
        cellStyle: {
          minWidth: '12rem',
        },
        Cell({ value }) {
          return SummaryCell(value);
        },
      },
      {
        Header: DELETE_SUCCESS,
        accessor: 'deleted',
        cellStyle: {
          minWidth: '12rem',
        },
        Cell({ value }) {
          return SummaryCell(value, false, true);
        },
      },
      {
        Header: DELETE_FAILED,
        accessor: 'errors',
        cellStyle: {
          minWidth: '12rem',
        },
        Cell({ value }) {
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
