import {
  AppContainer,
  Icon,
  Stack,
  Text,
  Loader,
  EmptyState,
} from '@scality/core-ui';
import { useHistory } from 'react-router-dom';

import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import EndpointList from './EndpointList';

const Endpoints = () => {
  const history = useHistory();
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints, status } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter,
    });

  if (status === 'idle' || status === 'loading') {
    return (
      <Loader centered size="massive">
        <>Loading Data Services...</>
      </Loader>
    );
  }

  // empty state.
  if (accountsLocationsAndEndpoints?.endpoints.length === 0) {
    return (
      <EmptyState
        icon="Account"
        listedResource={{
          singular: 'Data Service',
          plural: 'Data Services',
        }}
        link="/create-dataservice"
        history={history}
      />
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
        <EndpointList
          endpoints={accountsLocationsAndEndpoints?.endpoints || []}
          locations={accountsLocationsAndEndpoints?.locations || []}
        />
      </AppContainer.MainContent>
    </>
  );
};

export default Endpoints;
