import { AppContainer, Icon, Stack, Text } from '@scality/core-ui';
import { useHistory } from 'react-router-dom';

import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { EmptyStateContainer } from '../ui-elements/Container';
import Loader from '../ui-elements/Loader';
import { Warning } from '../ui-elements/Warning';
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
      <EmptyStateContainer>
        {/* @ts-expect-error fix this when you are working on it */}
        <Loader>Loading Data Services...</Loader>
      </EmptyStateContainer>
    );
  }

  // empty state.
  if (accountsLocationsAndEndpoints?.endpoints.length === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          //@ts-expect-error fix this when you are working on it
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
        <EndpointList
          endpoints={accountsLocationsAndEndpoints?.endpoints || []}
          locations={accountsLocationsAndEndpoints?.locations || []}
        />
      </AppContainer.MainContent>
    </>
  );
};

export default Endpoints;
