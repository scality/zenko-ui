// @flow
import type { Account } from './account';

export type ConfigurationOverlay = {|
    +users: Array<Account>,
|};

export type LocationName = string;
export type LocationType = string;

export type PerLocationMap<T> = {
    [LocationName]: T,
};
