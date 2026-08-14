import {
  type Locationscalitycrrv1Details,
  LocationType,
  type LocationV1,
} from '../../../../../js/managementClient/api';
import type { SetupResult } from '../../api/types';

/** Reduces a host to characters valid in a location name (dots/other separators become hyphens). */
const sanitizeHost = (host: string): string => host.replace(/[^a-zA-Z0-9-]/g, '-');

/**
 * Derives the CRR location name as `location-<destinationAccountName>-<baseDomain>`,
 * the base domain reduced to name-safe characters (no scheme, no port).
 */
export const buildCRRLocationName = ({
  destinationAccountName,
  baseDomain,
}: {
  destinationAccountName: string;
  baseDomain: string;
}): string => `location-${destinationAccountName}-${sanitizeHost(baseDomain)}`;

export const buildCRRReplicationRuleId = (destinationAccountName: string): string =>
  `replication-${destinationAccountName}`;

// Host-based sts.<base>, NOT a /zenko-path-routed URL: the source signs STS with
// SigV4 and the ingress prefix-strip would break the signature.
export const crrStsEndpoint = (baseDomain: string): string => `https://sts.${baseDomain.replace(/^ui\./, '')}`;

export const buildCRRLocation = (name: string, result: SetupResult, baseDomain: string): LocationV1 => {
  const details: Locationscalitycrrv1Details = {
    endpoint: result.endpoint,
    stsEndpoint: crrStsEndpoint(baseDomain),
    accessKey: result.accessKey,
    secretKey: result.secretKey,
  };
  return { name, locationType: LocationType.ScalityCrrV1, details };
};
