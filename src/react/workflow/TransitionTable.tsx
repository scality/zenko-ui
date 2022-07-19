import { Banner } from '@scality/core-ui';
import { Box, Table } from '@scality/core-ui/dist/next';
import { useTheme } from 'styled-components';
import { BucketWorkflowTransitionV2 } from '../../js/managementClient/api';
import { APIWorkflows } from '../../types/workflow';
import { useWorkflows } from './Workflows';

type Props = {
  bucketName: string;
  applyToVersion: BucketWorkflowTransitionV2.ApplyToVersionEnum;
  objectKeyPrefix: string;
  objectTags: [];
  triggerDelayDays?: string;
  locationName?: string;
};

const TransitionTable = ({
  bucketName,
  applyToVersion,
  objectKeyPrefix,
  objectTags,
  triggerDelayDays,
  locationName,
}: Props) => {
  const theme = useTheme();
  const { data: transitions, status } = useWorkflows(
    (workflows: APIWorkflows) => {
      return workflows.filter((wf) => wf.transition).map((wf) => wf.transition);
    },
    {
      objectKeyPrefix: objectKeyPrefix,
      objectTags: objectTags,
    },
  );

  const transitionList =
    transitions?.filter(
      (ts: BucketWorkflowTransitionV2) =>
        ts.applyToVersion === applyToVersion && ts.bucketName === bucketName,
    ) || [];

  const isTransitionWithDate = transitionList?.find(
    (ts: BucketWorkflowTransitionV2) => ts.triggerDelayDate,
  );

  // Manually add the workflow description
  const transitionWithDesciption = transitionList.map(
    (ts: BucketWorkflowTransitionV2) => {
      return {
        description: `All current objects order than ${ts.triggerDelayDays} day(s) will transition to ${ts.locationName}`,
        ...ts,
      };
    },
  );
  if (triggerDelayDays && locationName) {
    transitionWithDesciption.push({
      triggerDelayDays,
      locationName,
      description: `Objects older than ${triggerDelayDays} day(s) will transition to ${locationName} `,
    });
  }

  const transitionWithDate = `A Transition Workflow was set up based on a specific date. We can't guarantee you the Workflow would be consistent.`;
  const columns = [
    {
      Header: 'Days',
      accessor: 'triggerDelayDays',
      cellStyle: {
        paddingLeft: '1rem',
      },
    },
    {
      Header: 'Storage Location',
      accessor: 'locationName',
      cellStyle: {
        minWidth: '12rem',
      },
    },
    {
      Header: 'Description',
      accessor: 'description',
      cellStyle: {
        minWidth: '36rem',
      },
    },
  ];
  return (
    <>
      {isTransitionWithDate && (
        <Banner
          icon={<i className="fas fa-exclamation-triangle" />}
          variant="warning"
        >
          {transitionWithDate}
        </Banner>
      )}
      {transitionWithDesciption.length && (
        <Box m={2} height="8rem" backgroundColor={theme.brand.backgroundLevel2}>
          <Table
            columns={columns}
            data={transitionWithDesciption}
            defaultSortingKey={'triggerDelayDays'}
          >
            <Table.SingleSelectableContent
              rowHeight="h32"
              separationLineVariant="backgroundLevel1"
              backgroundVariant="backgroundLevel2"
            />
          </Table>
        </Box>
      )}
    </>
  );
};
export default TransitionTable;
