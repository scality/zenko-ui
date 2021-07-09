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

export type DestinationLocations = Array<TargetLocationObject>;

export type Locations = $ReadOnly<PerLocationMap<Location>>;

// replications
export type TargetLocationObject = {|
    name: string,
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
        +locations: Array<TargetLocationObject>,
        +preferredReadLocation?: string | null,
    |},
|};

export type ReplicationStreams = Array<Replication>;

// expirations
export type Expiration = {|
    +workflowId: string;
    +name: string;
    +enabled: boolean;
    +bucketName: string;
    +type: 'bucket-workflow-expiration-v1',
    +filter: {|
        +objectKeyPrefix: string;
    |},
    +currentVersionTriggerDelayDays: number;
    +currentVersionTriggerDelayDate: string;
    +previousVersionTriggerDelayDays: number;
|};

export type Expirations = Array<Expiration>;

// endpoints
export type Hostname = string;

export type Endpoint = {|
    +hostname: Hostname,
    +locationName: LocationName,
    +isBuiltin: boolean,
|};

export type ConfigurationOverlay = {|
    +version: number,
    +users: Array<Account>,
    +locations: Locations,
    +endpoints: Array<Endpoint>,
|};

export type LocationDetails = {}; // todo: add restricter detail definitions

export type PerLocationMap<T> = {
    [LocationName]: T,
};

export const toLocationType = (s: string): LocationType => s;
