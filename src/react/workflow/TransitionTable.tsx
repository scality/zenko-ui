import { Banner, Icon } from '@scality/core-ui';
import { Box, Table } from '@scality/core-ui/dist/next';
import { useRouteMatch } from 'react-router';
import { useTheme } from 'styled-components';
import { BucketWorkflowTransitionV2 } from '../../js/managementClient/api';
import { Tag } from '../../types/s3';
import { APIWorkflows } from '../../types/workflow';
import { GentleEmphaseSecondaryText } from '../ui-elements/Table';
import { filterWorkflows } from './utils';
import { useWorkflowsWithSelect } from './Workflows';

type Props = {
  bucketName: string;
  applyToVersion: BucketWorkflowTransitionV2.ApplyToVersionEnum;
  objectKeyPrefix: string;
  objectTags: Tag[];
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
  const isWorkflowCreationPage = useRouteMatch(
    '/accounts/:accountName/workflows/create-workflow',
  );
  const { data: transitions, status } = useWorkflowsWithSelect(
    (workflows: APIWorkflows) => {
      return workflows
        .filter((wf) => wf.transition)
        .map((wf) => wf.transition)
        .filter(
          (ts: BucketWorkflowTransitionV2) =>
            ts.applyToVersion === applyToVersion &&
            ts.bucketName === bucketName,
        );
    },
  );

  const transitionList =
    (status === 'success' &&
      filterWorkflows(transitions, {
        objectKeyPrefix,
        objectTags,
      })) ||
    [];

  const isTransitionWithDate =
    status === 'success' &&
    transitionList.find(
      (ts: BucketWorkflowTransitionV2) => ts.triggerDelayDate,
    );

  // Manually add the workflow description
  const transitionWithDesciption =
    (status === 'success' &&
      transitionList.map((ts: BucketWorkflowTransitionV2) => {
        return {
          description: `All current objects older than ${
            ts.triggerDelayDays
          } day${
            typeof ts.triggerDelayDays === 'number' && ts.triggerDelayDays > 1
              ? 's '
              : ' '
          }
          will transition to ${ts.locationName}`,
          ...ts,
        };
      })) ||
    [];

  if (triggerDelayDays && locationName) {
    transitionWithDesciption.push({
      triggerDelayDays,
      locationName,
      description: `Objects older than ${triggerDelayDays} day${
        typeof triggerDelayDays === 'string' &&
        parseInt(triggerDelayDays, 10) > 1
          ? 's '
          : ' '
      } will transition to ${locationName} `,
    });
  }

  const transitionWithDate = `A Transition Workflow was set up based on a specific date. We can't guarantee you the Workflow will be consistent.`;
  const columns = [
    {
      Header: 'Days',
      accessor: 'triggerDelayDays',
      cellStyle: {
        paddingLeft: '1rem',
      },
      Cell: ({ value, row: { original: row } }) => {
        return row.triggerDelayDays === triggerDelayDays ? (
          <GentleEmphaseSecondaryText>{value}</GentleEmphaseSecondaryText>
        ) : (
          value
        );
      },
    },
    {
      Header: 'Storage Location',
      accessor: 'locationName',
      cellStyle: {
        minWidth: '12rem',
      },
      Cell: ({ value, row: { original: row } }) => {
        return row.triggerDelayDays === triggerDelayDays ? (
          <GentleEmphaseSecondaryText>{value}</GentleEmphaseSecondaryText>
        ) : (
          value
        );
      },
    },
    {
      Header: 'Description',
      accessor: 'description',
      cellStyle: {
        minWidth: isWorkflowCreationPage ? '36rem' : '28rem',
      },
      Cell: ({ value, row: { original: row } }) => {
        return row.triggerDelayDays === triggerDelayDays ? (
          <GentleEmphaseSecondaryText>{value}</GentleEmphaseSecondaryText>
        ) : (
          value
        );
      },
    },
  ];
  return (
    <>
      {isTransitionWithDate && (
        <Banner icon={<Icon name="Exclamation-triangle" />} variant="warning">
          {transitionWithDate}
        </Banner>
      )}
      {transitionWithDesciption.length ? (
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
      ) : (
        ''
      )}
    </>
  );
};
export default TransitionTable;
