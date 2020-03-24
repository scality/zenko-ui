// @noflow

import { defaultLocationType } from './LocationDetails';

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

export {
    newLocationForm,
};
