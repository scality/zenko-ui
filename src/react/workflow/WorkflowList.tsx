import { useCallback } from 'react';
import { TextTransformer } from '../ui-elements/Utility';
import type { Workflows } from '../../types/workflow';
import { useHistory } from 'react-router-dom';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Workflow } from '../../types/workflow';
import { Button } from '@scality/core-ui/dist/next';
import { TitleRow as TableHeader } from '../ui-elements/TableKeyValue';
import { useTheme } from 'styled-components';
import { Icon } from '@scality/core-ui/dist/components/icon/Icon.component';
import { CoreUIColumn, Row } from 'react-table';
import { ConstrainedText } from '@scality/core-ui';

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
        marginLeft: '1rem',
      },
      Cell: renderRowSubComponent,
    },
    {
      Header: 'Workflow Type',
      accessor: 'type',
      cellStyle: {
        textAlign: 'left',
        flex: '1',
        marginLeft: '3rem',
      },
      Cell: WorkflowTypeIcon,
    },
    {
      Header: 'State',
      accessor: 'state',
      cellStyle: {
        textAlign: 'left',
        flex: '0.5',
        marginLeft: '1rem',
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
      >
        <div style={{ margin: '1rem' }}>
          <TableHeader>
            <Table.SearchWithQueryParams
              displayedName={{
                singular: 'workflow',
                plural: 'workflows',
              }}
              queryParams={SEARCH_QUERY_PARAM}
            />

            <Button
              icon={<Icon name="Create-add" />}
              label="Create Workflow"
              variant="primary"
              onClick={() => history.push('./create-workflow')}
              type="submit"
            />
          </TableHeader>
        </div>
        <Table.SingleSelectableContent
          rowHeight="h64"
          separationLineVariant="backgroundLevel1"
          backgroundVariant="backgroundLevel3"
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
