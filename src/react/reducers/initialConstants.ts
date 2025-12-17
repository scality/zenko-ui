// @noflow
import {
  AccountState,
  AuthState,
  ErrorsUIState,
  InstanceStatusState,
  NetworkActivityState,
} from '../../types/state';

import { List } from 'immutable';
import { MockManagementClient } from '../../js/mock/managementClient';
import { MockSTSClient } from '../../js/mock/STSClient';

export const initialAccountState: AccountState = {
  //@ts-expect-error fix this when you are working on it
  display: {},
  accessKeyList: [],
};
export const initialAuthState: AuthState = {
  isConfigLoaded: false,
  isClientsLoaded: false,
  configFailure: false,
  stsClient: new MockSTSClient(),
  //@ts-expect-error fix this when you are working on it
  managementClient: new MockManagementClient(),
  //@ts-expect-error fix this when you are working on it
  config: { features: [] },
  oidcLogout: null,
};

export const initialErrorsUIState: ErrorsUIState = {
  errorMsg: null,
  errorType: null,
};
export const initialInstancesState = {};
export const initialInstanceStatus: InstanceStatusState = {
  latest: {
    state: {
      //@ts-expect-error fix this when you are working on it
      capabilities: {
        secureChannel: true,
      },
      lastSeen: '',
      latestConfigurationOverlay: null,
      serverVersion: '',
    },
    metrics: {
      'item-counts': {
        dataManaged: {
          total: {
            curr: 0,
            prev: 0,
          },
          byLocation: {},
        },
        bucketList: [],
        buckets: 0,
        versions: 0,
        objects: 0,
      },
      'data-disk-usage': {
        available: 0,
        total: 0,
        free: 0,
      },
      cpu: {
        idle: 0,
        nice: 0,
        sys: 0,
        user: 0,
      },
      memory: {
        free: 0,
        total: 0,
      },
      'crr-stats': {
        backlog: {
          count: 0,
          size: 0,
        },
        completions: {
          count: 0,
          size: 0,
        },
        throughput: {
          count: 0,
          size: 0,
        },
        failures: {
          count: 0,
          size: 0,
        },
        pending: {
          count: 0,
          size: 0,
        },
        stalled: {
          count: 0,
        },
        byLocation: {},
      },
      'crr-schedule': {
        states: {},
        schedules: {},
      },
      //@ts-expect-error fix this when you are working on it
      'ingest-schedule': {},
    },
  },
};
export const initialEndpointsUIState = {
  showDelete: '',
};
//@ts-expect-error fix this when you are working on it
export const initialNetworkActivityState: NetworkActivityState = {
  counter: 0,
  messages: List(),
};
export const initialStatsState = {
  bucketList: [],
};
export const initialUserState = {
  list: [],
  accessKeyList: [],
  attachedPoliciesList: [],
  groupList: [],
  displayedUser: {},
};
export const initialFullState = {
  account: initialAccountState,
  auth: initialAuthState,
  instanceStatus: initialInstanceStatus,
  instances: initialInstancesState,
  networkActivity: initialNetworkActivityState,
  stats: initialStatsState,
  uiErrors: initialErrorsUIState,
};
