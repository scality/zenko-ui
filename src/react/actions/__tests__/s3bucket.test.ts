import * as actions from '../s3bucket';
import * as dispatchAction from './utils/dispatchActionsList';
import {
  AWS_CLIENT_ERROR_MSG,
  BUCKET_INFO_RESPONSE,
  BUCKET_NAME,
  OWNER_NAME,
  errorZenkoState,
  initState,
  testActionFunction,
  testDispatchAWSErrorTestFn,
  testDispatchFunction,
} from './utils/testUtil';
const createBucketNetworkAction =
  dispatchAction.NETWORK_START_ACTION('Creating bucket');
const listBucketsNetworkAction =
  dispatchAction.NETWORK_START_ACTION('Listing buckets');
const deleteBucketNetworkAction =
  dispatchAction.NETWORK_START_ACTION('Deleting bucket');
const getBucketInfoNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Getting bucket information',
);
const toggleBucketVersioningNetworkAction =
  dispatchAction.NETWORK_START_ACTION('Versioning bucket');
const editDefaultRetentionNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Editing bucket default retention',
);
const listBucketsActions = [
  listBucketsNetworkAction,
  dispatchAction.LIST_BUCKETS_SUCCESS_ACTION([], OWNER_NAME),
  dispatchAction.NETWORK_END_ACTION,
];
describe('s3bucket actions', () => {
  const syncTests = [
    {
      it: 'should return LIST_BUCKETS_SUCCESS action',
      fn: actions.listBucketsSuccess([], OWNER_NAME),
      expectedActions: [
        dispatchAction.LIST_BUCKETS_SUCCESS_ACTION([], OWNER_NAME),
      ],
    },
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
      it: 'createBucket: should return expected actions',
      fn: actions.createBucket(
        {
          name: BUCKET_NAME,
          locationConstraint: {
            value: 'us-east-1',
          },
          isObjectLockEnabled: false,
        },
        {
          isVersioning: false,
        },
      ),
      storeState: initState,
      expectedActions: [
        createBucketNetworkAction,
        dispatchAction.LOCATION_PUSH_ACTION('/buckets'),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'createBucket: should handle error',
      fn: actions.createBucket(
        {
          name: BUCKET_NAME,
          locationConstraint: {
            value: 'us-east-1',
          },
          isObjectLockEnabled: false,
        },
        {
          isVersioning: false,
        },
      ),
      storeState: errorZenkoState(),
      expectedActions: [
        createBucketNetworkAction,
        dispatchAction.HANDLE_ERROR_SPEC_ACTION(AWS_CLIENT_ERROR_MSG),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'listBuckets: should return list of buckets',
      fn: actions.listBuckets(),
      storeState: initState,
      expectedActions: listBucketsActions,
    },
    {
      it: 'deleteBucket: should delete bucket',
      fn: actions.deleteBucket(BUCKET_NAME),
      storeState: initState,
      expectedActions: [
        deleteBucketNetworkAction,
        dispatchAction.LOCATION_PUSH_ACTION('/buckets'),
        dispatchAction.NETWORK_END_ACTION,
        dispatchAction.CLOSE_BUCKET_DELETE_DIALOG_ACTION,
      ],
    },
    {
      it: 'deleteBucket: should handle error',
      fn: actions.deleteBucket(BUCKET_NAME),
      storeState: errorZenkoState(),
      expectedActions: [
        deleteBucketNetworkAction,
        dispatchAction.HANDLE_ERROR_MODAL_ACTION(AWS_CLIENT_ERROR_MSG),
        dispatchAction.NETWORK_END_ACTION,
        dispatchAction.CLOSE_BUCKET_DELETE_DIALOG_ACTION,
      ],
    },
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
        dispatchAction.LOCATION_PUSH_ACTION('/buckets'),
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
  testDispatchAWSErrorTestFn(
    {
      message: AWS_CLIENT_ERROR_MSG,
    },
    {
      it: 'listBuckets: should handle error',
      fn: actions.listBuckets(),
      storeState: errorZenkoState(),
      expectedActions: [
        listBucketsNetworkAction,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
  );
});
