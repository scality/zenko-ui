import { Icon, Loader, spacing } from '@scality/core-ui';
import { EmptyCell } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useLocationReplicationControl } from './hooks/useLocationReplicationControl';

export const PauseAndResume = ({ locationName }: { locationName: string }) => {
  const { replicationStatus, ingestionStatus, isLoading, isUpdating, pause, resume } =
    useLocationReplicationControl(locationName);

  if (isLoading) {
    return (
      <Box display="flex">
        <Loader
          //@ts-expect-error fix this when you are working on it
          style={{ paddingRight: spacing.r8 }}
        />
        Loading
      </Box>
    );
  }

  const tooltip = (
    <Box>
      {replicationStatus === 'enabled' && 'Replication is active.'}
      {ingestionStatus === 'enabled' && 'Async Metadata updates is active.'}
      {replicationStatus === 'disabled' && 'Replication is paused.'}
      {ingestionStatus === 'disabled' && 'Async Metadata updates is paused.'}
    </Box>
  );

  if (replicationStatus === 'enabled' || ingestionStatus === 'enabled') {
    return (
      <Box display="flex">
        <Button
          size="inline"
          disabled={isUpdating}
          icon={isUpdating ? <Loader /> : <Icon name="Pause-circle" />}
          tooltip={{
            overlay: tooltip,
            placement: 'top',
          }}
          label="Pause"
          onClick={pause}
          variant="secondary"
          type="button"
        />
      </Box>
    );
  }

  if (replicationStatus === 'disabled' || ingestionStatus === 'disabled') {
    return (
      <Box display="flex">
        <Button
          size="inline"
          disabled={isUpdating}
          icon={isUpdating ? <Loader /> : <Icon name="Play-circle" />}
          tooltip={{
            overlay: tooltip,
            placement: 'top',
          }}
          type="button"
          label="Resume"
          onClick={resume}
          variant="secondary"
        />
      </Box>
    );
  }

  return <EmptyCell />;
};
