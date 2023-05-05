import {
  JAGUAR_S3_LOCATION_KEY,
  LocationTypeKey,
  ORANGE_S3_LOCATION_KEY,
  OUTSCALE_PUBLIC_S3_LOCATION_KEY,
  OUTSCALE_SNC_S3_LOCATION_KEY,
} from '../../../../types/config';
import LocationDetailsAws from './LocationDetailsAws';
import LocationDetailsAwsCustom from './LocationDetailsAwsCustom';
import LocationDetailsAzure from './LocationDetailsAzure';
import LocationDetailsDOSpaces from './LocationDetailsDOSpaces';
import LocationDetailsGcp from './LocationDetailsGcp';
import LocationDetailsHyperdriveV2 from './LocationDetailsHyperdriveV2';
import LocationDetailsNFS from './LocationDetailsNFS';
import LocationDetailsSproxyd from './LocationDetailsSproxyd';
import LocationDetailsTapeDMF from './LocationDetailsTapeDMF';
import LocationDetailsWasabi from './LocationDetailsWasabi';

export type StorageOptionValues = {
  name: string;
  short: string;
  formDetails: JSX.Element | any;
  supportsVersioning: boolean;
  supportsReplicationTarget: boolean;
  supportsReplicationSource: boolean;
  hasIcon: boolean;
  checkCapability?: string;
  ingestCapability?: string;
  hidden?: boolean;
  supportsVersion?: string;
};
export const storageOptions: Record<LocationTypeKey, StorageOptionValues> = {
  'location-scality-hdclient-v2': {
    name: 'Storage Service for ARTESCA',
    short: 'Storage Service',
    formDetails: LocationDetailsHyperdriveV2,
    supportsVersioning: true,
    supportsReplicationTarget: false,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeHyperdriveV2',
  },
  'location-scality-artesca-s3-v1': {
    name: 'Scality ARTESCA S3',
    short: 'ARTESCA',
    formDetails: LocationDetailsAwsCustom,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeS3Custom',
  },
  'location-scality-ring-s3-v1': {
    name: 'Scality RING with S3 Connector',
    short: 'RING S3',
    formDetails: LocationDetailsAwsCustom,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeS3Custom',
    ingestCapability: 's3cIngestLocation',
  },
  'location-aws-s3-v1': {
    name: 'Amazon S3',
    short: 'AWS S3',
    formDetails: LocationDetailsAws,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    ingestCapability: 'awsIngestLocation',
  },
  'location-gcp-v1': {
    name: 'Google Cloud Storage',
    short: 'GCP',
    formDetails: LocationDetailsGcp,
    supportsVersioning: false,
    supportsReplicationTarget: true,
    supportsReplicationSource: false,
    hasIcon: false,
  },
  'location-azure-v1': {
    name: 'Microsoft Azure Blob Storage',
    short: 'Azure',
    formDetails: LocationDetailsAzure,
    supportsVersioning: false,
    supportsReplicationTarget: true,
    supportsReplicationSource: false,
    hasIcon: false,
  },
  [JAGUAR_S3_LOCATION_KEY]: {
    name: 'Atlas Object Storage (Free Pro)',
    short: 'Atlas S3',
    formDetails: LocationDetailsAwsCustom,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeS3Custom',
  },
  [OUTSCALE_PUBLIC_S3_LOCATION_KEY]: {
    name: '3DS Outscale OOS Public',
    short: 'OOS Public',
    formDetails: LocationDetailsAwsCustom,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeS3Custom',
  },
  [OUTSCALE_SNC_S3_LOCATION_KEY]: {
    name: '3DS Outscale OOS SNC',
    short: 'OOS SNC',
    formDetails: LocationDetailsAwsCustom,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeS3Custom',
  },
  [ORANGE_S3_LOCATION_KEY]: {
    name: 'Flexible Datastore',
    short: 'OBS S3',
    formDetails: LocationDetailsAwsCustom,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeS3Custom',
  },
  'location-dmf-v1': {
    name: 'Tape DMF',
    short: 'DMF',
    formDetails: LocationDetailsTapeDMF,
    supportsVersioning: true,
    supportsReplicationTarget: false,
    supportsReplicationSource: true,
    hasIcon: false,
  },
  'location-file-v1': {
    name: 'Local Filesystem',
    short: 'Local Filesystem',
    formDetails: null,
    supportsVersioning: true,
    supportsReplicationTarget: false,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeLocal',
    hidden: true,
  },
  'location-ceph-radosgw-s3-v1': {
    name: 'Ceph RADOS Gateway',
    short: 'CEPH',
    formDetails: LocationDetailsAwsCustom,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeCephRadosGW',
    ingestCapability: 'cephIngestLocation',
    hidden: false,
  },
  'location-do-spaces-v1': {
    name: 'DigitalOcean Spaces',
    short: 'Spaces',
    formDetails: LocationDetailsDOSpaces,
    supportsVersioning: false,
    supportsReplicationTarget: true,
    supportsReplicationSource: false,
    hasIcon: false,
    checkCapability: 'locationTypeDigitalOcean',
    hidden: true,
  },
  'location-nfs-mount-v1': {
    name: 'NFS Mount',
    short: 'NFS',
    formDetails: LocationDetailsNFS,
    supportsVersioning: false,
    supportsReplicationTarget: false,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeNFS',
    ingestCapability: 'nfsIngestLocation',
    hidden: true,
  },
  'location-scality-sproxyd-v1': {
    name: 'Scality RING with Sproxyd Connector',
    short: 'Sproxyd',
    formDetails: LocationDetailsSproxyd,
    supportsVersioning: true,
    supportsReplicationTarget: false,
    supportsReplicationSource: true,
    hasIcon: false,
    checkCapability: 'locationTypeSproxyd',
  },
  'location-wasabi-v1': {
    name: 'Wasabi',
    short: 'Wasabi',
    formDetails: LocationDetailsWasabi,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
  },
};
