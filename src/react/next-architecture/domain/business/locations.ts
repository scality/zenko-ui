import { useQuery } from 'react-query';
import { ILocationsAdapter } from '../../adapters/accounts-locations/ILocationsAdapter';
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
import { useAccountCannonicalId } from './accounts';
import { IAccountsAdapter } from '../../adapters/accounts-locations/IAccountsAdapter';

const noRefetchOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
};

export const queries = {
  listLocations: (locationsAdapter: ILocationsAdapter) => ({
    queryKey: ['locations'],
    queryFn: () => locationsAdapter.listLocations(),
    ...noRefetchOptions,
  }),
};

export const useLocationAndStorageInfos = ({
  locationName,
  locationsAdapter,
}: {
  locationName: string;
  locationsAdapter: ILocationsAdapter;
}): PromiseResult<LocationStorageInfos> => {
  const { data: locationData, status: locationStatus } = useQuery(
    queries.listLocations(locationsAdapter),
  );

  if (locationStatus === 'loading' || locationStatus === 'idle') {
    return {
      status: 'loading',
    };
  }

  if (locationStatus === 'error') {
    return {
      status: locationStatus,
      title: 'Location Error',
      reason: `Unexpected error while fetching location`,
    };
  }

  const location = locationData?.find((l) => l.name === locationName);
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
  locationsAdapter,
  metricsAdapter,
}: {
  locationsAdapter: ILocationsAdapter;
  metricsAdapter: IMetricsAdapter;
}): LocationsPromiseResult => {
  const { data: locationData, status: locationStatus } = useQuery(
    queries.listLocations(locationsAdapter),
  );

  const ids = locationData?.map((l) => l.id) ?? [];
  const { data: metricsData, status: metricsStatus } = useQuery({
    queryKey: ['locationsMetrics', ids],
    queryFn: () => {
      return metricsAdapter.listLocationsLatestUsedCapacity(ids);
    },
    enabled: !!locationData && ids.length > 0,
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

  locationData.forEach((l) => {
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
  locationsAdapter,
  metricsAdapter,
  accountsAdapter,
}: {
  locationsAdapter: ILocationsAdapter;
  metricsAdapter: IMetricsAdapter;
  accountsAdapter: IAccountsAdapter;
}): LocationsPromiseResult => {
  const { account } = useCurrentAccount();
  const allLocations = useListLocations({
    locationsAdapter,
    metricsAdapter,
  });

  const accountCannonicalIdResult = useAccountCannonicalId({
    accountId: account?.id || '',
    accountsAdapter,
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
    const accountLocation = allLocationsValue.find((l) => l.id === locationId);
    if (accountLocation) {
      locations[locationId] = accountLocation;
    }
  });

  return {
    locations: {
      status: 'success',
      value: locations,
    },
  };
};
