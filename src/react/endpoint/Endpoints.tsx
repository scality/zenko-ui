import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { AppContainer, Icon, Stack, Text } from '@scality/core-ui';

import type { AppState } from '../../types/state';
import { EmptyStateContainer } from '../ui-elements/Container';
import EndpointList from './EndpointList';
import { Warning } from '../ui-elements/Warning';

const Endpoints = () => {
  const history = useHistory();
  const endpoints = useSelector(
    (state: AppState) => state.configuration.latest.endpoints,
  );
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );

  // empty state.
  if (endpoints.length === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          icon={<Icon name="Wallet" size="5x" />}
          title="Create your first Data Service."
          btnTitle="Create Data Service"
          btnAction={() => history.push('/create-dataservice')}
        />
      </EmptyStateContainer>
    );
  }

  return (
    <>
      <AppContainer.OverallSummary>
        <Stack gap="r16">
          <Icon name="Cubes" color="infoPrimary" size="2x" withWrapper />
          <Text variant="Larger">Data Services</Text>
        </Stack>
      </AppContainer.OverallSummary>
      <AppContainer.MainContent background="backgroundLevel3">
        <EndpointList endpoints={endpoints} locations={locations} />
      </AppContainer.MainContent>
    </>
  );
};

export default Endpoints;
