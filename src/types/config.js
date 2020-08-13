// @flow
import type { Account } from './account';

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

export type ConfigurationOverlay = {|
    +users: Array<Account>,
    +locations: Locations,
|};

export type LocationName = string;
export type LocationType = string;

export type LocationDetails = {}; // todo: add restricter detail definitions

export type PerLocationMap<T> = {
    [LocationName]: T,
};

export const toLocationType = (s: string): LocationType => s;
