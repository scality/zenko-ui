import { useMemo } from 'react';
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
import { getAccountLocationUsedCapacity, getLocationUsedCapacity, useStorageUsageReport } from './storageUsageReport';

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

  const { isStorageManager, isStorageUsageReporter } = useAuthGroups();

  const { data: report, status: reportStatus } = useStorageUsageReport({
    metricsAdapter,
    enabled: (locationsAndEndpoints?.locations.length ?? 0) > 0 && (isStorageManager || isStorageUsageReporter),
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
    if (report) {
      usedCapacity = { status: 'success', value: getLocationUsedCapacity(report, l.name) };
    } else if (reportStatus === 'error') {
      usedCapacity = {
        status: reportStatus,
        title: 'Location Metrics Error',
        reason: `Unexpected error while fetching location's metrics`,
      };
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

const ZERO_USED_CAPACITY: LatestUsedCapacity = {
  type: 'hasMetrics',
  usedCapacity: {
    current: 0,
    nonCurrent: 0,
  },
  measuredOn: new Date(0),
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

  // The reporting API has no per-account filter, so this tab reads the instance-wide report it shares with the
  // Accounts and Locations lists. With a cold cache, its first load is slower than a per-account call: accepted.
  const { data: report, status: reportStatus } = useStorageUsageReport({
    metricsAdapter,
    enabled: !!accountCannonicalId,
  });

  const { bucketList, status: bucketListStatus } = useBucketList();

  const bucketLocationNames = useMemo(() => {
    if (bucketListStatus === 'error') {
      return [];
    }
    return Array.from(
      new Set(
        bucketList
          .filter((bucket) => bucket.ownerCanonicalId === accountCannonicalId)
          .map((bucket) => bucket.location)
          .filter((location): location is string => !!location),
      ),
    );
  }, [bucketList, accountCannonicalId, bucketListStatus]);

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

  if (reportStatus === 'loading' || reportStatus === 'idle') {
    return {
      locations: {
        status: 'loading',
      },
    };
  }

  if (bucketListStatus === 'idle' || bucketListStatus === 'loading') {
    return {
      locations: {
        status: 'loading',
      },
    };
  }

  if (allLocations.locations.status !== 'success') {
    return allLocations;
  }

  const bucketLocationNameSet = new Set(bucketLocationNames);
  const allLocationsValue = Object.values(allLocations.locations.value);
  const locations: Record<string, Location> = {};

  // The report covers every account: when it fails, still list the locations this account has buckets on.
  allLocationsValue.forEach((locationDefinition) => {
    const accountLocationUsedCapacity =
      report && getAccountLocationUsedCapacity(report, account.Name, locationDefinition.name);
    const isBackedByBucket = bucketLocationNameSet.has(locationDefinition.name);

    if (!accountLocationUsedCapacity && !isBackedByBucket) {
      return;
    }

    locations[locationDefinition.id] = {
      ...locationDefinition,
      usedCapacity: report
        ? { status: 'success', value: accountLocationUsedCapacity ?? ZERO_USED_CAPACITY }
        : {
            status: 'error',
            title: 'Account Location Metrics Error',
            reason: `Unexpected error while fetching account location's metrics`,
          },
    };
  });

  return {
    locations: {
      status: 'success',
      value: locations,
    },
  };
};
