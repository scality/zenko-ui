import * as actions from '../zenko';
import * as dispatchAction from './utils/dispatchActionsList';
import {
  SITE,
  AWS_CLIENT_ERROR,
  AWS_CLIENT_ERROR_MSG,
  BUCKET_NAME,
  addNextMarkerToState,
  errorZenkoState,
  initState,
  storeStateWithIngestion,
  testActionFunction,
  testDispatchFunction,
} from './utils/testUtil';
import {
  NETWORK_START_ACTION_CONTINUE_SEARCH,
  NETWORK_START_ACTION_SEARCHING_OBJECTS,
  NETWORK_START_ACTION_STARTING_SEARCH,
} from '../zenko';
import { MockZenkoClient } from '../../../js/mock/ZenkoClient';

const startingSearchNetworkAction = dispatchAction.NETWORK_START_ACTION(
  NETWORK_START_ACTION_STARTING_SEARCH,
);
const searchingObjectsNetworkAction = dispatchAction.NETWORK_START_ACTION(
  NETWORK_START_ACTION_SEARCHING_OBJECTS,
);
const continueSearchNetworkAction = dispatchAction.NETWORK_START_ACTION(
  NETWORK_START_ACTION_CONTINUE_SEARCH,
);
const pauseIngestionSiteNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Pausing Async Metadata updates',
);

describe('zenko actions', () => {
  const QUERYSTRING = 'querystring';
  const LIST = [
    {
      Key: 'toto/object1',
      LastModified: 'Wed Oct 17 2020 10:35:57',
      ETag: 'af4a08eac69ced858c99caee22978773',
      Size: 42,
      IsFolder: false,
      lastModified: 'Wed Oct 17 2020 10:35:57',
      SignedUrl: '',
    },
  ];
  const mock = new MockZenkoClient();
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
      fn: actions.zenkoHandleError(AWS_CLIENT_ERROR, null, null),
      expectedActions: [
        dispatchAction.ZENKO_HANDLE_ERROR_ACTION(AWS_CLIENT_ERROR, null, null),
      ],
    },
    {
      it: 'should return ZENKO_HANDLE_ERROR action with right target',
      fn: actions.zenkoHandleError(AWS_CLIENT_ERROR, 'target', null),
      expectedActions: [
        dispatchAction.ZENKO_HANDLE_ERROR_ACTION(
          AWS_CLIENT_ERROR,
          'target',
          null,
        ),
      ],
    },
    {
      it: 'should return ZENKO_HANDLE_ERROR action with right type',
      fn: actions.zenkoHandleError(AWS_CLIENT_ERROR, null, 'type'),
      expectedActions: [
        dispatchAction.ZENKO_HANDLE_ERROR_ACTION(
          AWS_CLIENT_ERROR,
          null,
          'type',
        ),
      ],
    },
    {
      it: 'should return ZENKO_CLIENT_WRITE_SEARCHLIST action',
      fn: actions.writeSearchListing(null, []),
      expectedActions: [
        dispatchAction.ZENKO_CLIENT_WRITE_SEARCH_LIST_ACTION(null, []),
      ],
    },
    {
      it:
        'should return ZENKO_CLIENT_WRITE_SEARCHLIST action with right nextMarker',
      fn: actions.writeSearchListing('marker', []),
      expectedActions: [
        dispatchAction.ZENKO_CLIENT_WRITE_SEARCH_LIST_ACTION('marker', []),
      ],
    },
    {
      it: 'should return ZENKO_CLIENT_WRITE_SEARCHLIST action with right list',
      fn: actions.writeSearchListing(null, LIST),
      expectedActions: [
        dispatchAction.ZENKO_CLIENT_WRITE_SEARCH_LIST_ACTION(null, LIST),
      ],
    },
    {
      it: 'should return ZENKO_CLIENT_APPEND_SEARCH_LIST action',
      fn: actions.appendSearchListing(null, []),
      expectedActions: [
        dispatchAction.ZENKO_CLIENT_APPEND_SEARCH_LIST_ACTION(null, []),
      ],
    },
    {
      it:
        'should return ZENKO_CLIENT_APPEND_SEARCH_LIST action with right nextMarker',
      fn: actions.appendSearchListing('marker', []),
      expectedActions: [
        dispatchAction.ZENKO_CLIENT_APPEND_SEARCH_LIST_ACTION('marker', []),
      ],
    },
    {
      it:
        'should return ZENKO_CLIENT_APPEND_SEARCH_LIST action with right list',
      fn: actions.appendSearchListing(null, LIST),
      expectedActions: [
        dispatchAction.ZENKO_CLIENT_APPEND_SEARCH_LIST_ACTION(null, LIST),
      ],
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
      it:
        'newSearchListing: should return expected actions when an error occurs',
      fn: actions.newSearchListing(BUCKET_NAME, QUERYSTRING),
      storeState: errorZenkoState(),
      expectedActions: [
        startingSearchNetworkAction,
        dispatchAction.ZENKO_CLEAR_ERROR_ACTION(),
        searchingObjectsNetworkAction,
        dispatchAction.ZENKO_HANDLE_ERROR_ACTION(AWS_CLIENT_ERROR, null, null),
        dispatchAction.NETWORK_END_ACTION,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'continueSearchListing: should return expected actions',
      fn: actions.continueSearchListing(BUCKET_NAME, QUERYSTRING),
      storeState: addNextMarkerToState(initState),
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
      it:
        'continueSearchListing: should return expected actions when an error occurs',
      fn: actions.continueSearchListing(BUCKET_NAME, QUERYSTRING),
      storeState: addNextMarkerToState(errorZenkoState()),
      expectedActions: [
        continueSearchNetworkAction,
        dispatchAction.ZENKO_CLEAR_ERROR_ACTION(),
        searchingObjectsNetworkAction,
        dispatchAction.ZENKO_HANDLE_ERROR_ACTION(AWS_CLIENT_ERROR, null, null),
        dispatchAction.NETWORK_END_ACTION,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'pauseIngestionSite: should return expected actions',
      fn: actions.pauseIngestionSite(SITE),
      storeState: storeStateWithIngestion('disabled'),
      expectedActions: [
        pauseIngestionSiteNetworkAction,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it:
        'pauseIngestionSite: should return expected actions when an error occurs',
      fn: actions.pauseIngestionSite(SITE),
      storeState: errorZenkoState(),
      expectedActions: [
        pauseIngestionSiteNetworkAction,
        dispatchAction.HANDLE_ERROR_MODAL_ACTION(AWS_CLIENT_ERROR_MSG),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
  ];

  asyncTests.forEach(testDispatchFunction);
});
