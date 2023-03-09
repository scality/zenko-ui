import { $PropertyType } from 'utility-types';
import { HelpAsyncNotifPending } from '../../ui-elements/Help';
import {
  Endpoint,
  JAGUAR_S3_LOCATION_KEY,
  Location,
  LocationName,
  Locations as LocationsType,
  LocationTypeKey,
  ORANGE_S3_LOCATION_KEY,
  OUTSCALE_PUBLIC_S3_LOCATION_KEY,
  OUTSCALE_SNC_S3_LOCATION_KEY,
  Replication,
} from '../../../types/config';
import type {
  BucketList,
  WorkflowScheduleUnitState,
  InstanceStateSnapshot,
} from '../../../types/stats';
import type { LocationForm } from '../../../types/location';
import { storageOptions } from './LocationDetails';
import { getLocationType, isIngestLocation } from '../../utils/storageOptions';
import {
  pauseIngestionSite,
  pauseReplicationSite,
  resumeIngestionSite,
  resumeReplicationSite,
} from '../../actions/zenko';
import { InlineButton } from '../../ui-elements/Table';
import type { BucketInfo } from '../../../types/s3';
import styled from 'styled-components';
import { Icon, spacing } from '@scality/core-ui';
import { BucketWorkflowTransitionV2 } from '../../../js/managementClient/api';
import { Box } from '@scality/core-ui/dist/next';
type RowProps = {
  original: Location;
};

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
    isCold: !!options.isCold,
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
      isCold: !!locationProps.isCold,
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
  transitions: Array<BucketWorkflowTransitionV2>,
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

  const checkStreamLocations = replicationStreams.every((r) => {
    if (r.destination.location) {
      return r.destination.location !== locationName;
    }

    return r.destination.locations.every((destLocation) => {
      return destLocation.name !== locationName;
    });
  });

  const isTransitionCreatedOnLocation = !!transitions.find(
    (t: BucketWorkflowTransitionV2) => t.locationName === locationName,
  );

  if (isTransitionCreatedOnLocation) {
    return false;
  }

  if (!checkStreamLocations) {
    return false;
  }

  const checkBucketLocations = buckets.every(
    (bucket) => bucket.location !== locationName,
  );

  if (!checkBucketLocations) {
    return false;
  }

  const checkEndpointLocations = endpoints.every(
    (e) => e.locationName !== locationName,
  );

  if (!checkEndpointLocations) {
    return false;
  }

  return true;
}

function isLocationExists(location: string): boolean {
  return Object.keys(storageOptions).some((opt) => opt === location);
}

const Flex = styled.div`
  display: flex;
  align-items: center;
`;

const WorkflowCell =
  (
    ingestionStates: WorkflowScheduleUnitState | null | undefined,
    replicationStates: WorkflowScheduleUnitState | null | undefined,
    loading: boolean,
    dispatch: any,
  ) =>
  ({ row: { original } }: { row: RowProps }) => {
    const locationName = original.name;
    const ingestion =
      ingestionStates &&
      ingestionStates[locationName] &&
      ingestionStates[locationName];

    const replication =
      replicationStates && replicationStates[locationName]
        ? replicationStates[locationName]
        : null;

    if (replication || ingestion) {
      if (replication === 'enabled' || ingestion === 'enabled') {
        return (
          <Flex>
            <InlineButton
              disabled={loading}
              icon={<Icon name="Pause-circle" />}
              tooltip={{
                overlay: (
                  <Box>
                    {replication === 'enabled' &&
                      'Replication workflow is active.'}
                    {ingestion === 'enabled' &&
                      'Async Metadata updates is active.'}
                  </Box>
                ),
                placement: 'top',
              }}
              label="Pause"
              onClick={() => {
                if (replication === 'enabled') {
                  dispatch(pauseReplicationSite(locationName));
                }
                if (ingestion === 'enabled') {
                  dispatch(pauseIngestionSite(locationName));
                }
              }}
              variant="secondary"
            />
          </Flex>
        );
      }

      if (replication === 'disabled' || ingestion === 'disabled') {
        return (
          <Flex>
            <InlineButton
              disabled={loading}
              icon={<Icon name="Play-circle" />}
              tooltip={{
                overlay: (
                  <Box>
                    {replication === 'disabled' &&
                      'Replication workflow is paused.'}
                    {ingestion === 'disabled' &&
                      'Async Metadata updates is paused.'}
                  </Box>
                ),
                placement: 'top',
              }}
              label="Resume"
              onClick={() => {
                if (replication === 'disabled') {
                  dispatch(resumeReplicationSite(locationName));
                }
                if (ingestion === 'disabled') {
                  dispatch(resumeIngestionSite(locationName));
                }
              }}
              variant="secondary"
            />
          </Flex>
        );
      }
    }

    return '-';
  };

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
function renderLocation(location: Location) {
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
  canEditLocation,
  canDeleteLocation,
  isLocationExists,
  WorkflowCell as IngestionCell,
  convertToBucketInfo,
  renderLocation,
};
