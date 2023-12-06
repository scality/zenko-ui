import { Icon } from '@scality/core-ui';
import { useRouteMatch } from 'react-router-dom';
import type { Workflow } from '../../types/workflow';
import { CustomTabs } from '../ui-elements/Tabs';
import { Warning } from '../ui-elements/Warning';
import { useQueryParams } from '../utils/hooks';
import ConfigurationTab from './ConfigurationTab';
export const SELECT_A_WORKFLOW_MESSAGE = 'Select a workflow.';
type Props = {
  wfSelected: Workflow | null | undefined;
};
export const InfoWarning = ({ title }: { title: string }) => (
  <Warning icon={<Icon name="Info-circle" size="2x" />} title={title} />
);

function Details({ wfSelected }: Props) {
  const query = useQueryParams();
  const tabName = query.get('tab');
  if (!wfSelected) {
    return <InfoWarning title={SELECT_A_WORKFLOW_MESSAGE} />;
  }

  if (!tabName) {
    return <ConfigurationTab wfSelected={wfSelected} />;
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
