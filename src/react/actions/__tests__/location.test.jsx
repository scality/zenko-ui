import * as actions from '../location';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    LOCATION,
    errorManagementState,
    initState,
    testDispatchFunction,
} from './utils/testUtil';

const locationObj = LOCATION;
const saveLocationNetworkStart = dispatchAction.NETWORK_START_ACTION('Saving Location');

describe('location actions', () => {

    const asyncTests = [
        {
            it: 'saveLocation: should return expected actions',
            fn: actions.saveLocation(locationObj),
            storeState: initState,
            expectedActions: [
                saveLocationNetworkStart,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.LOCATION_BACK_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'saveLocation: should return expected actions for editing a location',
            fn: actions.saveLocation({ ...locationObj, objectId: '123' }),
            storeState: initState,
            expectedActions: [
                saveLocationNetworkStart,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.LOCATION_BACK_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'saveLocation: should handle error',
            fn: actions.saveLocation(locationObj),
            storeState: errorManagementState(),
            expectedActions: [
                saveLocationNetworkStart,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
