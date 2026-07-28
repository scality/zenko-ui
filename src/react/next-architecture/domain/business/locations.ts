import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useCurrentAccount } from '../../../DataServiceRoleProvider';
import { storageOptions } from '../../../locations/LocationDetails';
import { useBucketList } from '../../../queries/instanceStatusQuery';
import { useAuthGroups } from '../../../utils/hooks';
import type { ILocationsEndpointsAdapter } from '../../adapters/accounts-locations/ILocationsEndpointsBundledAdapter';
import type { IMetricsAdapter } from '../../adapters/metrics/IMetricsAdapter';
import type { Location, LocationStorageInfos, LocationsPromiseResult } from '../entities/location';
import type { LatestUsedCapacity } from '../entities/metrics';
import type { PromiseResult } from '../entities/promise';
import { useLocationsAndEndpoints } from './accounts';

export const useLocationAndStorageInfos = ({
  locationName,
  locationsEndpointsAdapter,
}: {
  locationName: string;
  locationsEndpointsAdapter: ILocationsEndpointsAdapter;
}): PromiseResult<LocationStorageInfos> => {
  const { locationsAndEndpoints, status } = useLocationsAndEndpoints({
    locationsEndpointsAdapter,
  });

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

  const location = locationsAndEndpoints?.locations?.find((l) => l.name === locationName);
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
  locationsEndpointsAdapter,
  metricsAdapter,
}: {
  locationsEndpointsAdapter: ILocationsEndpointsAdapter;
  metricsAdapter: IMetricsAdapter;
}): LocationsPromiseResult => {
  const { locationsAndEndpoints, status: locationStatus } = useLocationsAndEndpoints({
    locationsEndpointsAdapter,
  });

  const { isStorageManager } = useAuthGroups();

  const ids = locationsAndEndpoints?.locations?.map((l) => l.id) ?? [];
  const { data: metricsData, status: metricsStatus } = useQuery({
    queryKey: ['locationsMetrics', ids],
    queryFn: () => {
      return metricsAdapter.listLocationsLatestUsedCapacity(ids);
    },
    enabled: !!locationsAndEndpoints?.locations && ids.length > 0 && isStorageManager,
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

  locationsAndEndpoints?.locations.forEach((l) => {
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
  locationsEndpointsAdapter,
}: {
  metricsAdapter: IMetricsAdapter;
  locationsEndpointsAdapter: ILocationsEndpointsAdapter;
}): LocationsPromiseResult => {
  const { account } = useCurrentAccount();
  const allLocations = useListLocations({
    locationsEndpointsAdapter,
    metricsAdapter,
  });

  const accountCannonicalId = account?.CanonicalId || '';

  const { data: accountLocationData, status: accountLocationStatus } = useQuery({
    queryKey: ['accountLocations', accountCannonicalId],
    queryFn: () => metricsAdapter.listAccountLocationsLatestUsedCapacity(accountCannonicalId),
    enabled: !!accountCannonicalId,
  });

  const {
    bucketList,
    status: bucketListStatus,
    isFetching: bucketListIsFetching,
    error: bucketListError,
  } = useBucketList();

  const bucketLocationIds = useMemo(() => {
    return Array.from(
      new Set(
        bucketList
          .filter((bucket) => bucket.ownerCanonicalId === accountCannonicalId)
          .map((bucket) => bucket.location)
          .filter((location): location is string => !!location),
      ),
    );
  }, [bucketList, accountCannonicalId]);

  if (account === undefined) {
    return {
      locations: {
        status: 'error',
        title: 'Current Account Error',
        reason: `Unexpected error while fetching account`,
      },
    };
  }

  if (!accountCannonicalId) {
    return {
      locations: {
        status: 'success',
        value: {},
      },
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
    const locationDefinition = allLocationsValue.find((l) => l.id === locationId);

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
