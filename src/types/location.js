// @flow

import type { LocationDetails, LocationName, LocationType } from './config';

export type LocationSelectOption = {|
    value: LocationName,
    label: string,
    disabled: boolean,
|};

export type LocationFormOptions = {|
    +isTransient: boolean,
    +isBuiltin: boolean,
    +isSizeLimitChecked: boolean,
    +sizeLimitGB?: string,
    +legacyAwsBehavior?: boolean,
|};

export type LocationForm = {|
    +name: LocationName,
    +locationType: LocationType,
    +details: LocationDetails,
    +objectId: string,
    +options: LocationFormOptions,
|};
