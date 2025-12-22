// @noflow
import { AuthState, ErrorsUIState, NetworkActivityState } from '../../types/state';

import { MockManagementClient } from '../../js/mock/managementClient';
import { MockSTSClient } from '../../js/mock/STSClient';

export const initialAuthState: AuthState = {
  isConfigLoaded: false,
  isClientsLoaded: false,
  configFailure: false,
  stsClient: new MockSTSClient(),
  //@ts-expect-error fix this when you are working on it
  managementClient: new MockManagementClient(),
  //@ts-expect-error fix this when you are working on it
  config: { features: [] },
  selectedAccount: null,
};

export const initialErrorsUIState: ErrorsUIState = {
  errorMsg: null,
  errorType: null,
};
export const initialInstancesState = {};
export const initialEndpointsUIState = {
  showDelete: '',
};
export const initialNetworkActivityState: NetworkActivityState = {
  authFailure: false,
};
export const initialFullState = {
  auth: initialAuthState,
  instances: initialInstancesState,
  networkActivity: initialNetworkActivityState,
  uiErrors: initialErrorsUIState,
};
