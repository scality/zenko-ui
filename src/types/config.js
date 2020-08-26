// @flow
import type { Account } from './account';

// locations
export type LocationName = string;
export type LocationType = string;

export type Location = {|
    +name: LocationName,
    +locationType: LocationType,
    +details: LocationDetails,
    +objectId: string,
    +isTransient: boolean,
    +isBuiltin: boolean,
    +sizeLimitGB: number,
    +legacyAwsBehavior?: boolean,
|};

export type Locations = $ReadOnly<PerLocationMap<Location>>;

// replications
export type TargetLocationObject = {|
    name: string,
    storageClass: string,
|};

export type ReplicationSource = {|
    +prefix: string | null,
    +bucketName: string,
    +location?: string,
|};

export type Replication = {|
    +streamId: string,
    +name: string,
    +version: number,
    +enabled: boolean,
    +source: ReplicationSource,
    +destination: {|
        +bucketName?: string,
        +locations: Array<TargetLocationObject>,
        +preferredReadLocation?: string | null,
    |},
|};

// endpoints
export type Hostname = string;

export type Endpoint = {|
    +hostname: Hostname,
    +locationName: LocationName,
    +isBuiltin: boolean,
|};

export type ConfigurationOverlay = {|
    +users: Array<Account>,
    +locations: Locations,
    +replicationStreams: Array<Replication>;
    +endpoints: Array<Endpoint>,
|};

export type LocationDetails = {}; // todo: add restricter detail definitions

export type PerLocationMap<T> = {
    [LocationName]: T,
};

export const toLocationType = (s: string): LocationType => s;
