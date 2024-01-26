import * as actions from '../auth';
import * as dispatchAction from './utils/dispatchActionsList';
import {
  APP_CONFIG,
  INSTANCE_ID,
  LOGOUT_MOCK,
  initState,
  testActionFunction,
  testDispatchFunction,
} from './utils/testUtil';
import { MockManagementClient } from '../../../js/mock/managementClient';
import { MockSTSClient } from '../../../js/mock/STSClient';

// FIXME: To be deleted, just keep for reference for now
describe.skip('auth actions', () => {
  const syncTests = [
    {
      it: 'should return SET_MANAGEMENT_CLIENT action',
      //@ts-expect-error fix this when you are working on it
      fn: actions.setManagementClient(new MockManagementClient()),
      expectedActions: [dispatchAction.SET_MANAGEMENT_CLIENT_ACTION],
    },
    {
      it: 'should return SET_STS_CLIENT action',
      fn: actions.setSTSClient(new MockSTSClient()),
      expectedActions: [dispatchAction.SET_STS_CLIENT_ACTION],
    },
    {
      it: 'should return SET_APP_CONFIG action',
      //@ts-expect-error fix this when you are working on it
      fn: actions.setAppConfig(APP_CONFIG),
      expectedActions: [dispatchAction.SET_APP_CONFIG_ACTION],
    },
    {
      it: 'should return SELECT_INSTANCE action',
      fn: actions.selectInstance(INSTANCE_ID),
      expectedActions: [dispatchAction.SELECT_INSTANCE_ACTION],
    },
    {
      it: 'should return LOAD_CONFIG_SUCCESS action',
      fn: actions.loadConfigSuccess(),
      expectedActions: [dispatchAction.LOAD_CONFIG_SUCCESS_ACTION],
    },
    {
      it: 'should return LOAD_CLIENTS_SUCCESS action',
      fn: actions.loadClientsSuccess(),
      expectedActions: [dispatchAction.LOAD_CLIENTS_SUCCESS_ACTION],
    },
    {
      it: 'should return CONFIG_AUTH_FAILURE action',
      fn: actions.configAuthFailure(),
      expectedActions: [dispatchAction.CONFIG_AUTH_FAILURE_ACTION],
    },
    {
      it: 'should return SET_OIDC_LOGOUT action',
      fn: actions.setOIDCLogout(LOGOUT_MOCK),
      expectedActions: [dispatchAction.SET_OIDC_LOGOUT_ACTION],
    },
  ];
  //@ts-expect-error fix this when you are working on it
  syncTests.forEach(testActionFunction);
  const asyncTests = [
    {
      it: 'loadClients: should handle error if user is not authenticated',
      fn: actions.loadClients(),
      storeState: initState,
      expectedActions: [
        dispatchAction.HANDLE_ERROR_AUTH_ACTION(
          'missing the "instanceIds" claim in ID token',
        ),
        dispatchAction.NETWORK_AUTH_FAILURE_ACTION,
      ],
    },
  ];
  asyncTests.forEach(testDispatchFunction);
});
