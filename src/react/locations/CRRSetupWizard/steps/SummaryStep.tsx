import { Banner, Icon } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';

export const SummaryStep = () => (
  <Box padding="r24">
    <Banner variant="base" icon={<Icon name="Info-circle" />} title="Summary">
      Displays the resulting credentials once the setup completes. It lands in the next brick.
    </Banner>
  </Box>
);
