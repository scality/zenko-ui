import {
  type Endpoint,
  JAGUAR_S3_LOCATION_KEY,
  type Location as LegacyLocation,
  type LocationTypeKey,
  ORACLE_CLOUD_LOCATION_KEY,
  ORANGE_S3_LOCATION_KEY,
  OUTSCALE_PUBLIC_S3_LOCATION_KEY,
  OUTSCALE_SNC_S3_LOCATION_KEY,
} from '../../types/config';
import type { LocationForm } from '../../types/location';
import type { BucketList } from '../../types/stats';
import type { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import type { Location as NextLocation } from '../next-architecture/domain/entities/location';
import { getLocationType } from '../utils/storageOptions';
import { isColdLocationType } from './LocationDetails/coldLocations';
import { storageOptions } from './LocationDetails';

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
  const isColdLocation = isColdLocationType(locationState.locationType);
  const ret = {
    name: locationState.name,
    locationType: locationState.locationType,
    details: locationState.details,
    objectId: locationState.objectId,
    isTransient: options.isTransient,
    isBuiltin: options.isBuiltin,
    //@ts-expect-error fix this when you are working on it
    isCold: !!options.isCold || isColdLocation,
    sizeLimitGB: options.isSizeLimitChecked && options.sizeLimitGB ? parseInt(options.sizeLimitGB, 10) : 0,
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

/**
 * Check if a location can be deleted.
 */
function getLocationDeletionBlocker(
  location: NextLocation,
  buckets: BucketList,
  endpoints: Array<Endpoint>,
): Record<string, boolean> {
  const isBuiltin = location.isBuiltin;

  const hasBucket = !buckets.every((bucket) => bucket.location !== location.name);

  const hasEndpoint = !endpoints.every((e) => e.locationName !== location.name);

  return {
    isBuiltin,
    hasBucket,
    hasEndpoint,
  };
}

function isLocationExists(location: string): boolean {
  return Object.keys(storageOptions).some((opt) => opt === location);
}

//disable the Cold Location as a source storage location
function renderLocation(location: LegacyLocation | Omit<NextLocation, 'usedCapacity'> | LocationInfo) {
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
    locationType === OUTSCALE_SNC_S3_LOCATION_KEY ||
    locationType === ORACLE_CLOUD_LOCATION_KEY
  );
};

export {
  newLocationForm,
  convertToLocation,
  convertToForm,
  newLocationDetails,
  getLocationDeletionBlocker,
  isLocationExists,
  renderLocation,
};
