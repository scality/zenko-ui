import { useHistory } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import Table from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import Icon from '@scality/core-ui/dist/components/icon/Icon.component';
import { TextTransformer } from '../../../ui-elements/Utility';
import { useWorkflows } from '../../../workflow/Workflows';
import { AppState } from '../../../../types/state';
import { makeWorkflows } from '../../../queries';
import { APIWorkflows } from '../../../../types/workflow';
import { NameLinkContaner } from '../../../ui-elements/NameLink';
import { push } from 'connected-react-router';

const TableAction = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: ${spacing.sp16};
`;

function Workflow({ bucketName }: { bucketName: string }) {
  const history = useHistory();
  const dispatch = useDispatch();
  const accountName = useSelector(
    (state: AppState) =>
      state.auth.selectedAccount && state.auth.selectedAccount.userName,
  );
  const select = (workflows: APIWorkflows) => makeWorkflows(workflows);
  const { data, status } = useWorkflows(select, [bucketName]);

  const nameCell = (value) => {
    const id = value.row.original.id;
    const workflowName = value.value;
    return (
      <NameLinkContaner
        onClick={() =>
          dispatch(push(`/accounts/${accountName}/workflows/${id}`))
        }
      >
        {workflowName}
      </NameLinkContaner>
    );
  };
  const columns = [
    {
      Header: 'Rule name',
      accessor: 'name',
      cellStyle: {
        minWidth: '18rem',
      },
      Cell: (value) => nameCell(value),
    },
    {
      Header: 'Action',
      accessor: 'type',
      Cell({ value: type }: { value: string }) {
        return (
          <TextTransformer transform="capitalize">
            <Icon
              name={type === 'replication' ? 'Replication' : 'Expiration'}
            ></Icon>{' '}
            {type}
          </TextTransformer>
        );
      },
      cellStyle: {
        minWidth: '8rem',
      },
    },
    {
      Header: 'Status',
      accessor: 'state',
      Cell: ({ value }) => {
        return value ? 'Active' : 'Inactive';
      },
    },
  ];
  return (
    <div
      style={{
        padding: `${spacing.sp16}`,
        height: '100%',
      }}
    >
      <Table columns={columns} data={data || []} defaultSortingKey={'name'}>
        <TableAction>
          <Button
            icon={<i className="fas fa-plus" />}
            label="Create Rule"
            variant="secondary"
            onClick={() =>
              history.push(`/accounts/${accountName}/workflows/create-workflow`)
            }
            type="submit"
          ></Button>
        </TableAction>

        <Table.SingleSelectableContent
          rowHeight="h40"
          separationLineVariant="backgroundLevel2"
          backgroundVariant="backgroundLevel4"
        >
          {(Rows) => (
            <>
              {status === 'loading' || status === 'idle'
                ? 'Loading workflow...'
                : ''}
              {status === 'error'
                ? 'We failed to retrieve workflows, please retry later. If the error persists, please contact your support.'
                : ''}
              {status === 'success' ? <Rows /> : ''}
            </>
          )}
        </Table.SingleSelectableContent>
      </Table>
    </div>
  );
}
export default Workflow;
