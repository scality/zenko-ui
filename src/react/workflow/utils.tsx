import { CustomHelpers } from '@hapi/joi';
import { FieldError, FieldErrors } from 'react-hook-form';
import {
  BucketWorkflowExpirationV1,
  BucketWorkflowTransitionV2,
  BucketWorkflowV1,
} from '../../js/managementClient/api';
import type { Replication as ReplicationStream } from '../../types/config';
import type { ReplicationForm } from '../../types/replication';
import type { Tag } from '../../types/s3';
import type { SelectOption } from '../../types/ui';
import { storageOptions } from '../locations/LocationDetails';
import { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { getLocationTypeShort } from '../utils/storageOptions';

export const destinationOptions = (
  locations: LocationInfo[],
): Array<SelectOption> => {
  return locations
    .filter((l) => {
      const locationType = l.type;
      return storageOptions[locationType]?.supportsReplicationTarget; // && destinationLocations.every((location => location.name !== n));
    })
    .map((l) => {
      return {
        value: l.name,
        label: l.name,
      };
    });
};

export const renderDestination = (locations: LocationInfo[]) => {
  return function does(option: SelectOption) {
    const location = locations.find((l) => l.name === option.value);
    if (!location) return option.label;
    return `${option.label} (${getLocationTypeShort(location)})`;
  };
};

export function newExpiration(bucketName?: string): BucketWorkflowExpirationV1 {
  return {
    bucketName: bucketName || '',
    enabled: true,
    filter: {
      objectKeyPrefix: '',
      objectTags: [{ key: '', value: '' }],
    },
    name: '',
    type: BucketWorkflowV1.TypeEnum.ExpirationV1,
    workflowId: '',
    currentVersionTriggerDelayDate: '',
    currentVersionTriggerDelayDays: undefined,
    expireDeleteMarkersTrigger: undefined,
    incompleteMultipartUploadTriggerDelayDays: undefined,
    previousVersionTriggerDelayDays: undefined,
  };
}

export function newTransition(bucketName?: string): BucketWorkflowTransitionV2 {
  return {
    bucketName: bucketName || '',
    enabled: true,
    filter: {
      objectKeyPrefix: '',
      objectTags: [{ key: '', value: '' }],
    },
    name: '',
    type: BucketWorkflowV1.TypeEnum.TransitionV2,
    workflowId: '',
    applyToVersion: BucketWorkflowTransitionV2.ApplyToVersionEnum.Current,
    locationName: '',
    triggerDelayDays: undefined,
    triggerDelayDate: '',
  };
}

export function newReplicationForm(bucketName?: string): ReplicationForm {
  return {
    streamVersion: 1,
    streamId: '',
    enabled: true,
    sourceBucket: bucketName || '',
    sourcePrefix: '',
    destinationLocation: [''],
    preferredReadLocation: null,
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
    destinationLocation: r.destination.locations.map(({ name }) => name),
    preferredReadLocation: r.destination.preferredReadLocation ?? null,
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
      locations: r.destinationLocation.map((name) => ({ name })),
      preferredReadLocation: r.preferredReadLocation,
    },
  };
}

export function prepareTransitionQuery(
  data: BucketWorkflowTransitionV2,
): BucketWorkflowTransitionV2 {
  return {
    ...data,
    triggerDelayDays:
      data.triggerDelayDays && typeof data.triggerDelayDays === 'string'
        ? parseInt(data.triggerDelayDays, 10)
        : data.triggerDelayDays,
  };
}

export function prepareExpirationQuery(
  data: BucketWorkflowExpirationV1,
): BucketWorkflowExpirationV1 {
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
  } as BucketWorkflowExpirationV1;
}

export function generateBucketPrefix(
  w: BucketWorkflowTransitionV2 | BucketWorkflowExpirationV1,
) {
  const addedPrefix = w.filter?.objectKeyPrefix
    ? `/${w.filter?.objectKeyPrefix}`
    : '';
  const filteredByTagsPrefix =
    w.filter?.objectTags && w.filter?.objectTags.length > 0
      ? `[tags:${w.filter.objectTags.length}]`
      : '';
  return `${w.bucketName}${addedPrefix}${filteredByTagsPrefix}`;
}

export function generateStreamName(r: ReplicationStream): string {
  const { bucketName, prefix } = r.source;
  const locations = r.destination.locations;
  const addedPrefix = prefix ? `/${prefix}` : '';
  const locationNames = locations.map((l) => l.name);
  return `${bucketName}${addedPrefix} ➜ ${locationNames.toString()}`;
}

export function generateExpirationName(
  expiration: BucketWorkflowExpirationV1,
): string {
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

  return `${generateBucketPrefix(expiration)} - (${descriptionComponents.join(
    ', ',
  )})`;
}

export function generateTransitionName(t: BucketWorkflowTransitionV2) {
  return `${generateBucketPrefix(t)} (${
    t.applyToVersion === BucketWorkflowTransitionV2.ApplyToVersionEnum.Current
      ? 'current'
      : 'previous'
  } versions)  ➜ ${t.locationName} - ${t.triggerDelayDays}d`;
}

export function flattenFormErrors<T = unknown>(
  obj: FieldErrors<T>,
  parent?: string,
  res: Record<string, FieldError> = {},
): Record<string, FieldError> {
  for (const key in obj) {
    const propName = parent ? parent + '.' + key : key;
    const value: any = obj[key];
    if (
      value &&
      typeof value === 'object' &&
      !(
        'ref' in value &&
        'type' in value &&
        'message' in value &&
        typeof value.message === 'string'
      )
    ) {
      flattenFormErrors(value as Record<string, unknown>, propName, res);
    } else {
      res[propName] = value;
    }
  }
  return res;
}

export type TouchedFields = { [key: string]: TouchedFields | boolean };
export type FlattenedFields = { [key: string]: boolean };
export function flattenFormTouchedFields(
  fields: TouchedFields,
  parent?: string,
): FlattenedFields {
  return Object.entries(fields).reduce((acc, [key, entry]) => {
    const k = parent ? `${parent}.${key}` : key;
    if (typeof entry === 'boolean') return { ...acc, [k]: entry };
    return { ...acc, ...flattenFormTouchedFields(entry, k) };
  }, {} as FlattenedFields);
}

export function removeEmptyTagKeys<
  T extends BucketWorkflowExpirationV1 | BucketWorkflowTransitionV2,
>(workflow: T): T {
  if (workflow.filter && workflow.filter.objectTags) {
    const sanitizedTags = workflow.filter.objectTags.filter(
      (tag: Tag) => tag.key !== '',
    );
    workflow.filter.objectTags.splice(0, workflow.filter.objectTags.length);
    workflow.filter.objectTags.push(...sanitizedTags);

    return {
      ...workflow,
      ...{
        filter: {
          objectKeyPrefix: workflow.filter.objectKeyPrefix,
          objectTags: sanitizedTags,
        },
      },
    };
  }

  return workflow;
}

export const hasUniqueKeys = (value: Array<Tag>, helper: CustomHelpers) => {
  const keys = value.map((obj: Tag): string => obj.key);
  const hasDuplicates = new Set(keys).size !== keys.length;
  if (hasDuplicates) {
    return helper.message({ en: `Please use a unique key` });
  } else {
    return value;
  }
};

const hasIdenticalTags = (tagsA: Array<Tag>, tagsB: Array<Tag>): boolean => {
  tagsA.sort((tag1: Tag, tag2: Tag) => {
    if (tag1 > tag2) return 1;
    return -1;
  });
  tagsB.sort((tag1: Tag, tag2: Tag) => {
    if (tag1 > tag2) return 1;
    return -1;
  });
  return JSON.stringify(tagsA) === JSON.stringify(tagsB);
};

type Filter = {
  objectKeyPrefix: string;
  objectTags: Tag[];
};

export const filterWorkflows = (
  transitions: BucketWorkflowTransitionV2[],
  filters: Filter,
): BucketWorkflowTransitionV2[] => {
  const sanitizedTags = filters.objectTags.filter((tag: Tag) => tag.key !== '');

  return transitions.filter((ts: BucketWorkflowTransitionV2) => {
    if (filters.objectKeyPrefix) {
      return ts.filter?.objectKeyPrefix === filters.objectKeyPrefix;
    }
    return hasIdenticalTags(
      //@ts-expect-error fix this when you are working on it
      ts.filter?.objectTags || [],
      sanitizedTags,
    );
  });
};
