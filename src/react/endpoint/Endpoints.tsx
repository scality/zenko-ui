import { AppContainer, EmptyState, Icon, Loader, Stack, Text } from '@scality/core-ui';

import { useLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import EndpointList from './EndpointList';

const Endpoints = () => {
  const locationsEndpointsAdapter = useLocationsEndpointsAdapter();
  const { locationsAndEndpoints, status } = useLocationsAndEndpoints({
    locationsEndpointsAdapter,
  });

  const { basePath } = useConfig();

  if (status === 'idle' || status === 'loading') {
    return (
      <Loader centered size="massive">
        <>Loading Data Services...</>
      </Loader>
    );
  }

  // empty state.
  if (locationsAndEndpoints?.endpoints.length === 0) {
    return (
      <EmptyState
        icon="Account"
        listedResource={{
          singular: 'Data Service',
          plural: 'Data Services',
        }}
        link={`${basePath}/create-dataservice`}
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
          endpoints={locationsAndEndpoints?.endpoints || []}
          locations={locationsAndEndpoints?.locations || []}
        />
      </AppContainer.MainContent>
    </>
  );
};

export default Endpoints;
