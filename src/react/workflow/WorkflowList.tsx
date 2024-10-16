import { ConstrainedText, Icon } from '@scality/core-ui';
import { Button, Table } from '@scality/core-ui/dist/next';
import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { CoreUIColumn, Row } from 'react-table';
import { useTheme } from 'styled-components';
import type { Workflows } from '../../types/workflow';
import { Workflow } from '../../types/workflow';
import { TableHeaderWrapper } from '../ui-elements/Table';
import { TextTransformer } from '../ui-elements/Utility';

const SEARCH_QUERY_PARAM = 'search';
export function WorkflowTypeIcon({ value: type }: { value: string }) {
  return (
    <TextTransformer transform="capitalize">
      <Icon
        name={
          type === 'replication'
            ? 'Replication'
            : type === 'expiration'
            ? 'Expiration'
            : 'Transition'
        }
      ></Icon>{' '}
      {type}
    </TextTransformer>
  );
}
type Props = {
  workflows: Workflows;
  workflowId?: string;
};

function WorkflowList({ workflows, workflowId }: Props) {
  const history = useHistory();
  const theme = useTheme();

  function DataComponent({ row }: { row: Row<Workflow> }) {
    return (
      <ConstrainedText
        text={<span> {`${row.values.name}`} </span>}
        lineClamp={2}
      />
    );
  }

  function RowAsync({ row }: { row: Row<Workflow> }) {
    return <DataComponent row={row} />;
  }

  const renderRowSubComponent = useCallback(
    ({ row }: { row: Row<Workflow> }) => <RowAsync row={row} />,
    [],
  );

  const getRowId = (row: Workflow) => {
    return row.id;
  };

  const columns: CoreUIColumn<Workflow>[] = [
    {
      Header: 'Workflow Description',
      accessor: 'name',
      cellStyle: {
        textAlign: 'left',
        flex: '3',
        width: 'unset',
      },
      Cell: renderRowSubComponent,
    },
    {
      Header: 'Workflow Type',
      accessor: 'type',
      cellStyle: {
        textAlign: 'left',
        flex: '1',
        width: 'unset',
      },
      Cell: WorkflowTypeIcon,
    },
    {
      Header: 'State',
      accessor: 'state',
      cellStyle: {
        textAlign: 'left',
        flex: '0.5',
        width: 'unset',
      },
      sortType: (row1: Row<Workflow>, row2: Row<Workflow>) => {
        return `${row1.original.state}` < `${row2.original.state}` ? 1 : -1;
      },
      Cell: function ({ value }: { value: boolean }): string {
        return value ? 'Active' : 'Inactive';
      },
    },
  ];

  return (
    <div
      style={{
        backgroundColor: theme.backgroundLevel3,
        flex: 1,
      }}
    >
      <Table
        columns={columns}
        data={workflows}
        defaultSortingKey={'name'}
        getRowId={getRowId}
        entityName={{
          en: {
            singular: 'workflow',
            plural: 'workflows',
          },
        }}
      >
        <TableHeaderWrapper
          search={
            <Table.SearchWithQueryParams queryParams={SEARCH_QUERY_PARAM} />
          }
          actions={
            <Button
              icon={<Icon name="Create-add" />}
              label="Create Workflow"
              variant="primary"
              onClick={() => history.push('./create-workflow')}
              type="submit"
            />
          }
        />

        <Table.SingleSelectableContent
          rowHeight="h64"
          separationLineVariant="backgroundLevel1"
          selectedId={workflowId}
          onRowSelected={(selectedRow: Row<Workflow>) =>
            history.push(`./${selectedRow.original.id}`)
          }
        />
      </Table>
    </div>
  );
}

export default WorkflowList;
