import { AppContainer, Icon, Stack, Text } from '@scality/core-ui';
import { ReplicationControlProvider } from './contexts/ReplicationControlContext';
import { LocationsList } from './LocationsList';

export const Locations = () => {
  return (
    <ReplicationControlProvider>
      <AppContainer.OverallSummary>
        <Stack gap="r16">
          <Icon name="Location" color="infoPrimary" size="2x" withWrapper />
          <Text variant="Larger">Locations</Text>
        </Stack>
      </AppContainer.OverallSummary>
      <AppContainer.MainContent background="backgroundLevel3">
        <LocationsList />
      </AppContainer.MainContent>
    </ReplicationControlProvider>
  );
};
