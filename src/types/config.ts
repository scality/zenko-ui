/* eslint-disable */
import { BucketWorkflowV1 } from '../js/managementClient/api';
import type { Account } from './account';

// locations
export const JAGUAR_S3_ENDPOINT = 'https://s3.fr-lyo.jaguar-network.com';
export const JAGUAR_S3_LOCATION_KEY = 'location-jaguar-ring-s3-v1';
export const ORANGE_S3_ENDPOINT = 'https://cloud.orange-business.com';
export const ORANGE_S3_LOCATION_KEY = 'location-orange-ring-s3-v1';

export type LocationName = string;

type LocationS3Type =
  | 'location-scality-artesca-s3-v1'
  | 'location-scality-ring-s3-v1'
  | 'location-jaguar-ring-s3-v1'
  | 'location-orange-ring-s3-v1'
  | 'location-aws-s3-v1';
type LocationFSType =
  | 'location-scality-hdclient-v2'
  | 'location-aws-s3-v1'
  | 'location-gcp-v1'
  | 'location-azure-v1'
  | 'location-file-v1'
  | 'location-ceph-radosgw-s3-v1'
  | 'location-do-spaces-v1'
  | 'location-nfs-mount-v1'
  | 'location-scality-sproxyd-v1'
  | 'location-wasabi-v1'
  | 'location-dmf-v1';

export type LocationTypeKey = LocationS3Type | LocationFSType;

type LocationBase = {
  readonly name: LocationName;
  readonly objectId: string;
  readonly isTransient: boolean;
  readonly isBuiltin: boolean;
  readonly sizeLimitGB: number;
  readonly legacyAwsBehavior?: boolean;
  readonly isCold?: boolean;
};
/**
 * FIXME the type is correct for S3 and `location-file-v1`
 * We need to check for the rest of LocationFSType
 */
type LocationS3 = LocationBase & {
  locationType: LocationS3Type;
  details: LocationS3Details;
};

type LocationFS = LocationBase & {
  locationType: LocationFSType;
  details: LocationFSDetails;
};

export type Location = LocationS3 | LocationFS;

export type DestinationLocations = Array<TargetLocationObject>;
export type Locations = Readonly<PerLocationMap<Location>>;
// replications
export type TargetLocationObject = {
  name: string;
};
export type ReplicationSource = {
  readonly prefix: string | null;
  readonly bucketName: string;
  readonly location?: string;
};
export type Replication = {
  readonly streamId: string;
  readonly name: string;
  readonly version: number;
  readonly enabled: boolean;
  readonly source: ReplicationSource;
  readonly destination: {
    readonly locations: Array<TargetLocationObject>;
    readonly preferredReadLocation?: string | null;
  };
};
export type Expiration = {
  readonly bucketName: string;
  readonly enabled: boolean;
  readonly filter?: {
    readonly objectKeyPrefix?: string;
    readonly objectTags?: Array<{ key: string; value: string }>;
  };
  readonly name: string;
  readonly type: BucketWorkflowV1.TypeEnum.ExpirationV1;
  readonly workflowId: string;
  readonly currentVersionTriggerDelayDate?: string | null;
  readonly currentVersionTriggerDelayDays?: number | null;
  readonly previousVersionTriggerDelayDays?: number | null;
  readonly expireDeleteMarkersTrigger: boolean | null;
  readonly incompleteMultipartUploadTriggerDelayDays?: number | null;
};
// endpoints
export type Hostname = string;
export type Endpoint = {
  readonly hostname: Hostname;
  readonly locationName: LocationName;
  readonly isBuiltin: boolean;
};
export type ReplicationStreams = Array<Replication>;
export type ConfigurationOverlay = {
  readonly version: number;
  readonly users: Array<Account>;
  readonly locations: Locations;
  readonly endpoints: Array<Endpoint>;
};
export type LocationDetails = LocationS3Details | LocationFSDetails;

export type LocationS3Details = {
  accessKey: string;
  bootstrapList: string[];
  bucketName: string;
  endpoint: string;
  region: string;
  secretKey: string;
};

export type LocationFSDetails = {
  bootstrapList: string[];
};

export type PerLocationMap<T> = Record<LocationName, T>;
export const toLocationType = (s: string): LocationType => s;
