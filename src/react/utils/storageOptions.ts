import { Capabilities, InstanceStateSnapshot } from '../../types/stats';
import {
  LabelFunction,
  StorageOptionSelect,
} from '../../types/storageOptionsHelper';
import { storageOptions } from '../locations/LocationDetails';
import {
  JAGUAR_S3_ENDPOINT,
  JAGUAR_S3_LOCATION_KEY,
  Location as LegacyLocation,
  ORACLE_CLOUD_LOCATION_KEY,
  ORANGE_S3_ENDPOINT,
  ORANGE_S3_LOCATION_KEY,
  OUTSCALE_PUBLIC_S3_ENDPOINT,
  OUTSCALE_PUBLIC_S3_LOCATION_KEY,
  OUTSCALE_SNC_S3_ENDPOINT,
  OUTSCALE_SNC_S3_LOCATION_KEY,
} from '../../types/config';
import { LocationForm } from '../../types/location';
import { Location } from '../next-architecture/domain/entities/location';
import { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { LocationV1 } from '../../js/managementClient/api';

export function checkSupportsReplicationTarget(
  locations: LocationInfo[],
): boolean {
  return locations.some(
    (l) => storageOptions[l.type]?.supportsReplicationTarget === true,
  );
}
export function checkIfExternalLocation(locations: LocationInfo[]): boolean {
  return locations.some((l) => l.type !== LocationV1.LocationTypeEnum.FileV1);
}

/**
 * Retrieve the `LocationTypeKey` so that it can be use to to get the right
 * storage option.
 * The `JAGUAR_S3_LOCATION_KEY`,`ORANGE_S3_LOCATION_KEY` and `ORACLE_CLOUD_LOCATION_KEY`
 * work like `location-scality-ring-s3-v1` in the UI with predefine values but are not
 * implemented in the backend.
 *
 * We need to add extra logic because changing the backend is expensive.
 * This can be greatly simplify later if the backend implement Jaguar & Orange.
 *
 * @param location
 * @returns a string which represent a locationType
 */
export const getLocationTypeKey = (
  location:
    | LocationInfo
    | LocationForm
    | LegacyLocation
    | Omit<Location, 'usedCapacity'>,
) => {
  if (location) {
    if (
      ('locationType' in location &&
        location.locationType === 'location-scality-ring-s3-v1') ||
      ('type' in location && location.type === 'location-scality-ring-s3-v1')
    ) {
      if (location.details.endpoint === JAGUAR_S3_ENDPOINT) {
        return JAGUAR_S3_LOCATION_KEY;
      } else if (location.details.endpoint === ORANGE_S3_ENDPOINT) {
        return ORANGE_S3_LOCATION_KEY;
      } else if (location.details.endpoint === OUTSCALE_PUBLIC_S3_ENDPOINT) {
        return OUTSCALE_PUBLIC_S3_LOCATION_KEY;
      } else if (location.details.endpoint === OUTSCALE_SNC_S3_ENDPOINT) {
        return OUTSCALE_SNC_S3_LOCATION_KEY;
      } else if (location.details.endpoint.endsWith('oraclecloud.com')) {
        return ORACLE_CLOUD_LOCATION_KEY;
      } else {
        return 'locationType' in location
          ? location.locationType
          : location.type;
      }
    } else {
      return 'locationType' in location ? location.locationType : location.type;
    }
  } else {
    return '';
  }
};

const selectStorageLocationFromLocationType = (
  location: LegacyLocation | Omit<Location, 'usedCapacity'> | LocationInfo,
) => {
  const locationTypeKey = getLocationTypeKey(location);
  if (locationTypeKey !== '') {
    return storageOptions[locationTypeKey];
  } else {
    return null;
  }
};

export const getLocationType = (
  location: LegacyLocation | Omit<Location, 'usedCapacity'> | LocationInfo,
) => {
  const storageLocation = selectStorageLocationFromLocationType(location);
  return storageLocation?.name ?? '';
};

export const getLocationTypeShort = (
  location: LegacyLocation | Location | LocationInfo,
) => {
  const storageLocation = selectStorageLocationFromLocationType(location);
  return storageLocation?.short ?? '';
};

export function selectStorageOptions(
  capabilities: Capabilities,
  locations?: LocationInfo[],
  labelFn?: LabelFunction,
  exceptHidden = true,
): Array<StorageOptionSelect> {
  const hdLocation = locations?.find(
    (l) => l.type === LocationV1.LocationTypeEnum.ScalityHdclientV2,
  );
  return Object.keys(storageOptions)
    .filter((o) => {
      if (hdLocation && o === 'location-scality-hdclient-v2') {
        return false;
      }
      if (exceptHidden) {
        const hidden = !!storageOptions[o].hidden;

        if (hidden) {
          return false;
        }
      }

      return true;
    })
    .map((o) => {
      const check = storageOptions[o].checkCapability;
      return {
        value: o,
        label: labelFn ? labelFn(o) : o,
        disabled: !!check && !!capabilities && !capabilities[check],
      };
    });
}
export function isIngestLocation(location, capabilities) {
  const locationType = location.locationType || location.type;

  if (isIngestSource(storageOptions, locationType, capabilities)) {
    if (
      locationType === 'location-nfs-mount-v1' ||
      (location.details && location.details.bucketMatch)
    ) {
      return true;
    }
  }

  return false;
}
export function isIngestSource(
  storageOptions: Record<string, any>,
  locationType: string,
  capabilities: Pick<InstanceStateSnapshot, 'capabilities'>,
): boolean {
  return (
    !!storageOptions[locationType].ingestCapability &&
    !!capabilities[storageOptions[locationType].ingestCapability]
  );
}
export function getLocationIngestionState(ingestionStates, locationName) {
  if (ingestionStates) {
    if (ingestionStates?.[locationName] === 'enabled') {
      return {
        value: 'Active',
        isIngestion: true,
      };
    }

    if (ingestionStates?.[locationName] === 'disabled') {
      return {
        value: 'Paused',
        isIngestion: true,
      };
    }
  }

  return {
    value: '-',
    isIngestion: false,
  };
}
