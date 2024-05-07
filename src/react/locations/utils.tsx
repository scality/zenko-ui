import {
  Endpoint,
  JAGUAR_S3_LOCATION_KEY,
  Location as LegacyLocation,
  LocationTypeKey,
  ORANGE_S3_LOCATION_KEY,
  OUTSCALE_PUBLIC_S3_LOCATION_KEY,
  OUTSCALE_SNC_S3_LOCATION_KEY,
  Replication,
} from '../../types/config';
import type { BucketList } from '../../types/stats';
import type { LocationForm } from '../../types/location';
import { storageOptions } from './LocationDetails';
import { getLocationType } from '../utils/storageOptions';

import type { BucketInfo } from '../../types/s3';
import { BucketWorkflowTransitionV2 } from '../../js/managementClient/api';
import { Location as NextLocation } from '../next-architecture/domain/entities/location';
import { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';

function newLocationDetails(): NextLocation {
  return {
    name: '',
    type: '' as LocationTypeKey,
    details: {},
    id: '',
    isTransient: false,
    isBuiltin: false,
    usedCapacity: {
      status: 'unknown',
    },
  };
}

function newLocationForm(): LocationForm {
  return {
    name: '',
    locationType: '' as LocationTypeKey,
    //@ts-expect-error initial value is empty object
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

function convertToLocation(locationState: LocationForm): LegacyLocation {
  const { options } = locationState;
  const ret = {
    name: locationState.name,
    locationType: locationState.locationType,
    details: locationState.details,
    objectId: locationState.objectId,
    isTransient: options.isTransient,
    isBuiltin: options.isBuiltin,
    //@ts-expect-error fix this when you are working on it
    isCold: !!options.isCold,
    sizeLimitGB:
      options.isSizeLimitChecked && options.sizeLimitGB
        ? parseInt(options.sizeLimitGB, 10)
        : 0,
    legacyAwsBehavior: locationState.options.legacyAwsBehavior,
  };
  //@ts-expect-error fix this when you are working on it
  return ret;
}

function convertToForm(locationProps: LocationInfo): LocationForm {
  const ret = {
    name: locationProps.name,
    locationType: locationProps.type,
    details: locationProps.details,
    objectId: locationProps.id,
    options: {
      isTransient: locationProps.isTransient,
      isBuiltin: locationProps.isBuiltin,
      isSizeLimitChecked: false,
      isCold: !!locationProps.isCold,
      sizeLimitGB: '',
      legacyAwsBehavior: false,
    },
  };
  //@ts-expect-error fix this when you are working on it
  return ret;
}

function getLocationDeletionBlocker(
  location: NextLocation,
  replicationStreams: Array<Replication>,
  transitions: Array<BucketWorkflowTransitionV2>,
  buckets: BucketList,
  endpoints: Array<Endpoint>,
): Record<string, boolean> {
  const isBuiltin = location.isBuiltin;

  const checkStreamLocations = replicationStreams.every((r) => {
    //@ts-expect-error fix this when you are working on it
    if (r.destination.location) {
      //@ts-expect-error fix this when you are working on it
      return r.destination.location !== location.name;
    }
    return r.destination.locations.every((destLocation) => {
      return destLocation.name !== location.name;
    });
  });
  const hasReplicationWorkflow = !checkStreamLocations;

  const hasTransitionWorkflow = !!transitions.find(
    (t: BucketWorkflowTransitionV2) => t.locationName === location.name,
  );

  const hasBucket = !buckets.every(
    (bucket) => bucket.location !== location.name,
  );

  const hasEndpoint = !endpoints.every((e) => e.locationName !== location.name);

  return {
    isBuiltin,
    hasWorkflow: hasTransitionWorkflow || hasReplicationWorkflow,
    hasBucket,
    hasEndpoint,
  };
}

function isLocationExists(location: string): boolean {
  return Object.keys(storageOptions).some((opt) => opt === location);
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

//disable the Cold Location as a source storage location
function renderLocation(
  location: LegacyLocation | Omit<NextLocation, 'usedCapacity'> | LocationInfo,
) {
  const locationTypeName = getLocationType(location);
  if (location.isCold) {
    return `${location.name} (${locationTypeName}) - Cold Location can't be used`;
  }
  return `${location.name} (${locationTypeName})`;
}

export const checkIsRingS3Reseller = (locationType: LocationTypeKey) => {
  return (
    locationType === JAGUAR_S3_LOCATION_KEY ||
    locationType === ORANGE_S3_LOCATION_KEY ||
    locationType === OUTSCALE_PUBLIC_S3_LOCATION_KEY ||
    locationType === OUTSCALE_SNC_S3_LOCATION_KEY
  );
};

export {
  newLocationForm,
  convertToLocation,
  convertToForm,
  newLocationDetails,
  getLocationDeletionBlocker,
  isLocationExists,
  convertToBucketInfo,
  renderLocation,
};
