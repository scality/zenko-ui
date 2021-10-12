import * as actions from '../endpoint';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    errorManagementState,
    initState,
    storeStateWithManagementClient,
    storeStateWithRunningConfigurationVersion2,
    testActionFunction,
    testDispatchFunction,
    testDispatchFunctionWithFullStore,
} from './utils/testUtil';
import { MockManagementClientWithConfigurationVersions } from '../../../js/mock/managementClient';

const createEndpointNetworkStart = dispatchAction.NETWORK_START_ACTION('Deploying Data Service');

describe('endpoint actions', () => {
    const hostname = 's3.exemple.com';
    const locationName = 'loc1';
    // const syncTests = [
    //     {
    //         it: 'should return OPEN_LOCATION_DELETE_DIALOG action',
    //         fn: actions.openLocationDeleteDialog(locationName),
    //         expectedActions: [dispatchAction.OPEN_LOCATION_DELETE_DIALOG_ACTION(locationName)],
    //     },
    //     {
    //         it: 'should return CLOSE_LOCATION_DELETE_DIALOG action',
    //         fn: actions.closeLocationDeleteDialog(),
    //         expectedActions: [dispatchAction.CLOSE_LOCATION_DELETE_DIALOG_ACTION],
    //     },
    // ];

    // syncTests.forEach(testActionFunction);

    const asyncTests = [
        {
            it: 'createEndpoint: should return expected actions',
            fn: actions.createEndpoint(hostname, locationName),
            storeState: storeStateWithRunningConfigurationVersion2(),
            expectedActions: [
                createEndpointNetworkStart,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.LOCATION_PUSH_ACTION('/dataservice'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'createEndpoint: should handle error',
            fn: actions.createEndpoint(hostname, locationName),
            storeState: errorManagementState(),
            expectedActions: [
                createEndpointNetworkStart,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('Management API Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },

        // {
        //     it: 'deleteLocation: should return expected actions',
        //     fn: actions.deleteLocation('loc1'),
        //     storeState: storeStateWithRunningConfigurationVersion2(),
        //     expectedActions: [
        //         deleteLocationNetworkAction,
        //         dispatchAction.CONFIGURATION_VERSION_ACTION,
        //         dispatchAction.NETWORK_END_ACTION,
        //         dispatchAction.CLOSE_LOCATION_DELETE_DIALOG_ACTION,
        //     ],
        // },
        // {
        //     it: 'deleteLocation: should handle error',
        //     fn: actions.deleteLocation('loc1'),
        //     storeState: errorManagementState(),
        //     expectedActions: [
        //         deleteLocationNetworkAction,
        //         dispatchAction.HANDLE_ERROR_MODAL_ACTION('Management API Error Response'),
        //         dispatchAction.NETWORK_END_ACTION,
        //         dispatchAction.CLOSE_LOCATION_DELETE_DIALOG_ACTION,
        //     ],
        // },
    ];

    asyncTests.forEach(testDispatchFunction);

    const asyncFullStoreTests = [
        {
            it: 'createEndpoint: should wait for new configuration version',
            fn: actions.createEndpoint(hostname, locationName),
            storeState: storeStateWithManagementClient(
                initState,
                new MockManagementClientWithConfigurationVersions([1, 2], [2]),
            ),
            expectedActions: [
                createEndpointNetworkStart,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.INSTANCE_STATUS_ACTION_RUNNINGv1,
                dispatchAction.INSTANCE_STATUS_ACTION_RUNNINGv2,
                dispatchAction.LOCATION_PUSH_ACTION('/dataservice'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        // {
        //     it: 'deleteLocation: should wait for new configuration version',
        //     fn: actions.deleteLocation('loc1'),
        //     storeState: storeStateWithManagementClient(
        //         initState,
        //         new MockManagementClientWithConfigurationVersions([1, 2], [2]),
        //     ),
        //     expectedActions: [
        //         deleteLocationNetworkAction,
        //         dispatchAction.CONFIGURATION_VERSION_ACTION,
        //         dispatchAction.INSTANCE_STATUS_ACTION_RUNNINGv1,
        //         dispatchAction.INSTANCE_STATUS_ACTION_RUNNINGv2,
        //         dispatchAction.NETWORK_END_ACTION,
        //         dispatchAction.CLOSE_LOCATION_DELETE_DIALOG_ACTION,
        //     ],
        // },
    ];

    asyncFullStoreTests.forEach(testDispatchFunctionWithFullStore);
});
