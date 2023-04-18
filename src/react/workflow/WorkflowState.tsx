import { Icon, IconHelp } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import { useSelector } from 'react-redux';
import { AppState } from '../../types/state';

export function WorkflowState({ locationName }: { locationName: string }) {
  const instanceMetrics = useSelector(
    (state: AppState) => state.instanceStatus.latest.metrics,
  );

  const ingestionState =
    instanceMetrics?.['ingest-schedule']?.states?.[locationName];

  const replicationState =
    instanceMetrics?.['crr-schedule']?.states[locationName];

  if (ingestionState === 'disabled' || replicationState === 'disabled') {
    return (
      <Box>
        <Icon name="Pause-circle" color="statusWarning" /> Paused location{' '}
        <IconHelp
          placement="top"
          overlayStyle={{ width: '24rem' }}
          tooltipMessage={
            <>
              A "Paused Location" is a location where any Workflow processes
              targeting this location, such as updating metadata or replicating
              objects, have been temporarily stopped. <br /> <br />
              New objects added are queued and will be processed by workflows
              when the workflow status is resumed.
            </>
          }
        />
      </Box>
    );
  }

  return <></>;
}
