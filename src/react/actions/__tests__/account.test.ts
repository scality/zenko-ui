import * as actions from '../account';
import * as dispatchAction from './utils/dispatchActionsList';
import {
  ACCOUNT,
  ACCOUNT_ACCESS_KEY,
  ACCOUNT_ACCESS_KEYS,
  ACCOUNT_NAME,
  ACCOUNT_SECRET_KEY,
  AWS_CLIENT_ERROR,
  AWS_CLIENT_ERROR_MSG,
  authenticatedUserState,
  errorManagementState,
  initState,
  testActionFunction,
  testDispatchFunction,
} from './utils/testUtil';
import { ErrorMockIAMClient, MockIAMClient } from '../../../js/mock/IAMClient';
import { getAssumeRoleWithWebIdentityIAM } from '../../../js/IAMClient';
import { QueryClient } from 'react-query';
const createAccountNetworkAction =
  dispatchAction.NETWORK_START_ACTION('Creating account');
const deleteAccountNetworkAction =
  dispatchAction.NETWORK_START_ACTION('Deleting account');
const createAccountAccessKeyNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Creating Root user Access keys',
);
const listAccountAccessKeysNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Listing Root user Access keys',
);
const deleteAccountAccessKeyNetworkAction = dispatchAction.NETWORK_START_ACTION(
  'Deleting Root user Access keys',
);
const listAccountAccessKeysActions = [
  listAccountAccessKeysNetworkAction,
  dispatchAction.LIST_ACCOUNT_ACCESS_KEY_SUCCESS_ACTION,
  dispatchAction.NETWORK_END_ACTION,
];
jest.mock('../../../js/IAMClient', () => {
  const module = jest.requireActual('../../../js/IAMClient');
  module.getAssumeRoleWithWebIdentityIAM = jest.fn();
  return module;
});
const queryClient = new QueryClient();
describe('account actions', () => {
  const syncTests = [
    {
      it: 'should return OPEN_ACCOUNT_DELETE_DIALOG action',
      fn: actions.openAccountDeleteDialog(),
      expectedActions: [dispatchAction.OPEN_ACCOUNT_DELETE_DIALOG_ACTION],
    },
    {
      it: 'should return CLOSE_ACCOUNT_DELETE_DIALOG action',
      fn: actions.closeAccountDeleteDialog(),
      expectedActions: [dispatchAction.CLOSE_ACCOUNT_DELETE_DIALOG_ACTION],
    },
    {
      it: 'should return SELECT_ACCOUNT action',
      fn: actions.selectAccount(ACCOUNT),
      expectedActions: [dispatchAction.SELECT_ACCOUNT_ACTION],
    },
    {
      it: 'should return LIST_ACCOUNT_ACCESS_KEY_SUCCESS action',
      fn: actions.listAccountAccessKeySuccess(ACCOUNT_ACCESS_KEYS),
      expectedActions: [dispatchAction.LIST_ACCOUNT_ACCESS_KEY_SUCCESS_ACTION],
    },
    {
      it: 'should return ADD_ACCOUNT_SECRET action',
      fn: actions.addAccountSecret(
        ACCOUNT_NAME,
        ACCOUNT_ACCESS_KEY,
        ACCOUNT_SECRET_KEY,
      ),
      expectedActions: [dispatchAction.ADD_ACCOUNT_SECRET_ACTION],
    },
    {
      it: 'should return DELETE_ACCOUNT_SECRET action',
      fn: actions.deleteAccountSecret(),
      expectedActions: [dispatchAction.DELETE_ACCOUNT_SECRET_ACTION],
    },
  ];
  syncTests.forEach(testActionFunction);
  const asyncTests = [
    {
      it: 'createAccount: should return expected actions',
      fn: actions.createAccount(
        {
          Name: 'bart',
          email: 'test@test.com',
        },
        queryClient,
      ),
      storeState: authenticatedUserState(),
      expectedActions: [
        createAccountNetworkAction,
        dispatchAction.CONFIGURATION_VERSION_ACTION,
        dispatchAction.LOCATION_PUSH_ACTION('/accounts/bart'),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'createAccount: should handle error',
      fn: actions.createAccount({
        Name: 'bart',
        email: 'test@test.com',
      }),
      storeState: errorManagementState(),
      expectedActions: [
        createAccountNetworkAction,
        dispatchAction.HANDLE_ERROR_SPEC_ACTION(
          'Management API Error Response',
        ),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'deleteAccount: should return expected actions',
      fn: actions.deleteAccount('bart', queryClient),
      storeState: initState,
      expectedActions: [
        deleteAccountNetworkAction,
        dispatchAction.CONFIGURATION_VERSION_ACTION,
        dispatchAction.LOCATION_PUSH_ACTION('/accounts'),
        dispatchAction.CLOSE_ACCOUNT_DELETE_DIALOG_ACTION,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'deleteAccount: should handle error',
      fn: actions.deleteAccount('bart'),
      storeState: errorManagementState(),
      expectedActions: [
        deleteAccountNetworkAction,
        dispatchAction.CLOSE_ACCOUNT_DELETE_DIALOG_ACTION,
        dispatchAction.HANDLE_ERROR_MODAL_ACTION(
          'Management API Error Response',
        ),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'createAccountAccessKey: should handle error',
      fn: actions.createAccountAccessKey(ACCOUNT_NAME),
      storeState: errorManagementState(),
      expectedActions: [
        createAccountAccessKeyNetworkAction,
        dispatchAction.HANDLE_ERROR_MODAL_ACTION(
          'Management API Error Response',
        ),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
  ];
  asyncTests.forEach(testDispatchFunction);
});
describe('account actions with mocked IAM client', () => {
  beforeEach(() => {
    getAssumeRoleWithWebIdentityIAM.mockImplementation(() =>
      Promise.resolve(new MockIAMClient()),
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  const asyncTests = [
    {
      it: 'listAccountAccessKeys: should return expected actions',
      fn: actions.listAccountAccessKeys('bart'),
      storeState: initState,
      expectedActions: listAccountAccessKeysActions,
    },
    {
      it: 'createAccountAccessKey: should return expected actions',
      fn: actions.createAccountAccessKey(ACCOUNT_NAME),
      storeState: initState,
      expectedActions: [
        createAccountAccessKeyNetworkAction,
        dispatchAction.ADD_ACCOUNT_SECRET_ACTION,
        ...listAccountAccessKeysActions,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'deleteAccountAccessKey: should return expected actions',
      fn: actions.deleteAccountAccessKey(ACCOUNT_NAME, ACCOUNT_ACCESS_KEY),
      storeState: initState,
      expectedActions: [
        deleteAccountAccessKeyNetworkAction,
        ...listAccountAccessKeysActions,
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
  ];
  asyncTests.forEach(testDispatchFunction);
});
describe('account actions with mocked failing IAM client', () => {
  beforeEach(() => {
    getAssumeRoleWithWebIdentityIAM.mockImplementation(() =>
      Promise.resolve(new ErrorMockIAMClient(AWS_CLIENT_ERROR)),
    );
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  const asyncTests = [
    {
      it: 'listAccountAccessKeys: should handle error',
      fn: actions.listAccountAccessKeys('bart'),
      storeState: initState,
      expectedActions: [
        listAccountAccessKeysNetworkAction,
        dispatchAction.HANDLE_ERROR_MODAL_ACTION(AWS_CLIENT_ERROR_MSG),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
    {
      it: 'deleteAccountAccessKey: should handle error',
      fn: actions.deleteAccountAccessKey(ACCOUNT_NAME, ACCOUNT_ACCESS_KEY),
      storeState: initState,
      expectedActions: [
        deleteAccountAccessKeyNetworkAction,
        dispatchAction.HANDLE_ERROR_MODAL_ACTION(AWS_CLIENT_ERROR_MSG),
        dispatchAction.NETWORK_END_ACTION,
      ],
    },
  ];
  asyncTests.forEach(testDispatchFunction);
});
