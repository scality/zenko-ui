import type { AppState } from '../../types/state';
import ConfigurationTab from './ConfigurationTab';
import { CustomTabs } from '../ui-elements/Tabs';
import { Warning } from '../ui-elements/Warning';
import type { Workflow } from '../../types/workflow';
import { useRouteMatch } from 'react-router-dom';
import { useQueryParams } from '../utils/hooks';
import { useSelector } from 'react-redux';
import { Icon } from '@scality/core-ui';
export const SELECT_A_WORKFLOW_MESSAGE = 'Select a workflow.';
type Props = {
  wfSelected: Workflow | null | undefined;
};
export const InfoWarning = ({ title }: { title: string }) => (
  <Warning icon={<Icon name="Info-circle" size="2x" />} title={title} />
);

function Details({ wfSelected }: Props) {
  const query = useQueryParams();
  const locations = useSelector(
    (state: AppState) => state.configuration.latest?.locations ?? {},
  );
  const tabName = query.get('tab');
  if (!wfSelected) {
    return <InfoWarning title={SELECT_A_WORKFLOW_MESSAGE} />;
  }

  if (!tabName) {
    return <ConfigurationTab locations={locations} wfSelected={wfSelected} />;
  }

  return null;
}

function WorkflowContent(props: Props) {
  const { path } = useRouteMatch();
  return (
    <CustomTabs>
      <CustomTabs.Tab label="Configuration" path={path}>
        <Details {...props} />
      </CustomTabs.Tab>
    </CustomTabs>
  );
}

export default WorkflowContent;
