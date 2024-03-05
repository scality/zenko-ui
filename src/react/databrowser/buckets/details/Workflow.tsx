import { ConstrainedText } from '@scality/core-ui';
import { Icon } from '@scality/core-ui/dist/components/icon/Icon.component';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui';
import { useHistory } from 'react-router-dom';
import { CellProps, CoreUIColumn } from 'react-table';
import styled from 'styled-components';
import {
  APIWorkflows,
  Workflow as WorflowType,
} from '../../../../types/workflow';
import { useCurrentAccount } from '../../../DataServiceRoleProvider';
import { makeWorkflows } from '../../../queries';
import { NameLinkContaner } from '../../../ui-elements/NameLink';
import { WorkflowTypeIcon } from '../../../workflow/WorkflowList';
import { useWorkflowsWithSelect } from '../../../workflow/Workflows';
import { PropsWithChildren } from 'react';

const TableAction = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${spacing.r16};
`;

function Workflow({ bucketName }: { bucketName: string }) {
  const history = useHistory();
  const { account } = useCurrentAccount();
  const accountName = account?.Name;
  const select = (workflows: APIWorkflows) => makeWorkflows(workflows);
  const { data, status } = useWorkflowsWithSelect(select, [bucketName]);

  const nameCell = (
    value: PropsWithChildren<CellProps<WorflowType, string>>,
  ) => {
    const id = value.row.original.id;
    const workflowName = value.value;
    return (
      <ConstrainedText
        text={
          <NameLinkContaner
            onClick={() =>
              history.push(`/accounts/${accountName}/workflows/${id}`)
            }
          >
            {workflowName}
          </NameLinkContaner>
        }
        lineClamp={2}
      />
    );
  };
  const columns: CoreUIColumn<WorflowType>[] = [
    {
      Header: 'Workflow Description',
      accessor: 'name',
      cellStyle: {
        flex: 2,
      },
      Cell: (value: PropsWithChildren<CellProps<WorflowType, string>>) =>
        nameCell(value),
      width: 0,
    },
    {
      Header: 'Action',
      accessor: 'type',
      Cell: WorkflowTypeIcon,
      cellStyle: {
        flex: 1,
      },
      width: 0,
    },
    {
      Header: 'Status',
      accessor: 'state',
      cellStyle: {
        flex: 1,
        textAlign: 'right',
      },
      Cell: ({ value }: { value: boolean }) => (value ? 'Active' : 'Inactive'),
      width: 0,
    },
  ];
  return (
    <div
      style={{
        height: '100%',
      }}
    >
      <Table
        columns={columns}
        data={data || []}
        defaultSortingKey={'name'}
        status={status}
        entityName={{
          en: {
            singular: 'workflow',
            plural: 'workflows',
          },
        }}
      >
        <TableAction>
          <Button
            icon={<Icon name="Create-add" />}
            label="Create Workflow"
            variant="secondary"
            onClick={() =>
              history.push(
                `/accounts/${accountName}/workflows/create-workflow?bucket=${bucketName}`,
              )
            }
            type="submit"
          />
        </TableAction>

        <Table.SingleSelectableContent
          rowHeight="h48"
          separationLineVariant="backgroundLevel2"
          backgroundVariant="backgroundLevel4"
        ></Table.SingleSelectableContent>
      </Table>
    </div>
  );
}
export default Workflow;
