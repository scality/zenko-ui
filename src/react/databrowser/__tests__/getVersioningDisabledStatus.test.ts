import { LocationType } from '../../../js/managementClient/api';
import type { LocationInfo } from '../../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { getVersioningDisabledStatus } from '../DataBrowser';

function makeLocation(name: string, type: LocationType): LocationInfo {
  return { id: name, name, type, details: {} };
}

const locations: LocationInfo[] = [
  makeLocation('my-azure', LocationType.AzureV1),
  makeLocation('my-gcp', LocationType.GcpV1),
  makeLocation('my-azure-archive', LocationType.AzureArchiveV1),
  makeLocation('my-do-spaces', LocationType.DoSpacesV1),
  makeLocation('my-nfs', LocationType.NfsMountV1),
  makeLocation('my-aws', LocationType.AwsS3V1),
  makeLocation('my-ring', LocationType.ScalityRingS3V1),
];

describe('getVersioningDisabledStatus', () => {
  it('disables versioning for Azure locations', () => {
    const result = getVersioningDisabledStatus(locations, 'my-azure');
    expect(result.disabled).toBe(true);
    expect(result.tooltip).toContain('Microsoft Azure Blob Storage');
  });

  it('disables versioning for Google Cloud locations', () => {
    const result = getVersioningDisabledStatus(locations, 'my-gcp');
    expect(result.disabled).toBe(true);
    expect(result.tooltip).toContain('Google Cloud Storage');
  });

  it('disables versioning for Azure Archive locations', () => {
    const result = getVersioningDisabledStatus(locations, 'my-azure-archive');
    expect(result.disabled).toBe(true);
    expect(result.tooltip).toContain('Microsoft Azure Archive');
  });

  it('disables versioning for DigitalOcean Spaces locations', () => {
    const result = getVersioningDisabledStatus(locations, 'my-do-spaces');
    expect(result.disabled).toBe(true);
    expect(result.tooltip).toContain('DigitalOcean Spaces');
  });

  it('disables versioning for NFS Mount locations', () => {
    const result = getVersioningDisabledStatus(locations, 'my-nfs');
    expect(result.disabled).toBe(true);
    expect(result.tooltip).toContain('NFS Mount');
  });

  it('allows versioning for AWS S3 locations', () => {
    const result = getVersioningDisabledStatus(locations, 'my-aws');
    expect(result.disabled).toBe(false);
    expect(result.tooltip).toBeUndefined();
  });

  it('allows versioning for RING S3 locations', () => {
    const result = getVersioningDisabledStatus(locations, 'my-ring');
    expect(result.disabled).toBe(false);
    expect(result.tooltip).toBeUndefined();
  });

  it('allows versioning for unknown locations', () => {
    const result = getVersioningDisabledStatus(locations, 'unknown-location');
    expect(result.disabled).toBe(false);
  });
});
