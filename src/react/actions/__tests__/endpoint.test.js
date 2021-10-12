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
const deleteEndpointNetworkAction = dispatchAction.NETWORK_START_ACTION('Deleting Data Service');

describe('endpoint actions', () => {
    const hostname = 's3.exemple.com';
    const locationName = 'loc1';
    const syncTests = [
        {
            it: 'should return OPEN_ENDPOINT_DELETE_DIALOG action',
            fn: actions.openEndpointDeleteDialog(hostname),
            expectedActions: [dispatchAction.OPEN_ENDPOINT_DELETE_DIALOG_ACTION(hostname)],
        },
        {
            it: 'should return CLOSE_ENDPOINT_DELETE_DIALOG action',
            fn: actions.closeEndpointDeleteDialog(),
            expectedActions: [dispatchAction.CLOSE_ENDPOINT_DELETE_DIALOG_ACTION],
        },
    ];

    syncTests.forEach(testActionFunction);

    const asyncTests = [
        {
            it: 'createEndpoint: should return expected actions',
            fn: actions.createEndpoint(hostname, locationName),
            storeState: storeStateWithRunningConfigurationVersion2(),
            expectedActions: [
                createEndpointNetworkStart,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.LOCATION_PUSH_ACTION('/dataservices'),
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
        {
            it: 'deleteEndpoint: should return expected actions',
            fn: actions.deleteEndpoint(hostname),
            storeState: storeStateWithRunningConfigurationVersion2(),
            expectedActions: [
                dispatchAction.CLOSE_ENDPOINT_DELETE_DIALOG_ACTION,
                deleteEndpointNetworkAction,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'deleteEndoint: should handle error',
            fn: actions.deleteEndpoint(hostname),
            storeState: errorManagementState(),
            expectedActions: [
                dispatchAction.CLOSE_ENDPOINT_DELETE_DIALOG_ACTION,
                deleteEndpointNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('Management API Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
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
                dispatchAction.LOCATION_PUSH_ACTION('/dataservices'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'deleteEndpoint: should wait for new configuration version',
            fn: actions.deleteEndpoint(hostname),
            storeState: storeStateWithManagementClient(
                initState,
                new MockManagementClientWithConfigurationVersions([1, 2], [2]),
            ),
            expectedActions: [
                dispatchAction.CLOSE_ENDPOINT_DELETE_DIALOG_ACTION,
                deleteEndpointNetworkAction,
                dispatchAction.CONFIGURATION_VERSION_ACTION,
                dispatchAction.INSTANCE_STATUS_ACTION_RUNNINGv1,
                dispatchAction.INSTANCE_STATUS_ACTION_RUNNINGv2,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncFullStoreTests.forEach(testDispatchFunctionWithFullStore);
});
