import type {
  Expiration,
  Locations,
  Replication as ReplicationStream,
  ReplicationStreams,
} from '../../types/config';
import type {
  ReplicationBucketOption,
  ReplicationForm,
} from '../../types/replication';
import type { S3BucketList } from '../../types/s3';
import type { SelectOption } from '../../types/ui';
import { getLocationTypeShort } from '../utils/storageOptions';
import { isVersioning } from '../utils';
import { storageOptions } from '../backend/location/LocationDetails';
export const sourceBucketOptions = (
  streams: ReplicationStreams,
  bucketList: S3BucketList,
  locations: Locations,
): Array<ReplicationBucketOption> => {
  const bucketsUsedForReplication = streams.map(
    (stream) => stream.source.bucketName,
  );
  const buckets = bucketList.map((b) => {
    const constraint = b.LocationConstraint || 'us-east-1'; // defaults to empty

    const locationType = locations[constraint].locationType;
    const { supportsReplicationSource } = storageOptions[locationType];
    return {
      label: b.Name,
      value: b.Name,
      location: constraint,
      disabled:
        !isVersioning(b.VersionStatus) ||
        bucketsUsedForReplication.indexOf(b.Name) > -1 ||
        !supportsReplicationSource,
    };
  });
  return buckets.toArray();
};
export const destinationOptions = (
  locations: Locations,
): Array<SelectOption> => {
  return Object.keys(locations)
    .filter((n) => {
      const locationType = locations[n].locationType;
      return storageOptions[locationType].supportsReplicationTarget; // && destinationLocations.every((location => location.name !== n));
    })
    .map((n) => {
      return {
        value: n,
        label: n,
      };
    });
};
export const renderSource = (locations: Locations) => {
  return function does(option: ReplicationBucketOption) {
    return `${option.label} (${option.location} / ${getLocationTypeShort(
      option.location,
      locations,
    )})`;
  };
};
export const renderDestination = (locations: Locations) => {
  return function does(option: SelectOption) {
    return `${option.label} (${getLocationTypeShort(
      option.value,
      locations,
    )})`
  };
};
export function newExpiration(bucketName?: string): Expiration {
  return {
    bucketName: bucketName || '',
    enabled: true,
    filter: {
      objectKeyPrefix: '',
    },
    name: '',
    type: 'bucket-workflow-expiration-v1',
    workflowId: '',
    currentVersionTriggerDelayDate: '',
    currentVersionTriggerDelayDays: null,
    expireDeleteMarkersTrigger: null,
    incompleteMultipartUploadTriggerDelayDays: null,
    previousVersionTriggerDelayDays: null,
  };
}
export function newReplicationForm(bucketName?: string): ReplicationForm {
  return {
    streamVersion: 1,
    streamId: '',
    enabled: true,
    sourceBucket: bucketName || '',
    sourcePrefix: '',
    destinationLocation: '',
  };
}
export function newReplicationStream(): ReplicationStream {
  return {
    streamId: '',
    name: '',
    version: 1,
    enabled: true,
    source: {
      prefix: null,
      bucketName: '',
    },
    destination: {
      locations: [],
      preferredReadLocation: null,
    },
  };
}
export function convertToReplicationForm(
  r: ReplicationStream | null | undefined,
): ReplicationForm {
  if (!r) {
    return newReplicationForm();
  }

  return {
    streamVersion: r.version || 1,
    streamId: r.streamId || '',
    enabled: r.enabled,
    sourceBucket: r.source.bucketName,
    sourcePrefix: r.source.prefix || '',
    destinationLocation: r.destination.locations[0].name,
  };
}
export function convertToReplicationStream(
  r: ReplicationForm,
): ReplicationStream {
  if (!r) {
    return newReplicationStream();
  }

  return {
    streamId: r.streamId || '',
    name: '',
    version: r.streamVersion || 1,
    enabled: !!r.enabled,
    source: {
      prefix: r.sourcePrefix || '',
      bucketName: r.sourceBucket || '',
    },
    destination: {
      locations:
        [
          {
            name: r.destinationLocation || '',
          },
        ] || [],
      preferredReadLocation: null,
    },
  };
}
export function prepareExpirationQuery(data: Expiration): Expiration {
  return {
    ...Object.fromEntries(
      Object.entries(data).filter(([key, value]) => {
        if (key === 'expireDeleteMarkersTrigger' && !value) return false;
        return !(value === '' || value === null || value === 0);
      }),
    ),
    filter: Object.fromEntries(
      Object.entries(data.filter || {}).filter(([, value]) => {
        return !(value === '' || value === null);
      }),
    ),
    name: generateExpirationName(data),
  } as Expiration;
}
export function generateStreamName(r: ReplicationStream): string {
  const { bucketName, prefix } = r.source;
  const locations = r.destination.locations;
  const addedPrefix = prefix ? `/${prefix}` : '';
  const locationNames = locations.map((l) => l.name);
  return `${bucketName}${addedPrefix} ➜ ${locationNames.toString()}`;
}

export function generateExpirationName(expiration: Expiration): string {
  const addedPrefix = expiration.filter?.objectKeyPrefix
    ? `/${expiration.filter?.objectKeyPrefix}`
    : '';
  const descriptionComponents = [];
  if (expiration.currentVersionTriggerDelayDays) {
    descriptionComponents.push(
      `Current version: ${expiration.currentVersionTriggerDelayDays}d`,
    );
  }
  if (expiration.previousVersionTriggerDelayDays) {
    descriptionComponents.push(
      `Previous versions: ${expiration.previousVersionTriggerDelayDays}d`,
    );
  }
  if (expiration.expireDeleteMarkersTrigger) {
    descriptionComponents.push(`Orphan delete markers`);
  }
  if (expiration.incompleteMultipartUploadTriggerDelayDays) {
    descriptionComponents.push(
      `Incomplete multipart: ${expiration.incompleteMultipartUploadTriggerDelayDays}d`,
    );
  }

  return `${
    expiration.bucketName
  }${addedPrefix} - (${descriptionComponents.join(', ')})`;
}
export function flattenFormErrors(
  obj: Record<string, unknown>,
  parent?: string,
  res?: Record<string, unknown> = {},
) {
  for (const key in obj) {
    const propName = parent ? parent + '.' + key : key;
    if (
      typeof obj[key] == 'object' &&
      !(
        'message' in obj[key] &&
        'ref' in obj[key] &&
        'type' in obj[key] &&
        typeof obj[key].message === 'string'
      )
    ) {
      flattenFormErrors(obj[key] as Record<string, unknown>, propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}
