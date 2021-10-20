// @flow

import LocationDetailsAws from './LocationDetailsAws';
import LocationDetailsAwsCustom from './LocationDetailsAwsCustom';
import LocationDetailsAzure from './LocationDetailsAzure';
import LocationDetailsDOSpaces from './LocationDetailsDOSpaces';
import LocationDetailsGcp from './LocationDetailsGcp';
import LocationDetailsHyperdriveV2 from './LocationDetailsHyperdriveV2';
import LocationDetailsNFS from './LocationDetailsNFS';
import LocationDetailsSproxyd from './LocationDetailsSproxyd';
import LocationDetailsWasabi from './LocationDetailsWasabi';

export const storageOptions: { [name: string]: any } = {
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
    name: 'Scality Artesca S3',
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
    short: 'RING',
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
  'location-file-v1': {
    name: 'Local Filesystem',
    short: 'Local Filesystem',
    supportsVersioning: true,
    supportsReplicationTarget: false,
    supportsReplicationSource: true,
    hasIcon: false,
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
    hidden: true,
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
    supportsVersion: false,
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
    hidden: true,
  },
  // 'location-mem-v1': {
  //     name: 'Volatile In-Memory',
  //     hasIcon: false,
  // },
  'location-wasabi-v1': {
    name: 'Wasabi',
    short: 'Wasabi',
    formDetails: LocationDetailsWasabi,
    supportsVersioning: true,
    supportsReplicationTarget: true,
    supportsReplicationSource: true,
    hasIcon: false,
    hidden: true,
  },
};
