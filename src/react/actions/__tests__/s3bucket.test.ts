import * as actions from '../s3bucket';
import * as dispatchAction from './utils/dispatchActionsList';
import {
  AWS_CLIENT_ERROR_MSG,
  BUCKET_INFO_RESPONSE,
  BUCKET_NAME,
  errorZenkoState,
  initState,
  testActionFunction,
  testDispatchFunction,
} from './utils/testUtil';
const getBucketInfoNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Getting bucket information',
);
const toggleBucketVersioningNetworkAction =
  dispatchAction.NETWORK_START_ACTION('Versioning bucket');
const editDefaultRetentionNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Editing bucket default retention',
);
// FIXME: To be deleted, just keep for reference for now
describe.skip('s3bucket actions', () => {
  const syncTests = [
    {
      it: 'should return OPEN_BUCKET_DELETE_DIALOG action and bucket name',
      fn: actions.openBucketDeleteDialog(BUCKET_NAME),
      expectedActions: [
        dispatchAction.OPEN_BUCKET_DELETE_DIALOG_ACTION(BUCKET_NAME),
      ],
    },
    {
      it: 'should return CLOSE_BUCKET_DELETE_DIALOG action',
      fn: actions.closeBucketDeleteDialog(),
      expectedActions: [dispatchAction.CLOSE_BUCKET_DELETE_DIALOG_ACTION],
    },
    {
      it: 'should return GET_BUCKET_INFO_SUCCESS action',
      fn: actions.getBucketInfoSuccess(BUCKET_INFO_RESPONSE),
      expectedActions: [dispatchAction.GET_BUCKET_INFO_SUCCESS_ACTION],
    },
  ];
  syncTests.forEach(testActionFunction);
  const asyncTests = [
    {
      it: 'getBucketInfo: should get bucket information',
      fn: actions.getBucketInfo(BUCKET_NAME),
      storeState: initState,
      expectedActions: [
        getBucketInfoNetworkAction,
        dispatchAction.GET_BUCKET_INFO_SUCCESS_ACTION,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'getBucketInfo: should handle error',
      fn: actions.getBucketInfo(BUCKET_NAME),
      storeState: errorZenkoState(),
      expectedActions: [
        getBucketInfoNetworkAction,
        dispatchAction.HANDLE_ERROR_SPEC_ACTION(AWS_CLIENT_ERROR_MSG),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'toggleBucketVersioning: should toggle versioning bucket',
      fn: actions.toggleBucketVersioning(BUCKET_NAME, true),
      storeState: initState,
      expectedActions: [
        toggleBucketVersioningNetworkAction,
        getBucketInfoNetworkAction,
        dispatchAction.GET_BUCKET_INFO_SUCCESS_ACTION,
        dispatchAction.NETWORK_END_ACTION,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'toggleBucketVersioning: should handle error',
      fn: actions.toggleBucketVersioning(BUCKET_NAME, true),
      storeState: errorZenkoState(),
      expectedActions: [
        toggleBucketVersioningNetworkAction,
        dispatchAction.HANDLE_ERROR_MODAL_ACTION(AWS_CLIENT_ERROR_MSG),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'editDefaultRetention: should edit the default retention',
      fn: actions.editDefaultRetention(BUCKET_NAME, {
        isDefaultRetentionEnabled: false,
      }),
      storeState: initState,
      expectedActions: [
        editDefaultRetentionNetworkAction,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'editDefaultRetention: should handle error',
      fn: actions.editDefaultRetention(BUCKET_NAME, {
        isDefaultRetentionEnabled: false,
      }),
      storeState: errorZenkoState(),
      expectedActions: [
        editDefaultRetentionNetworkAction,
        dispatchAction.HANDLE_ERROR_SPEC_ACTION(AWS_CLIENT_ERROR_MSG),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
  ];
  asyncTests.forEach(testDispatchFunction);
});
