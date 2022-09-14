import { ContentSection } from '../ui-elements/ListLayout3';
import type { AppState } from '../../types/state';
import ConfigurationTab from './ConfigurationTab';
import { CustomTabs } from '../ui-elements/Tabs';
import type { S3BucketList } from '../../types/s3';
import { Warning } from '../ui-elements/Warning';
import type { Workflow } from '../../types/workflow';
import { useLocation } from 'react-router-dom';
import { useQueryParams } from '../utils/hooks';
import { useSelector } from 'react-redux';
import { Icon } from '@scality/core-ui';
export const SELECT_A_WORKFLOW_MESSAGE = 'Select a workflow.';
type Props = {
  wfSelected: Workflow | null | undefined;
  bucketList: S3BucketList;
};
export const InfoWarning = ({ title }: { title: string }) => (
  <Warning icon={<Icon name="Info-circle" size="2x" />} title={title} />
);

function WorkflowContent({ wfSelected, bucketList }: Props) {
  const query = useQueryParams();
  const { pathname } = useLocation();
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const showEditWorkflowNotification = useSelector(
    (state: AppState) => state.uiWorkflows.showEditWorkflowNotification,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const tabName = query.get('tab');

  const Details = () => {
    if (!wfSelected) {
      return <InfoWarning title={SELECT_A_WORKFLOW_MESSAGE} />;
    }

    if (!tabName) {
      return (
        <ConfigurationTab
          showEditWorkflowNotification={showEditWorkflowNotification}
          bucketList={bucketList}
          locations={locations}
          wfSelected={wfSelected}
          loading={loading}
        />
      );
    }

    return null;
  };

  return (
    <ContentSection>
      <CustomTabs>
        <CustomTabs.Tab label="Configuration" path={pathname}>
          <Details />
        </CustomTabs.Tab>
      </CustomTabs>
    </ContentSection>
  );
}

export default WorkflowContent;
