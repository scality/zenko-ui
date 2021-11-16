// @flow
import type {
  Endpoint,
  Location,
  LocationName,
  Locations as LocationsType,
  Replication,
} from '../../../types/config';
import type { BucketList } from '../../../types/stats';
import type { LocationForm } from '../../../types/location';
import { storageOptions } from './LocationDetails';
import type { BucketInfo } from '../../../types/s3';

function newLocationDetails(): Location {
  return {
    name: '',
    locationType: '',
    details: {},
    objectId: '',
    isTransient: false,
    isBuiltin: false,
    sizeLimitGB: 0,
  };
}

function newLocationForm(): LocationForm {
  return {
    name: '',
    locationType: '',
    details: {},
    objectId: '',
    options: {
      isTransient: false,
      isBuiltin: false,
      isSizeLimitChecked: false,
      sizeLimitGB: '',
    },
  };
}

function convertToLocation(locationState: LocationForm): Location {
  const { options } = locationState;
  const ret = {
    name: locationState.name,
    locationType: locationState.locationType,
    details: locationState.details,
    objectId: locationState.objectId,
    isTransient: options.isTransient,
    isBuiltin: options.isBuiltin,
    sizeLimitGB:
      options.isSizeLimitChecked && options.sizeLimitGB
        ? parseInt(options.sizeLimitGB, 10)
        : 0,
    legacyAwsBehavior: locationState.options.legacyAwsBehavior,
  };
  return ret;
}

function convertToForm(locationProps: Location): LocationForm {
  const ret = {
    name: locationProps.name,
    locationType: locationProps.locationType,
    details: locationProps.details,
    objectId: locationProps.objectId,
    options: {
      isTransient: locationProps.isTransient,
      isBuiltin: locationProps.isBuiltin,
      isSizeLimitChecked: !!locationProps.sizeLimitGB,
      sizeLimitGB: locationProps.sizeLimitGB
        ? `${locationProps.sizeLimitGB}`
        : '',
      legacyAwsBehavior: locationProps.legacyAwsBehavior,
    },
  };
  return ret;
}

function canEditLocation(
  locationName: LocationName,
  locations: LocationsType,
): boolean {
  const isBuiltin =
    locations[locationName] && locations[locationName].isBuiltin;
  return !isBuiltin;
}

// TODO: add specific tooltip message about why location can not be deleted
function canDeleteLocation(
  locationName: LocationName,
  locations: LocationsType,
  replicationStreams: Array<Replication>,
  buckets: BucketList,
  endpoints: Array<Endpoint>,
) {
  if (!locationName) {
    return false;
  }
  const isBuiltin =
    locations[locationName] && locations[locationName].isBuiltin;
  if (isBuiltin) {
    return false;
  }
  const checkStreamLocations = replicationStreams.every(r => {
    // legacy $FlowFixMe
    if (r.destination.location) {
      return r.destination.location !== locationName;
    }
    return r.destination.locations.every(destLocation => {
      return destLocation.name !== locationName;
    });
  });
  if (!checkStreamLocations) {
    return false;
  }
  const checkBucketLocations = buckets.every(
    bucket => bucket.location !== locationName,
  );
  if (!checkBucketLocations) {
    return false;
  }
  const checkEndpointLocations = endpoints.every(
    e => e.locationName !== locationName,
  );
  if (!checkEndpointLocations) {
    return false;
  }
  return true;
}

function isLocationExists(location: string): boolean {
  return Object.keys(storageOptions).some(opt => opt === location);
}

function convertToBucketInfo(bucketInfo: BucketInfo | null) {
  const objectLockEnabled =
    bucketInfo?.objectLockConfiguration.ObjectLockEnabled;

  const isDefaultRetentionEnabled = bucketInfo?.objectLockConfiguration.Rule
    ?.DefaultRetention
    ? true
    : false;
  const retentionMode =
    bucketInfo?.objectLockConfiguration.Rule?.DefaultRetention?.Mode ||
    'GOVERNANCE';
  const retentionPeriod = bucketInfo?.objectLockConfiguration.Rule
    ?.DefaultRetention?.Days
    ? bucketInfo.objectLockConfiguration.Rule.DefaultRetention.Days
    : bucketInfo?.objectLockConfiguration.Rule?.DefaultRetention?.Years || 1;
  const retentionPeriodFrequencyChoice = bucketInfo?.objectLockConfiguration
    .Rule?.DefaultRetention?.Years
    ? 'YEARS'
    : 'DAYS';

  return {
    objectLockEnabled,
    isDefaultRetentionEnabled,
    retentionMode,
    retentionPeriod,
    retentionPeriodFrequencyChoice,
  };
}

export {
  newLocationForm,
  convertToLocation,
  convertToForm,
  newLocationDetails,
  canEditLocation,
  canDeleteLocation,
  isLocationExists,
  convertToBucketInfo,
};
