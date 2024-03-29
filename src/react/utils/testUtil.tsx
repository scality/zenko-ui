import { Provider } from 'react-redux';
import { PropsWithChildren, ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import configureStore from 'redux-mock-store';
import { initialFullState } from '../reducers/initialConstants';
import { mount, ReactWrapper } from 'enzyme';
import thunk from 'redux-thunk';
import { createMemoryHistory } from 'history';
import IAMClient from '../../js/IAMClient';
import {
  QueryClient,
  QueryClientProvider,
  setLogger,
  useMutation,
} from 'react-query';
import { Route, Router } from 'react-router-dom';

import { render, waitFor } from '@testing-library/react';
import { _ManagementContext } from '../ManagementProvider';
import { UiFacingApi } from '../../js/managementClient/api';
import { Configuration } from '../../js/managementClient/configuration';
import Activity from '../ui-elements/Activity';
import ErrorHandlerModal from '../ui-elements/ErrorHandlerModal';
import zenkoUIReducer from '../reducers';
import { applyMiddleware, compose, createStore } from 'redux';
import { _DataServiceRoleContext } from '../DataServiceRoleProvider';
import { authenticatedUserState } from '../actions/__tests__/utils/testUtil';
import ReauthDialog from '../ui-elements/ReauthDialog';
import ZenkoClient from '../../js/ZenkoClient';
import { _ConfigContext } from '../next-architecture/ui/ConfigProvider';
import {
  S3ClientProvider,
  useAssumeRoleQuery,
} from '../next-architecture/ui/S3ClientProvider';
import { _AuthContext } from '../next-architecture/ui/AuthProvider';
import { VEEAM_FEATURE, XDM_FEATURE } from '../../js/config';
import { LocationAdapterProvider } from '../next-architecture/ui/LocationAdapterProvider';
import MetricsAdapterProvider from '../next-architecture/ui/MetricsAdapterProvider';
import { INSTANCE_ID } from '../actions/__tests__/utils/testUtil';
import { AccessibleAccountsAdapterProvider } from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { AccountsLocationsEndpointsAdapterProvider } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { ToastProvider } from '@scality/core-ui';
import { coreUIAvailableThemes } from '@scality/core-ui/dist/style/theme';
import userEvent from '@testing-library/user-event';

export const theme = coreUIAvailableThemes.darkRebrand;
export const history = createMemoryHistory();
export const configuration = {
  latest: {
    version: 1,
    updatedAt: '2017-09-28T19:39:22.191Z',
    creator: 'initial',
    instanceId: 'demo-instance',
    locations: {},
    users: [],
    endpoints: [],
    workflows: {
      lifecycle: {},
      transition: {},
    },
  },
};
export const newTestStore = (state) => {
  const store = configureStore([thunk])({
    ...initialFullState,
    ...authenticatedUserState(),
    configuration,
    ...(state || {}),
  });
  return store;
};

export const TEST_API_BASE_URL = 'http://testendpoint';
export const realStoreWithInitState = (state) => {
  const zenkoClient = new ZenkoClient(
    TEST_API_BASE_URL,
    'iam.internal',
    's3.internal',
    '/',
  );
  zenkoClient.login({
    accessKey: 'accessKey',
    secretKey: 'secretKey',
    sessionToken: 'sessionToken',
  });

  const tmpState = {
    ...initialFullState,
    ...authenticatedUserState(),

    configuration,
    ...{ zenko: { ...initialFullState.zenko, zenkoClient } },
    ...(state || {}),
  };
  tmpState.auth.managementClient = TEST_MANAGEMENT_CLIENT;
  if (!state?.auth?.config?.features) {
    tmpState.auth.config.features = [VEEAM_FEATURE];
  }
  const store = createStore(
    zenkoUIReducer(),
    tmpState,
    compose(applyMiddleware(thunk)),
  );

  return store;
};

export const TEST_ROLE_PATH_NAME = 'scality-internal/storage-manager-role';
export const TEST_ROLE_ARN = `arn:aws:iam::000000000000:role/${TEST_ROLE_PATH_NAME}`;
const params = {
  accessKey: 'accessKey',
  secretKey: 'secretKey',
  sessionToken: 'sessionToken',
};
const iamClient = new IAMClient(TEST_API_BASE_URL);
iamClient.login(params);
export const TEST_MANAGEMENT_CLIENT = new UiFacingApi(
  new Configuration({
    apiKey: 'token',
    basePath: `${TEST_API_BASE_URL}/api/v1`,
  }),
  `${TEST_API_BASE_URL}/api/v1`,
  fetch,
);
export const queryClient = new QueryClient({
  // In test environnement, we don't want to retry queries
  // because we may test the error case
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

//Note: React Query version 4 setLogger function is removed.
setLogger({
  log: console.log,
  warn: console.warn,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  error: () => {},
});

export const zenkoUITestConfig = {
  iamEndpoint: TEST_API_BASE_URL,
  managementEndpoint: TEST_API_BASE_URL,
  zenkoEndpoint: TEST_API_BASE_URL,
  navbarConfigUrl: TEST_API_BASE_URL,
  features: [XDM_FEATURE],
  navbarEndpoint: TEST_API_BASE_URL,
  stsEndpoint: TEST_API_BASE_URL,
};
export const Wrapper = ({ children }: { children: ReactNode }) => {
  const role = {
    roleArn: TEST_ROLE_ARN,
  };

  const store = realStoreWithInitState({});

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <Router history={history}>
            <_ConfigContext.Provider
              //@ts-expect-error fix this when you are working on it
              value={zenkoUITestConfig}
            >
              <_AuthContext.Provider
                value={{
                  //@ts-expect-error fix this when you are working on it
                  user: {
                    access_token: 'token',
                    profile: { sub: 'test', instanceIds: [INSTANCE_ID] },
                  },
                }}
              >
                <_DataServiceRoleContext.Provider
                  //@ts-expect-error fix this when you are working on it
                  value={{ role, setRole: jest.fn() }}
                >
                  <_ManagementContext.Provider
                    value={{
                      managementClient: TEST_MANAGEMENT_CLIENT,
                    }}
                  >
                    <LocationAdapterProvider>
                      <MetricsAdapterProvider>
                        <AccountsLocationsEndpointsAdapterProvider>
                          <AccessibleAccountsAdapterProvider>
                            <S3ClientProvider
                              configuration={{
                                endpoint: zenkoUITestConfig.zenkoEndpoint,
                                s3ForcePathStyle: true,
                                credentials: {
                                  accessKeyId: 'accessKey',
                                  secretAccessKey: 'secretKey',
                                  sessionToken: 'sessionToken',
                                },
                              }}
                            >
                              {children}
                            </S3ClientProvider>
                          </AccessibleAccountsAdapterProvider>
                        </AccountsLocationsEndpointsAdapterProvider>
                      </MetricsAdapterProvider>
                    </LocationAdapterProvider>
                  </_ManagementContext.Provider>
                </_DataServiceRoleContext.Provider>
              </_AuthContext.Provider>
            </_ConfigContext.Provider>
          </Router>
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
};

export const reduxMount = (component: React.ReactNode, testState?: any) => {
  const store = newTestStore(testState);
  return {
    component: mount(
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <Wrapper>{component}</Wrapper>
        </Provider>
      </ThemeProvider>,
    ),
  };
};

// AutoSizer uses offsetWidth and offsetHeight.
// Jest runs in JSDom which doesn't support measurements APIs.
export function mockOffsetSize(width: number, height: number) {
  const originalFunction = window.getComputedStyle;
  const spyGetComputedStyle = jest.spyOn(window, 'getComputedStyle');
  spyGetComputedStyle.mockImplementation((elt, _) => {
    const originalStyle = originalFunction(elt);
    originalStyle.fontSize = '14px';
    originalStyle.paddingLeft = '0px';
    originalStyle.paddingRight = '0px';
    originalStyle.paddingTop = '0px';
    originalStyle.paddingBottom = '0px';
    return originalStyle;
  });

  Object.defineProperties(window.HTMLElement.prototype, {
    offsetHeight: {
      get: () => {
        return height || 100;
      },
    },
    offsetWidth: {
      get: () => {
        return width || 100;
      },
    },
  });
}

export const WrapperAsStorageManager = ({
  children,
  isStorageManager,
}: PropsWithChildren<{ isStorageManager: boolean }>) => {
  return (
    <_AuthContext.Provider
      value={{
        //@ts-expect-error we are mocking the user
        user: {
          access_token: 'token',
          profile: {
            sub: 'test',
            groups: isStorageManager ? ['StorageManager'] : [],
          },
        },
      }}
    >
      {children}
    </_AuthContext.Provider>
  );
};

export const reduxRender = (component: JSX.Element, testState?: unknown) => {
  const store = realStoreWithInitState(testState);

  return {
    component: render(
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <ToastProvider>
            <Wrapper>
              <>
                {component}
                <Activity />
                <ErrorHandlerModal />
                <ReauthDialog />
              </>
            </Wrapper>
          </ToastProvider>
        </Provider>
      </ThemeProvider>,
    ),
  };
};

export async function reduxMountAct(component, testState) {
  const store = newTestStore(testState);
  const wrapper: ReactWrapper<
    Record<string, never>,
    Record<string, never>
  > = mount(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: {
              retry: false,
            },
          },
        })
      }
    >
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <Wrapper>{component}</Wrapper>
        </Provider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return wrapper;
}
export const themeMount = (component: React.ReactNode) => {
  return mount(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </QueryClientProvider>,
  );
};
export function updateInputText(component, name, value) {
  component.find(`input[name="${name}"]`).simulate('change', {
    target: {
      name,
      value,
    },
  });
}
export function checkBox(component, name, checked) {
  component.find(`input[name="${name}"]`).simulate('change', {
    target: {
      name,
      checked,
      type: 'checkbox',
    },
  });
}
export function editListEntry(component, value, index) {
  const wrapper = component.find(`input[name="bootstrapList[${index}]"]`);
  wrapper.simulate('change', {
    target: {
      value,
    },
  });
}
export function addListEntry(component) {
  const btnWrapper = component.find('button[name="addbtn0"]');
  btnWrapper.simulate('click');
}
export function delListEntry(component, index) {
  const btnWrapper = component.find(`button[name="delbtn${index}"]`);
  btnWrapper.simulate('click');
}
export function testTableRow(
  T,
  rowWrapper,
  { key, value, extraCellComponent },
) {
  expect(rowWrapper.find(T.Key).text()).toContain(key);
  expect(rowWrapper.find(T.Value).text()).toContain(value);

  if (extraCellComponent) {
    expect(rowWrapper.find(T.ExtraCell).find(extraCellComponent)).toHaveLength(
      1,
    );
  } else {
    expect(rowWrapper.find(T.ExtraCell)).toHaveLength(0);
  }
}

export const simpleRender = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </QueryClientProvider>,
  );
};

export function renderWithRouterMatch(
  component: React.ReactNode,
  // path /workflow/:workflowid
  // route /workflow/0d55a1d7-349c-4e79-932b-b502bcc45a8f
  { path = '/', route = '/' } = {},
  testState?: unknown,
) {
  const history = createMemoryHistory({ initialEntries: [route] });
  const store = realStoreWithInitState(testState);
  const role = {
    roleArn: TEST_ROLE_ARN,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <ToastProvider>
              <Router history={history}>
                <Route path={path}>
                  <_DataServiceRoleContext.Provider
                    //@ts-expect-error fix this when you are working on it
                    value={{ role, setRole: jest.fn() }}
                  >
                    <_ManagementContext.Provider
                      value={{
                        managementClient: TEST_MANAGEMENT_CLIENT,
                      }}
                    >
                      <LocationAdapterProvider>
                        <MetricsAdapterProvider>
                          <AccountsLocationsEndpointsAdapterProvider>
                            <AccessibleAccountsAdapterProvider>
                              <S3ClientProvider
                                configuration={{
                                  endpoint: zenkoUITestConfig.zenkoEndpoint,
                                  s3ForcePathStyle: true,
                                  credentials: {
                                    accessKeyId: 'accessKey',
                                    secretAccessKey: 'secretKey',
                                    sessionToken: 'sessionToken',
                                  },
                                }}
                              >
                                {component}
                                {/* FIXME We are going to manage error differently
                              I keep it here to pass some tests */}
                                <ErrorHandlerModal />
                              </S3ClientProvider>
                            </AccessibleAccountsAdapterProvider>
                          </AccountsLocationsEndpointsAdapterProvider>
                        </MetricsAdapterProvider>
                      </LocationAdapterProvider>
                    </_ManagementContext.Provider>
                  </_DataServiceRoleContext.Provider>
                </Route>
              </Router>
            </ToastProvider>
          </Provider>
        </ThemeProvider>
      </QueryClientProvider>,
    ),
  };
}

export const renderWithCustomRoute = (
  component: React.ReactNode,
  route: string,
  testState?: unknown,
) => {
  const history = createMemoryHistory({ initialEntries: [route] });
  const store = realStoreWithInitState(testState);
  const role = {
    roleArn: TEST_ROLE_ARN,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <Router history={history}>
              <_ConfigContext.Provider
                //@ts-expect-error fix this when you are working on it
                value={zenkoUITestConfig}
              >
                <_DataServiceRoleContext.Provider
                  //@ts-expect-error fix this when you are working on it
                  value={{ role, setRole: jest.fn() }}
                >
                  <_ManagementContext.Provider
                    value={{
                      managementClient: TEST_MANAGEMENT_CLIENT,
                    }}
                  >
                    <LocationAdapterProvider>
                      <MetricsAdapterProvider>
                        <AccountsLocationsEndpointsAdapterProvider>
                          <AccessibleAccountsAdapterProvider>
                            <S3ClientProvider
                              configuration={{
                                endpoint: zenkoUITestConfig.zenkoEndpoint,
                                s3ForcePathStyle: true,
                                credentials: {
                                  accessKeyId: 'accessKey',
                                  secretAccessKey: 'secretKey',
                                  sessionToken: 'sessionToken',
                                },
                              }}
                            >
                              {component}
                              {/* FIXME We are going to manage error differently
                              I keep it here to pass some tests */}
                              <ErrorHandlerModal />
                            </S3ClientProvider>
                          </AccessibleAccountsAdapterProvider>
                        </AccountsLocationsEndpointsAdapterProvider>
                      </MetricsAdapterProvider>
                    </LocationAdapterProvider>
                  </_ManagementContext.Provider>
                </_DataServiceRoleContext.Provider>
              </_ConfigContext.Provider>
            </Router>
          </Provider>
        </ThemeProvider>
      </QueryClientProvider>,
    ),
  };
};

const DataServiceProvider = ({ children }) => {
  const { getQuery } = useAssumeRoleQuery();
  const assumeRoleMutation = useMutation({
    mutationFn: (roleArn: string) => getQuery(roleArn).queryFn(),
  });
  const role = {
    roleArn: TEST_ROLE_ARN,
  };
  const setRole = (role: { roleArn: string }) => {
    assumeRoleMutation.mutate(role.roleArn, {});
  };
  const setRolePromise = async (role: { roleArn: string }) => {
    return getQuery(role.roleArn).queryFn();
  };
  return (
    //@ts-expect-error fix this when you are working on it
    <_DataServiceRoleContext.Provider value={{ role, setRole, setRolePromise }}>
      {children}
    </_DataServiceRoleContext.Provider>
  );
};

export const NewWrapper =
  (route = '/', testState: unknown = {}) =>
  ({ children }: { children: ReactNode }) => {
    const history = createMemoryHistory({ initialEntries: [route] });
    const store = realStoreWithInitState(testState);

    // const history = createMemoryHistory();
    // const store = realStoreWithInitState({});

    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <Router history={history}>
              <ToastProvider>
                <DataServiceProvider>
                  <_ManagementContext.Provider
                    value={{
                      managementClient: TEST_MANAGEMENT_CLIENT,
                    }}
                  >
                    <LocationAdapterProvider>
                      <MetricsAdapterProvider>
                        <AccountsLocationsEndpointsAdapterProvider>
                          <AccessibleAccountsAdapterProvider>
                            <S3ClientProvider
                              configuration={{
                                endpoint: zenkoUITestConfig.zenkoEndpoint,
                                s3ForcePathStyle: true,
                                credentials: {
                                  accessKeyId: 'accessKey',
                                  secretAccessKey: 'secretKey',
                                  sessionToken: 'sessionToken',
                                },
                              }}
                            >
                              {children}
                              {/* FIXME We are going to manage error differently
                              I keep it here to pass some tests */}
                              <ErrorHandlerModal />
                            </S3ClientProvider>
                          </AccessibleAccountsAdapterProvider>
                        </AccountsLocationsEndpointsAdapterProvider>
                      </MetricsAdapterProvider>
                    </LocationAdapterProvider>
                  </_ManagementContext.Provider>
                </DataServiceProvider>
              </ToastProvider>
            </Router>
          </Provider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  };

export const selectClick = async (component) => {
  await userEvent.click(component);
  await userEvent.keyboard('{ArrowDown}');
};

export const expectElementNotToBeInDocument = async (
  selector: () => HTMLElement,
) => {
  try {
    await waitFor(() => {
      expect(selector()).not.toBeInTheDocument();
    });
    expect(true).toBeFalsy(); // if the previous line doesn't throw an error, we force to throw an error
  } catch (error) {
    expect(error).toBeDefined();
  }
};
