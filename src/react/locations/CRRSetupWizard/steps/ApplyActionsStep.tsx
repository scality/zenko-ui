import { Banner, Icon } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';

export const ApplyActionsStep = () => (
  <Box padding="r24">
    <Banner variant="base" icon={<Icon name="Info-circle" />} title="Apply Actions">
      This step runs the destination-side setup chain. It lands in the next brick.
    </Banner>
  </Box>
);
