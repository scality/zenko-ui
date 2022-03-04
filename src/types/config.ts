/* eslint-disable */
import type { Account } from './account';
// locations
export type LocationName = string;
export type LocationType = string;
export type Location = {
  readonly name: LocationName;
  readonly locationType: LocationType;
  readonly details: LocationDetails;
  readonly objectId: string;
  readonly isTransient: boolean;
  readonly isBuiltin: boolean;
  readonly sizeLimitGB: number;
  readonly legacyAwsBehavior?: boolean;
};
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
export type LocationDetails = {}; // todo: add restricter detail definitions

export type PerLocationMap<T> = Record<LocationName, T>;
export const toLocationType = (s: string): LocationType => s;
