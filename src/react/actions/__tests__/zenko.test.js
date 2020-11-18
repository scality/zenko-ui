import * as actions from '../zenko';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    BUCKET_NAME,
    QUERYSTRING,
    ZENKO_ERROR,
    errorZenkoState,
    initState,
    testActionFunction,
    testDispatchFunction,
} from './utils/testUtil';
import {
    NETWORK_START_ACTION_CONTINUE_SEARCH,
    NETWORK_START_ACTION_SEARCHING_OBJECTS,
    NETWORK_START_ACTION_STARTING_SEARCH,
} from '../../../consts';
import { MockZenkoClient } from '../../../js/mock/ZenkoClient';

const startingSearchNetworkAction = dispatchAction.NETWORK_START_ACTION(NETWORK_START_ACTION_STARTING_SEARCH);
const searchingObjectsNetworkAction = dispatchAction.NETWORK_START_ACTION(NETWORK_START_ACTION_SEARCHING_OBJECTS);
const continueSearchNetworkAction = dispatchAction.NETWORK_START_ACTION(NETWORK_START_ACTION_CONTINUE_SEARCH);

describe('zenko actions', () => {
    const mock = new MockZenkoClient;
    const syncTests = [
        {
            it: 'should return SET_ZENKO_CLIENT action',
            fn: actions.setZenkoClient(mock),
            expectedActions: [dispatchAction.SET_ZENKO_CLIENT_ACTION(mock)],
        },
        {
            it: 'should return ZENKO_CLEAR_ERROR action',
            fn: actions.zenkoClearError(),
            expectedActions: [dispatchAction.ZENKO_CLEAR_ERROR_ACTION()],
        },
        {
            it: 'should return ZENKO_HANDLE_ERROR action',
            fn: actions.zenkoHandleError(ZENKO_ERROR, null, null),
            expectedActions: [dispatchAction.ZENKO_HANDLE_ERROR_ACTION(ZENKO_ERROR, null, null)],
        },
        {
            it: 'should return ZENKO_HANDLE_ERROR action with right target',
            fn: actions.zenkoHandleError(ZENKO_ERROR, 'target', null),
            expectedActions: [dispatchAction.ZENKO_HANDLE_ERROR_ACTION(ZENKO_ERROR, 'target', null)],
        },
        {
            it: 'should return ZENKO_HANDLE_ERROR action with right type',
            fn: actions.zenkoHandleError(ZENKO_ERROR, null, 'type'),
            expectedActions: [dispatchAction.ZENKO_HANDLE_ERROR_ACTION(ZENKO_ERROR, null, 'type')],
        },
        {
            it: 'should return ZENKO_CLIENT_WRITE_SEARCHLIST action',
            fn: actions.writeSearchListing(null, []),
            expectedActions: [dispatchAction.ZENKO_CLIENT_WRITE_SEARCH_LIST_ACTION(null, [])],
        },
        {
            it: 'should return ZENKO_CLIENT_WRITE_SEARCHLIST action with right nextMarker',
            fn: actions.writeSearchListing('marker', []),
            expectedActions: [dispatchAction.ZENKO_CLIENT_WRITE_SEARCH_LIST_ACTION('marker', [])],
        },
        {
            it: 'should return ZENKO_CLIENT_WRITE_SEARCHLIST action with right list',
            fn: actions.writeSearchListing(null, ['test']),
            expectedActions: [dispatchAction.ZENKO_CLIENT_WRITE_SEARCH_LIST_ACTION(null, ['test'])],
        },
        {
            it: 'should return ZENKO_CLIENT_APPEND_SEARCH_LIST action',
            fn: actions.appendSearchListing(null, []),
            expectedActions: [dispatchAction.ZENKO_CLIENT_APPEND_SEARCH_LIST_ACTION(null, [])],
        },
        {
            it: 'should return ZENKO_CLIENT_APPEND_SEARCH_LIST action with right nextMarker',
            fn: actions.appendSearchListing('marker', []),
            expectedActions: [dispatchAction.ZENKO_CLIENT_APPEND_SEARCH_LIST_ACTION('marker', [])],
        },
        {
            it: 'should return ZENKO_CLIENT_APPEND_SEARCH_LIST action with right list',
            fn: actions.appendSearchListing(null, ['test']),
            expectedActions: [dispatchAction.ZENKO_CLIENT_APPEND_SEARCH_LIST_ACTION(null, ['test'])],
        },
    ];

    syncTests.forEach(testActionFunction);

    const asyncTests = [
        {
            it: 'newSearchListing: should return expected actions',
            fn: actions.newSearchListing(BUCKET_NAME, QUERYSTRING),
            storeState: initState,
            expectedActions: [
                startingSearchNetworkAction,
                dispatchAction.ZENKO_CLEAR_ERROR_ACTION(),
                searchingObjectsNetworkAction,
                dispatchAction.ZENKO_CLIENT_WRITE_SEARCH_LIST_ACTION(null, []),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'newSearchListing: should return expected actions when an error occurs',
            fn: actions.newSearchListing(BUCKET_NAME, QUERYSTRING),
            storeState: errorZenkoState(),
            expectedActions: [
                startingSearchNetworkAction,
                dispatchAction.ZENKO_CLEAR_ERROR_ACTION(),
                searchingObjectsNetworkAction,
                dispatchAction.ZENKO_HANDLE_ERROR_ACTION(ZENKO_ERROR, null, null),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'continueSearchListing: should return expected actions',
            fn: actions.continueSearchListing(BUCKET_NAME, QUERYSTRING),
            storeState: initState,
            expectedActions: [
                continueSearchNetworkAction,
                dispatchAction.ZENKO_CLEAR_ERROR_ACTION(),
                searchingObjectsNetworkAction,
                dispatchAction.ZENKO_CLIENT_APPEND_SEARCH_LIST_ACTION(null, []),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'continueSearchListing: should return expected actions when an error occurs',
            fn: actions.continueSearchListing(BUCKET_NAME, QUERYSTRING),
            storeState: errorZenkoState(),
            expectedActions: [
                continueSearchNetworkAction,
                dispatchAction.ZENKO_CLEAR_ERROR_ACTION(),
                searchingObjectsNetworkAction,
                dispatchAction.ZENKO_HANDLE_ERROR_ACTION(ZENKO_ERROR, null, null),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
