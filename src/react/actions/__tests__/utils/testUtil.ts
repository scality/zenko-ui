/* eslint-disable */
import { applyMiddleware, compose, createStore } from 'redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { XDM_FEATURE } from '../../../../js/config';
import { accountAccessKeys } from '../../../../js/mock/IAMClient';
import { ApiErrorObject, awsErrorObject } from '../../../../js/mock/error';
import {
  ErrorMockManagementClient,
  account,
  accountAccessKey,
  accountSecretKey,
  latestOverlay,
  location,
  userName,
} from '../../../../js/mock/managementClient';
import { ManagementClient } from '../../../../types/managementClient';
import { AppState } from '../../../../types/state';
import zenkoUIReducer from '../../../reducers';
import { initialFullState } from '../../../reducers/initialConstants';
import { waitFor } from '@testing-library/react';
type ActionTestObject = {
  skip?: boolean;
  it: string;
  fn: (...args: Array<any>) => any;
  expectedActions: Array<{
    type: string;
  }>;
};
type DispatchTestObject = {
  skip?: boolean;
  it: string;
  fn: (...args: Array<any>) => any;
  storeState: AppState;
  expectedActions: Array<{
    type: string;
  }>;
};
export const mockStore = () => configureStore([thunk]);
export const APP_CONFIG = {
  managementEndpoint: 'https://managementEndpoint',
  stsEndpoint: 'https://stsEndpoint',
  s3Endpoint: 'https://s3Endpoint',
  iamEndpoint: 'https://iamEndpoint',
  navbarEndpoint: 'https://navbarEndpoint',
  navbarConfigUrl: 'https://navbarConfigUrl',
  features: [XDM_FEATURE],
};
export const INSTANCE_ID = '3d49e1f9-fa2f-40aa-b2d4-c7a8b04c6cde';
//@ts-expect-error fix this when you are working on it
export const initState: AppState = initialFullState;
export const USER_MANAGER_ERROR_MSG = 'User Manager Error Response';
export const MANAGEMENT_ERROR_MSG = 'Management API Error Response';
export const AWS_CLIENT_ERROR_MSG = 'AWS Client Api Error Response';
export const USER_MANAGER_ERROR = new ApiErrorObject(
  USER_MANAGER_ERROR_MSG,
  500,
);
export const MANAGEMENT_ERROR = new ApiErrorObject(MANAGEMENT_ERROR_MSG, 500);
export const AWS_CLIENT_ERROR = awsErrorObject(
  AWS_CLIENT_ERROR_MSG,
  'InternalError',
);
export const LATEST_OVERLAY = latestOverlay;
export const ACCOUNT = account;
export const LOCATION = location;
export const ACCOUNT_ACCESS_KEYS = accountAccessKeys;
export const ACCOUNT_NAME = userName;
export const ACCOUNT_ACCESS_KEY = accountAccessKey;
export const ACCOUNT_SECRET_KEY = accountSecretKey;

export function errorManagementState(): AppState {
  const state = initState;
  return {
    ...state,
    auth: {
      ...state.auth,
      //@ts-expect-error fix this when you are working on it
      managementClient: new ErrorMockManagementClient(MANAGEMENT_ERROR),
    },
  };
}
export function authenticatedUserState(): AppState {
  return initState;
}

export const TEST_USER = {
        id_token: 'idtoken',
        session_state: '8480d2f0-be54-4c1b-9df7-fcce8dfc7436',
        access_token: 'accessToken',
        refresh_token: 'refreshToken',
        token_type: 'bearer',
        scope: 'openid profile email',
        profile: {
          auth_time: 1592593605,
          jti: 'd193f7de-134c-47cf-a4e5-7a1b9a7eed72',
          sub: 'deff329b-72fc-450a-bcb1-354d989859a6',
          typ: 'ID',
          azp: 'myclient',
          session_state: '8480d2f0-be54-4c1b-9df7-fcce8dfc7436',
          acr: '1',
          email_verified: true,
          role: 'user',
          instanceIds: [INSTANCE_ID],
          name: 'FirstName LastName',
          preferred_username: 'username',
          given_name: 'FirstName',
          family_name: 'LastName',
          email: 'test@test.com',
        },
        expires_at: 1592593907,
        state: {
          path: '/',
    },
  };
export function storeStateWithManagementClient(
  state: AppState,
  client: ManagementClient,
): AppState {
  return { ...state, auth: { ...state.auth, managementClient: client } };
}

/**
 * Test function for redux action creators
 * @param (object) test - test object
 * @param (boolean) test.skip - skip test
 * @param (string) test.it - test message
 * @param (function) test.fn - test action
 * @param (object[]) test.expectedActions - list of expected dispatch actions
 */
export const testActionFunction = (test: ActionTestObject) => {
  (test.skip ? it.skip : it)(test.it, () => {
    expect(test.fn).toEqual(test.expectedActions[0]);
  });
};

/**
 * Test function for complex dispatch functions
 * @param (object) test - test object
 * @param (boolean) test.skip - skip test
 * @param (object) test.storeState - redux state
 * @param (string) test.it - test message
 * @param (function) test.fn - test action
 * @param (object[]) test.expectedActions - list of expected dispatch actions
 */
export const testDispatchFunction = (test: DispatchTestObject) => {
  (test.skip ? it.skip : it)(test.it, () => {
    const store = mockStore()(test.storeState);
    return (
      store
        // @ts-expect-error
        .dispatch(test.fn)
        .then(() => expect(store.getActions()).toEqual(test.expectedActions))
        .catch((error) => {
          throw new Error(`Expected success, but got error ${error.message}`);
        })
    );
  });
};
export const testDispatchFunctionWithFullStore = (test: DispatchTestObject) => {
  (test.skip ? it.skip : it)(test.it, (done) => {
    const actions = [];

    const captureActionsMiddleware = () => (next) => (action) => {
      actions.push(action);
      return next(action);
    };

    const store = createStore(
      zenkoUIReducer(),
      test.storeState,
      compose(applyMiddleware(thunk, captureActionsMiddleware)),
    );
    return store
      .dispatch(
        //@ts-expect-error fix this when you are working on it
        test.fn,
      )
      .then(() => expect(actions).toEqual(test.expectedActions))
      .then(done)
      .catch((error) =>
        done(new Error(`Expected success, but got error ${error.message}`)),
      );
  });
};

export const testDispatchErrorTestFn = (
  error: ApiErrorObject,
  test: DispatchTestObject,
) => {
  (test.skip ? it.skip : it)(test.it, async () => {
    const store = mockStore()(test.storeState);
    let testError = null;

    try {
      // @ts-expect-error
      await store.dispatch(test.fn);
    } catch (e) {
      const { message } = e.response.body;
      testError = message;
    }

    expect(store.getActions()).toEqual(test.expectedActions);
    expect(testError).toEqual(error.message);
  });
};

export const waitForSelectOptionToBeEnabled = async (screenElementFn) => {
  await waitFor(
    () => expect(screenElementFn()).toHaveAttribute('aria-disabled', 'false'),
    {
      timeout: 18_000,
    },
  );
  return new Promise((resolve) => setTimeout(resolve, 500));
};
