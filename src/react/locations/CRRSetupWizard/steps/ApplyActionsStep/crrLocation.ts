import {
  type Locationscalitycrrv1Details,
  LocationType,
  type LocationV1,
} from '../../../../../js/managementClient/api';
import type { SetupResult } from '../../api/types';

/** Reduces a host to characters valid in a location name (dots/other separators become hyphens). */
const sanitizeHost = (host: string): string => host.replace(/[^a-zA-Z0-9-]/g, '-');

/**
 * Derives the CRR location name as `<destinationAccountName>-<host>`, where host
 * is the destination IP/hostname only (no scheme, no port). Management-network
 * uses the connection URL's host; data-network uses the base domain.
 */
export const buildCRRLocationName = ({
  destinationAccountName,
  url,
  baseDomain,
}: {
  destinationAccountName: string;
  url?: string;
  baseDomain?: string;
}): string => {
  const host = url ? new URL(url).hostname : (baseDomain ?? '');
  return `${destinationAccountName}-${sanitizeHost(host)}`;
};

/**
 * Builds the `location-scality-crr-v1` configuration from the backend setup
 * result: the destination S3/STS endpoints and the crr-user access keys the
 * configurator created.
 */
export const buildCRRLocation = (name: string, result: SetupResult): LocationV1 => {
  const details: Locationscalitycrrv1Details = {
    endpoint: result.endpoint,
    stsEndpoint: result.stsEndpoint,
    accessKey: result.accessKey,
    secretKey: result.secretKey,
  };
  return { name, locationType: LocationType.ScalityCrrV1, details };
};
