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

function Details({ wfSelected, bucketList }: Props) {
  const query = useQueryParams();
  const locations = useSelector(
    (state: AppState) => state.configuration.latest?.locations ?? {},
  );
  const tabName = query.get('tab');
  if (!wfSelected) {
    return <InfoWarning title={SELECT_A_WORKFLOW_MESSAGE} />;
  }

  if (!tabName) {
    return (
      <ConfigurationTab
        bucketList={bucketList}
        locations={locations}
        wfSelected={wfSelected}
      />
    );
  }

  return null;
}

function WorkflowContent(props: Props) {
  const { pathname } = useLocation();
  return (
    <ContentSection>
      <CustomTabs>
        <CustomTabs.Tab label="Configuration" path={pathname}>
          <Details {...props} />
        </CustomTabs.Tab>
      </CustomTabs>
    </ContentSection>
  );
}

export default WorkflowContent;
