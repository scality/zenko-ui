// @flow
import type { Location } from '../../../types/config';
import type { LocationForm } from '../../../types/location';

import { defaultLocationType } from './LocationDetails';

function newLocationDetails(): Location {
    return {
        name: '',
        locationType: defaultLocationType,
        details: {},
        objectId: '',
        isTransient: false,
        isBuiltin: false,
        sizeLimitGB: 0,
    };
}

function newLocationForm(): LocationForm {
    return {
        name: '',
        locationType: defaultLocationType,
        details: {},
        objectId: '',
        options: {
            isTransient: false,
            isBuiltin: false,
            isSizeLimitChecked: false,
            sizeLimitGB: '',
        },
    };
}

function convertToLocation(locationState: LocationForm): Location {
    const { options } = locationState;
    const ret = {
        name: locationState.name,
        locationType: locationState.locationType,
        details: locationState.details,
        objectId: locationState.objectId,
        isTransient: options.isTransient,
        isBuiltin: options.isBuiltin,
        sizeLimitGB: options.isSizeLimitChecked && options.sizeLimitGB ?
            parseInt(options.sizeLimitGB, 10) : 0,
        legacyAwsBehavior: locationState.options.legacyAwsBehavior,
    };
    return ret;
}

function convertToForm(locationProps: Location): LocationForm {
    const ret = {
        name: locationProps.name,
        locationType: locationProps.locationType,
        details: locationProps.details,
        objectId: locationProps.objectId,
        options: {
            isTransient: locationProps.isTransient,
            isBuiltin: locationProps.isBuiltin,
            isSizeLimitChecked: !!locationProps.sizeLimitGB,
            sizeLimitGB: locationProps.sizeLimitGB ?
                `${locationProps.sizeLimitGB}` : '',
            legacyAwsBehavior: locationProps.legacyAwsBehavior,
        },
    };
    return ret;
}

export {
    newLocationForm,
    convertToLocation,
    convertToForm,
    newLocationDetails,
};
