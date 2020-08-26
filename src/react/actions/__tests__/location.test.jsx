import * as actions from '../location';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    LOCATION,
    errorManagementState,
    initState,
    testActionFunction,
    testDispatchFunction,
} from './utils/testUtil';

const locationObj = LOCATION;
const saveLocationNetworkStart = dispatchAction.NETWORK_START_ACTION('Saving location');
const deleteLocationNetworkAction = dispatchAction.NETWORK_START_ACTION('Deleting location');


describe('location actions', () => {
    const locationName = 'loc1';
    const syncTests = [
        {
            it: 'should return OPEN_LOCATION_DELETE_DIALOG action',
            fn: actions.openLocationDeleteDialog(locationName),
            expectedActions: [dispatchAction.OPEN_LOCATION_DELETE_DIALOG_ACTION(locationName)],
        },
        {
            it: 'should return CLOSE_LOCATION_DELETE_DIALOG action',
            fn: actions.closeLocationDeleteDialog(),
            expectedActions: [dispatchAction.CLOSE_LOCATION_DELETE_DIALOG_ACTION],
        },
    ];

    syncTests.forEach(testActionFunction);

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

        {
            it: 'deleteLocation: should return expected actions',
            fn: actions.deleteLocation('loc1'),
            storeState: initState,
            expectedActions: [
                deleteLocationNetworkAction,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_LOCATION_DELETE_DIALOG_ACTION,
            ],
        },
        {
            it: 'deleteLocation: should handle error',
            fn: actions.deleteLocation('loc1'),
            storeState: errorManagementState(),
            expectedActions: [
                deleteLocationNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_LOCATION_DELETE_DIALOG_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
