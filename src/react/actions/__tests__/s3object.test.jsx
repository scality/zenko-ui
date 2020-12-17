import * as actions from '../s3object';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    BUCKET_NAME, COMMON_PREFIX,
    FILE, FOLDER_NAME,
    INFO,
    NEXT_CONTINUATION_TOKEN,
    OBJECT_KEY,
    OBJECT_KEY2,
    PREFIX,
    S3_OBJECT,
    SYSTEM_METADATA,
    TAGS,
    USER_METADATA,
    errorZenkoState,
    initState,
    testActionFunction,
    testDispatchFunction,
} from './utils/testUtil';

const createFolderNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating folder');
const listObjectsNetworkAction = dispatchAction.NETWORK_START_ACTION('Fetching objects');
const uploadObjectsNetworkAction = dispatchAction.NETWORK_START_ACTION('Uploading object(s)');
const deleteFilesNetworkAction = dispatchAction.NETWORK_START_ACTION('Deleting object(s)');
const gettingObjectMetadataNetworkAction = dispatchAction.NETWORK_START_ACTION('Getting object metadata');
const gettingObjectTagsNetworkAction = dispatchAction.NETWORK_START_ACTION('Getting object tags');

describe('s3object actions', () => {
    const syncTests = [
        {
            it: 'should return LIST_OBJECTS_SUCCESS action -> test without prefix parameter',
            fn: actions.listObjectsSuccess([S3_OBJECT], [COMMON_PREFIX], '', NEXT_CONTINUATION_TOKEN),
            expectedActions: [dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], '', NEXT_CONTINUATION_TOKEN)],
        },
        {
            it: 'should return LIST_OBJECTS_SUCCESS action -> test with prefix parameter',
            fn: actions.listObjectsSuccess([S3_OBJECT], [COMMON_PREFIX], PREFIX, NEXT_CONTINUATION_TOKEN),
            expectedActions: [dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX, NEXT_CONTINUATION_TOKEN)],
        },
        {
            it: 'should return OPEN_FOLDER_CREATE_MODAL action',
            fn: actions.openFolderCreateModal(),
            expectedActions: [dispatchAction.OPEN_FOLDER_CREATE_MODAL_ACTION()],
        },
        {
            it: 'should return CLOSE_FOLDER_CREATE_MODAL action',
            fn: actions.closeFolderCreateModal(),
            expectedActions: [dispatchAction.CLOSE_FOLDER_CREATE_MODAL_ACTION()],
        },
        {
            it: 'should return OPEN_OBJECT_UPLOAD_MODAL action',
            fn: actions.openObjectUploadModal(),
            expectedActions: [dispatchAction.OPEN_OBJECT_UPLOAD_MODAL_ACTION()],
        },
        {
            it: 'should return CLOSE_OBJECT_UPLOAD_MODAL action',
            fn: actions.closeObjectUploadModal(),
            expectedActions: [dispatchAction.CLOSE_OBJECT_UPLOAD_MODAL_ACTION()],
        },
        {
            it: 'should return OPEN_OBJECT_DELETE_MODAL action',
            fn: actions.openObjectDeleteModal(),
            expectedActions: [dispatchAction.OPEN_OBJECT_DELETE_MODAL_ACTION()],
        },
        {
            it: 'should return CLOSE_OBJECT_DELETE_MODAL action',
            fn: actions.closeObjectDeleteModal(),
            expectedActions: [dispatchAction.CLOSE_OBJECT_DELETE_MODAL_ACTION()],
        },
        {
            it: 'should return TOGGLE_OBJECT action -> test without objectKey parameter',
            fn: actions.toggleObject(''),
            expectedActions: [dispatchAction.TOGGLE_OBJECT_ACTION('')],
        },
        {
            it: 'should return TOGGLE_OBJECT action -> test with objectKey parameter',
            fn: actions.toggleObject('test'),
            expectedActions: [dispatchAction.TOGGLE_OBJECT_ACTION('test')],
        },
        {
            it: 'should return TOGGLE_ALL_OBJECTS action -> test with toggled parameter set to false',
            fn: actions.toggleAllObjects(false),
            expectedActions: [dispatchAction.TOGGLE_ALL_OBJECTS_ACTION(false)],
        },
        {
            it: 'should return TOGGLE_ALL_OBJECTS action -> test with toggled parameter set to true',
            fn: actions.toggleAllObjects(true),
            expectedActions: [dispatchAction.TOGGLE_ALL_OBJECTS_ACTION(true)],
        },
        {
            it: 'should return RESET_OBJECT_METADATA action',
            fn: actions.resetObjectMetadata(),
            expectedActions: [dispatchAction.RESET_OBJECT_METADATA_ACTION()],
        },
        {
            it: 'should return GET_OBJECT_METADATA_SUCCESS action',
            fn: actions.getObjectMetadataSuccess(BUCKET_NAME, OBJECT_KEY, INFO, TAGS),
            expectedActions: [dispatchAction.GET_OBJECT_METADATA_SUCCESS_ACTION(BUCKET_NAME, OBJECT_KEY, INFO, TAGS)],
        },
    ];

    syncTests.forEach(testActionFunction);

    const asyncTests = [
        {
            it: 'createFolder: should return expected actions -> test without prefix parameter',
            fn: actions.createFolder(BUCKET_NAME, '', FOLDER_NAME),
            storeState: initState,
            expectedActions: [
                createFolderNetworkAction,
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], '', NEXT_CONTINUATION_TOKEN),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_FOLDER_CREATE_MODAL_ACTION(),
            ],
        },
        {
            it: 'createFolder: should return expected actions -> test with prefix parameter',
            fn: actions.createFolder(BUCKET_NAME, PREFIX, FOLDER_NAME),
            storeState: initState,
            expectedActions: [
                createFolderNetworkAction,
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX, NEXT_CONTINUATION_TOKEN),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_FOLDER_CREATE_MODAL_ACTION(),
            ],
        },
        {
            it: 'createFolder: should handle error -> test without prefix parameter',
            fn: actions.createFolder(BUCKET_NAME, '', FOLDER_NAME),
            storeState: errorZenkoState(),
            expectedActions: [
                createFolderNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_FOLDER_CREATE_MODAL_ACTION(),
            ],
        },
        {
            it: 'createFolder: should handle error -> test with prefix parameter',
            fn: actions.createFolder(BUCKET_NAME, PREFIX, FOLDER_NAME),
            storeState: errorZenkoState(),
            expectedActions: [
                createFolderNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.CLOSE_FOLDER_CREATE_MODAL_ACTION(),
            ],
        },
        {
            it: 'uploadFiles: should return expected actions -> test without prefix parameter',
            fn: actions.uploadFiles(BUCKET_NAME, '', [FILE]),
            storeState: initState,
            expectedActions: [
                dispatchAction.CLOSE_OBJECT_UPLOAD_MODAL_ACTION(),
                uploadObjectsNetworkAction,
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], '', NEXT_CONTINUATION_TOKEN),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'uploadFiles: should return expected actions -> test with prefix parameter',
            fn: actions.uploadFiles(BUCKET_NAME, PREFIX, [FILE]),
            storeState: initState,
            expectedActions: [
                dispatchAction.CLOSE_OBJECT_UPLOAD_MODAL_ACTION(),
                uploadObjectsNetworkAction,
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX, NEXT_CONTINUATION_TOKEN),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'uploadFiles: should handle error -> test without prefix parameter',
            fn: actions.uploadFiles(BUCKET_NAME, '', FOLDER_NAME),
            storeState: errorZenkoState(),
            expectedActions: [
                dispatchAction.CLOSE_OBJECT_UPLOAD_MODAL_ACTION(),
                uploadObjectsNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'uploadFiles: should handle error -> test with prefix parameter',
            fn: actions.uploadFiles(BUCKET_NAME, PREFIX, FOLDER_NAME),
            storeState: errorZenkoState(),
            expectedActions: [
                dispatchAction.CLOSE_OBJECT_UPLOAD_MODAL_ACTION(),
                uploadObjectsNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'listObjects: should return expected actions -> test without prefix parameter',
            fn: actions.listObjects(BUCKET_NAME, ''),
            storeState: initState,
            expectedActions: [
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], '', NEXT_CONTINUATION_TOKEN),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'listObjects: should return expected actions -> test with prefix parameter',
            fn: actions.listObjects(BUCKET_NAME, PREFIX),
            storeState: initState,
            expectedActions: [
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX, NEXT_CONTINUATION_TOKEN),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'listObjects: should handle error -> test without prefix parameter',
            fn: actions.listObjects(BUCKET_NAME, ''),
            storeState: errorZenkoState(),
            expectedActions: [
                listObjectsNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'listObjects: should handle error -> test with prefix parameter',
            fn: actions.listObjects(BUCKET_NAME, PREFIX),
            storeState: errorZenkoState(),
            expectedActions: [
                listObjectsNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'deleteFiles: should return expected actions -> test without prefix parameter',
            fn: actions.deleteFiles(BUCKET_NAME, '', [S3_OBJECT]),
            storeState: initState,
            expectedActions: [
                dispatchAction.CLOSE_OBJECT_DELETE_MODAL_ACTION(),
                deleteFilesNetworkAction,
                dispatchAction.NETWORK_END_ACTION,
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], '', NEXT_CONTINUATION_TOKEN),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'deleteFiles: should return expected actions -> test with prefix parameter',
            fn: actions.deleteFiles(BUCKET_NAME, PREFIX, [S3_OBJECT]),
            storeState: initState,
            expectedActions: [
                dispatchAction.CLOSE_OBJECT_DELETE_MODAL_ACTION(),
                deleteFilesNetworkAction,
                dispatchAction.NETWORK_END_ACTION,
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX, NEXT_CONTINUATION_TOKEN),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'deleteFiles: should handle error -> test without prefix parameter',
            fn: actions.deleteFiles(BUCKET_NAME, '', [S3_OBJECT]),
            storeState: errorZenkoState(),
            expectedActions: [
                dispatchAction.CLOSE_OBJECT_DELETE_MODAL_ACTION(),
                deleteFilesNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
                listObjectsNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'deleteFiles: should handle error -> test with prefix parameter',
            fn: actions.deleteFiles(BUCKET_NAME, PREFIX, [S3_OBJECT]),
            storeState: errorZenkoState(),
            expectedActions: [
                dispatchAction.CLOSE_OBJECT_DELETE_MODAL_ACTION(),
                deleteFilesNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
                listObjectsNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'getObjectMetadata: should return expected actions',
            fn: actions.getObjectMetadata(BUCKET_NAME, OBJECT_KEY2),
            storeState: initState,
            expectedActions: [
                gettingObjectMetadataNetworkAction,
                dispatchAction.GET_OBJECT_METADATA_SUCCESS_ACTION(BUCKET_NAME, OBJECT_KEY2, INFO, TAGS),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'getObjectMetadata: should handle error -> test without prefix parameter',
            fn: actions.getObjectMetadata(BUCKET_NAME, '', OBJECT_KEY),
            storeState: errorZenkoState(),
            expectedActions: [
                gettingObjectMetadataNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'getObjectMetadata: should handle error -> test with prefix parameter',
            fn: actions.getObjectMetadata(BUCKET_NAME, PREFIX, OBJECT_KEY),
            storeState: errorZenkoState(),
            expectedActions: [
                gettingObjectMetadataNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'putObjectMetadata: should return expected actions ',
            fn: actions.putObjectMetadata(BUCKET_NAME, OBJECT_KEY, SYSTEM_METADATA, USER_METADATA),
            storeState: initState,
            expectedActions: [
                gettingObjectMetadataNetworkAction,
                gettingObjectMetadataNetworkAction,
                dispatchAction.GET_OBJECT_METADATA_SUCCESS_ACTION(BUCKET_NAME, OBJECT_KEY, INFO, []),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'putObjectMetadata: should handle error',
            fn: actions.putObjectMetadata(BUCKET_NAME, OBJECT_KEY, SYSTEM_METADATA, USER_METADATA),
            storeState: errorZenkoState(),
            expectedActions: [
                gettingObjectMetadataNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'putObjectTagging: should return expected actions -> test with no tag',
            fn: actions.putObjectTagging(BUCKET_NAME, OBJECT_KEY, []),
            storeState: initState,
            expectedActions: [
                gettingObjectTagsNetworkAction,
                gettingObjectMetadataNetworkAction,
                dispatchAction.GET_OBJECT_METADATA_SUCCESS_ACTION(BUCKET_NAME, OBJECT_KEY, INFO, []),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'putObjectTagging: should return expected actions -> test with tags',
            fn: actions.putObjectTagging(BUCKET_NAME, OBJECT_KEY2, TAGS),
            storeState: initState,
            expectedActions: [
                gettingObjectTagsNetworkAction,
                gettingObjectMetadataNetworkAction,
                dispatchAction.GET_OBJECT_METADATA_SUCCESS_ACTION(BUCKET_NAME, OBJECT_KEY2, INFO, TAGS),
                dispatchAction.NETWORK_END_ACTION,
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'putObjectTagging: should handle error',
            fn: actions.putObjectTagging(BUCKET_NAME, OBJECT_KEY, []),
            storeState: errorZenkoState(),
            expectedActions: [
                gettingObjectTagsNetworkAction,
                dispatchAction.HANDLE_ERROR_MODAL_ACTION('S3 Client Api Error Response'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
