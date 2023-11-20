import { useQuery } from 'react-query';
import { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import {
  Location,
  LocationStorageInfos,
  LocationsPromiseResult,
} from '../entities/location';
import { PromiseResult } from '../entities/promise';
import { LatestUsedCapacity } from '../entities/metrics';
import { useCurrentAccount } from '../../../DataServiceRoleProvider';
import { storageOptions } from '../../../locations/LocationDetails';
import {
  useAccountCannonicalId,
  useAccountsLocationsAndEndpoints,
} from './accounts';
import { useAuthGroups } from '../../../utils/hooks';
import { IAccountsLocationsEndpointsAdapter } from '../../adapters/accounts-locations/IAccountsLocationsEndpointsBundledAdapter';

export const useLocationAndStorageInfos = ({
  locationName,
  accountsLocationsEndpointsAdapter,
}: {
  locationName: string;
  accountsLocationsEndpointsAdapter: IAccountsLocationsEndpointsAdapter;
}): PromiseResult<LocationStorageInfos> => {
  const { accountsLocationsAndEndpoints, status } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });

  if (status === 'loading' || status === 'idle') {
    return {
      status: 'loading',
    };
  }

  if (status === 'error') {
    return {
      status: status,
      title: 'Location Error',
      reason: `Unexpected error while fetching location`,
    };
  }

  const location = accountsLocationsAndEndpoints?.locations?.find(
    (l) => l.name === locationName,
  );
  const locationStorageOption = location
    ? storageOptions[location.type as unknown as keyof typeof storageOptions]
    : undefined;
  if (!location || !locationStorageOption) {
    return {
      status: 'success',
      value: {
        location,
        storageOption: locationStorageOption,
        nameAndShortType: locationName,
      },
    };
  }
  return {
    status: 'success',
    value: {
      location,
      storageOption: locationStorageOption,
      nameAndShortType: `${location.name} / ${locationStorageOption.short}`,
    },
  };
};

/**
 * The hook returns all the locations and it's metrics
 * @param metricsAdapter
 */
export const useListLocations = ({
  accountsLocationsEndpointsAdapter,
  metricsAdapter,
}: {
  accountsLocationsEndpointsAdapter: IAccountsLocationsEndpointsAdapter;
  metricsAdapter: IMetricsAdapter;
}): LocationsPromiseResult => {
  const { accountsLocationsAndEndpoints, status: locationStatus } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });

  const { isStorageManager } = useAuthGroups();

  const ids = accountsLocationsAndEndpoints?.locations?.map((l) => l.id) ?? [];
  const { data: metricsData, status: metricsStatus } = useQuery({
    queryKey: ['locationsMetrics', ids],
    queryFn: () => {
      return metricsAdapter.listLocationsLatestUsedCapacity(ids);
    },
    enabled:
      !!accountsLocationsAndEndpoints?.locations &&
      ids.length > 0 &&
      isStorageManager,
  });

  if (locationStatus === 'loading' || locationStatus === 'idle') {
    return {
      locations: {
        status: 'loading',
      },
    };
  }

  if (locationStatus === 'error') {
    return {
      locations: {
        status: locationStatus,
        title: 'Location Error',
        reason: `Unexpected error while fetching location`,
      },
    };
  }

  const locations: Record<string, Location> = {};

  accountsLocationsAndEndpoints?.locations.forEach((l) => {
    let usedCapacity: PromiseResult<LatestUsedCapacity> = {
      status: 'loading',
    };
    if (metricsStatus === 'loading') {
      usedCapacity = { status: metricsStatus };
    }

    if (metricsStatus === 'error') {
      usedCapacity = {
        status: metricsStatus,
        title: 'Location Metrics Error',
        reason: `Unexpected error while fetching location's metrics`,
      };
    }
    if (metricsStatus === 'success') {
      usedCapacity = { status: metricsStatus, value: metricsData?.[l.id] };
    }

    locations[l.name] = {
      ...l,
      type: l.type as unknown as Location['type'],
      usedCapacity: usedCapacity,
    };
  });
  return {
    locations: {
      status: 'success',
      value: locations,
    },
  };
};

export const useListLocationsForCurrentAccount = ({
  metricsAdapter,
  accountsLocationsEndpointsAdapter,
}: {
  metricsAdapter: IMetricsAdapter;
  accountsLocationsEndpointsAdapter: IAccountsLocationsEndpointsAdapter;
}): LocationsPromiseResult => {
  const { account } = useCurrentAccount();
  const allLocations = useListLocations({
    accountsLocationsEndpointsAdapter,
    metricsAdapter,
  });

  const accountCannonicalIdResult = useAccountCannonicalId({
    accountId: account?.id || '',
    accountsLocationsEndpointsAdapter,
  });

  const accountCannonicalId =
    account === undefined || accountCannonicalIdResult.status !== 'success'
      ? ''
      : accountCannonicalIdResult.value;

  const { data: accountLocationData, status: accountLocationStatus } = useQuery(
    {
      queryKey: ['accountLocations', accountCannonicalId],
      queryFn: () =>
        metricsAdapter.listAccountLocationsLatestUsedCapacity(
          accountCannonicalId,
        ),
      enabled: !!accountCannonicalId,
    },
  );

  if (account === undefined) {
    return {
      locations: {
        status: 'error',
        title: 'Current Account Error',
        reason: `Unexpected error while fetching account`,
      },
    };
  }

  if (accountCannonicalIdResult.status === 'error') {
    return {
      locations: accountCannonicalIdResult,
    };
  }

  if (accountLocationStatus === 'loading' || accountLocationStatus === 'idle') {
    return {
      locations: {
        status: 'loading',
      },
    };
  }

  if (accountLocationStatus === 'error') {
    return {
      locations: {
        status: 'error',
        title: 'Account Location Metrics Error',
        reason: `Unexpected error while fetching account location's metrics`,
      },
    };
  }

  const accountLocationsKey = Object.keys(accountLocationData);
  // The account has 0 locations
  if (accountLocationsKey.length === 0) {
    return {
      locations: {
        status: 'success',
        value: {},
      },
    };
  }

  if (allLocations.locations.status !== 'success') {
    return allLocations;
  }

  const allLocationsValue = Object.values(allLocations.locations.value);
  const locations: Record<string, Location> = {};
  accountLocationsKey.forEach((locationId) => {
    const locationDefinition = allLocationsValue.find(
      (l) => l.id === locationId,
    );

    if (locationDefinition) {
      locations[locationId] = {
        ...locationDefinition,
        usedCapacity: {
          status: 'success',
          value: accountLocationData[locationId],
        },
      };
    }
  });

  return {
    locations: {
      status: 'success',
      value: locations,
    },
  };
};
