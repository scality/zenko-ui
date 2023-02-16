import { useHistory } from 'react-router';
import styled from 'styled-components';
import { Table } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { Icon } from '@scality/core-ui/dist/components/icon/Icon.component';
import { TextTransformer } from '../../../ui-elements/Utility';
import { useWorkflowsWithSelect } from '../../../workflow/Workflows';
import { makeWorkflows } from '../../../queries';
import { APIWorkflows } from '../../../../types/workflow';
import { NameLinkContaner } from '../../../ui-elements/NameLink';
import { useCurrentAccount } from '../../../DataServiceRoleProvider';
import { WorkflowTypeIcon } from '../../../workflow/WorkflowList';

const TableAction = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${spacing.sp16};
`;

function Workflow({ bucketName }: { bucketName: string }) {
  const history = useHistory();
  const { account } = useCurrentAccount();
  const accountName = account?.Name;
  const select = (workflows: APIWorkflows) => makeWorkflows(workflows);
  const { data, status } = useWorkflowsWithSelect(select, [bucketName]);

  const nameCell = (value) => {
    const id = value.row.original.id;
    const workflowName = value.value;
    return (
      <NameLinkContaner
        onClick={() => history.push(`/accounts/${accountName}/workflows/${id}`)}
      >
        {workflowName}
      </NameLinkContaner>
    );
  };
  const columns = [
    {
      Header: 'Workflow Description',
      accessor: 'name',
      cellStyle: {
        flex: 2,
      },
      Cell: (value) => nameCell(value),
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
      Cell: ({ value }) => {
        return value ? 'Active' : 'Inactive';
      },
      width: 0,
    },
  ];
  return (
    <div
      style={{
        height: '100%',
      }}
    >
      <Table columns={columns} data={data || []} defaultSortingKey={'name'}>
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
        >
          {(Rows) => (
            <>
              {status === 'loading' || status === 'idle'
                ? 'Loading workflows...'
                : ''}
              {status === 'error'
                ? 'We failed to retrieve workflows, please retry later. If the error persists, please contact your support.'
                : ''}
              {status === 'success' &&
                !data?.length &&
                'No workflows found on this bucket.'}
              {status === 'success' ? Rows : ''}
            </>
          )}
        </Table.SingleSelectableContent>
      </Table>
    </div>
  );
}
export default Workflow;
