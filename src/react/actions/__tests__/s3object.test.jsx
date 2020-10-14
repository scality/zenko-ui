import * as actions from '../s3object';
import * as dispatchAction from './utils/dispatchActionsList';
import {
    BUCKET_NAME, COMMON_PREFIX,
    FILE, FOLDER_NAME,
    PREFIX, S3_OBJECT,
    errorZenkoState,
    initState, testActionFunction, testDispatchFunction,
} from './utils/testUtil';

const createFolderNetworkAction = dispatchAction.NETWORK_START_ACTION('Creating folder');
const listObjectsNetworkAction = dispatchAction.NETWORK_START_ACTION('Listing objects');
const uploadObjectsNetworkAction = dispatchAction.NETWORK_START_ACTION('Uploading object(s)');
const deleteFilesNetworkAction = dispatchAction.NETWORK_START_ACTION('Deleting object(s)');

describe('s3object actions', () => {
    const syncTests = [
        {
            it: 'should return LIST_OBJECTS_SUCCESS action -> test without prefix parameter',
            fn: actions.listObjectsSuccess([S3_OBJECT], [COMMON_PREFIX], ''),
            expectedActions: [dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], '')],
        },
        {
            it: 'should return LIST_OBJECTS_SUCCESS action -> test with prefix parameter',
            fn: actions.listObjectsSuccess([S3_OBJECT], [COMMON_PREFIX], PREFIX),
            expectedActions: [dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX)],
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
            it: 'should return TOGGLE_OBJECT action -> test without objectName parameter',
            fn: actions.toggleObject(''),
            expectedActions: [dispatchAction.TOGGLE_OBJECT_ACTION('')],
        },
        {
            it: 'should return TOGGLE_OBJECT action -> test with objectName parameter',
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
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], ''),
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
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX),
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
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
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
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
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
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], ''),
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
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX),
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
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
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
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'listObjects: should return expected actions -> test without prefix parameter',
            fn: actions.listObjects(BUCKET_NAME, ''),
            storeState: initState,
            expectedActions: [
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], ''),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'listObjects: should return expected actions -> test with prefix parameter',
            fn: actions.listObjects(BUCKET_NAME, PREFIX),
            storeState: initState,
            expectedActions: [
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'listObjects: should handle error -> test without prefix parameter',
            fn: actions.listObjects(BUCKET_NAME, ''),
            storeState: errorZenkoState(),
            expectedActions: [
                listObjectsNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
        {
            it: 'listObjects: should handle error -> test with prefix parameter',
            fn: actions.listObjects(BUCKET_NAME, PREFIX),
            storeState: errorZenkoState(),
            expectedActions: [
                listObjectsNetworkAction,
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
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
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], ''),
                dispatchAction.NETWORK_END_ACTION,
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
                listObjectsNetworkAction,
                dispatchAction.LIST_OBJECTS_SUCCESS_ACTION([S3_OBJECT], [COMMON_PREFIX], PREFIX),
                dispatchAction.NETWORK_END_ACTION,
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
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
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
                dispatchAction.HANDLE_ERROR_SPEC_ACTION('The server is temporarily unavailable.'),
                dispatchAction.NETWORK_END_ACTION,
            ],
        },
    ];

    asyncTests.forEach(testDispatchFunction);
});
