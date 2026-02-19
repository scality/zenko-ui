import { LocationV1 } from '../../js/managementClient/api';
import {
  JAGUAR_S3_ENDPOINT,
  JAGUAR_S3_LOCATION_KEY,
  type Location as LegacyLocation,
  ORACLE_CLOUD_LOCATION_KEY,
  ORANGE_S3_ENDPOINT,
  ORANGE_S3_LOCATION_KEY,
  OUTSCALE_PUBLIC_S3_ENDPOINT,
  OUTSCALE_PUBLIC_S3_LOCATION_KEY,
  OUTSCALE_SNC_S3_ENDPOINT,
  OUTSCALE_SNC_S3_LOCATION_KEY,
} from '../../types/config';
import type { LocationForm } from '../../types/location';
import type { Capabilities, InstanceStateSnapshot } from '../../types/stats';
import type { LabelFunction, StorageOptionSelect } from '../../types/storageOptionsHelper';
import { storageOptions } from '../locations/LocationDetails';
import type { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import type { Location } from '../next-architecture/domain/entities/location';

export function isAzureOrGcpLocation(location: LocationInfo): boolean {
  // LocationTypeEnum is typed as an enum but its values are plain strings at runtime.
  // The double cast is needed because TS doesn't allow direct enum-to-string comparison.
  const type = location.type as unknown as string;
  return type === 'location-azure-v1' || type === 'location-gcp-v1';
}

export function checkSupportsReplicationTarget(locations: LocationInfo[]): boolean {
  return locations.some((l) => storageOptions[l.type]?.supportsReplicationTarget === true);
}

export function isReplicationTarget(location: LocationInfo): boolean {
  return storageOptions[location.type]?.supportsReplicationTarget === true;
}

export function isHdclientV2(location: LocationInfo): boolean {
  return (location.type as unknown as string) === 'location-scality-hdclient-v2';
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
  location: LocationInfo | LocationForm | LegacyLocation | Omit<Location, 'usedCapacity'>,
) => {
  if (location) {
    if (
      ('locationType' in location && location.locationType === 'location-scality-ring-s3-v1') ||
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
      } else if (location.details.endpoint?.endsWith('oraclecloud.com')) {
        return ORACLE_CLOUD_LOCATION_KEY;
      } else {
        return 'locationType' in location ? location.locationType : location.type;
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

export const getLocationType = (location: LegacyLocation | Omit<Location, 'usedCapacity'> | LocationInfo) => {
  const storageLocation = selectStorageLocationFromLocationType(location);
  return storageLocation?.name ?? '';
};

export const getLocationTypeShort = (location: LegacyLocation | Location | LocationInfo) => {
  const storageLocation = selectStorageLocationFromLocationType(location);
  return storageLocation?.short ?? '';
};

export type GroupedStorageOption = {
  label: string;
  options: Array<StorageOptionSelect>;
};

const categoryLabels = {
  crr: 'CRR Location',
  scality: 'Scality S3 Locations',
  'public-cloud': 'Public Cloud Locations',
  'on-prem': 'On Prem Locations',
};

export function selectStorageOptions(
  capabilities: Capabilities,
  locations?: LocationInfo[],
  labelFn?: LabelFunction,
  exceptHidden = true,
): Array<StorageOptionSelect> {
  const hdLocation = locations?.find((l) => l.type === LocationV1.LocationTypeEnum.ScalityHdclientV2);
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
        category: storageOptions[o].category,
      };
    });
}

export function selectStorageOptionsGrouped(
  capabilities: Capabilities,
  locations?: LocationInfo[],
  labelFn?: LabelFunction,
  exceptHidden = true,
): Array<GroupedStorageOption> {
  const options = selectStorageOptions(capabilities, locations, labelFn, exceptHidden);

  const groupedOptions: Array<GroupedStorageOption> = [];
  const categoryOrder: Array<'crr' | 'scality' | 'public-cloud' | 'on-prem'> = [
    'crr',
    'scality',
    'public-cloud',
    'on-prem',
  ];

  categoryOrder.forEach((category) => {
    const categoryOptions = options.filter((opt) => opt.category === category);
    if (categoryOptions.length > 0) {
      groupedOptions.push({
        label: categoryLabels[category],
        options: categoryOptions,
      });
    }
  });

  return groupedOptions;
}
export function isIngestLocation(location, capabilities) {
  const locationType = location.locationType || location.type;

  if (isIngestSource(storageOptions, locationType, capabilities)) {
    if (locationType === 'location-nfs-mount-v1' || location.details?.bucketMatch) {
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
    !!storageOptions[locationType].ingestCapability && !!capabilities[storageOptions[locationType].ingestCapability]
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
