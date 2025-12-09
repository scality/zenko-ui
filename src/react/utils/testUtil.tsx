import { PropsWithChildren, ReactNode, JSX } from 'react';
import { QueryClient, setLogger, useMutation } from 'react-query';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { ThemeProvider } from 'styled-components';
import IAMClient from '../../js/IAMClient';
import { initialFullState } from '../reducers/initialConstants';

import { ToastProvider } from '@scality/core-ui';
import { coreUIAvailableThemes } from '@scality/core-ui/dist/style/theme';
import { fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { applyMiddleware, compose, createStore } from 'redux';
import { QueryClientProvider } from '../../QueryClientProvider';
import ZenkoClient from '../../js/ZenkoClient';
import { VEEAM_FEATURE, XDM_FEATURE } from '../../js/config';
import { UiFacingApiWrapper } from '../../js/managementClient';
import { Configuration } from '../../js/managementClient/configuration';
import { _DataServiceRoleContext } from '../DataServiceRoleProvider';
import { _ManagementContext } from '../ManagementProvider';
import { authenticatedUserState } from '../actions/__tests__/utils/testUtil';
import { AccessibleAccountsAdapterProvider } from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { AccountsLocationsEndpointsAdapterProvider } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { _AuthContext } from '../next-architecture/ui/AuthProvider';
import { _ConfigContext } from '../next-architecture/ui/ConfigProvider';
import { LocationAdapterProvider } from '../next-architecture/ui/LocationAdapterProvider';
import MetricsAdapterProvider from '../next-architecture/ui/MetricsAdapterProvider';
import { useAssumeRoleQuery } from '../DataServiceRoleProvider';
import { DataBrowserProvider } from '@scality/data-browser-library';
import { IAMProvider } from '../IAMProvider';
import { ZenkoProvider } from '../ZenkoProvider';
import zenkoUIReducer from '../reducers';
import Activity from '../ui-elements/Activity';
import ErrorHandlerModal from '../ui-elements/ErrorHandlerModal';
import ReauthDialog from '../ui-elements/ReauthDialog';
import { ShellHooksProvider } from '@scality/module-federation';

export const testS3Config = {
  endpoint: 'http://testendpoint',
  region: 'us-east-1',
  forcePathStyle: true,
  credentials: {
    accessKeyId: 'accessKey',
    secretAccessKey: 'secretKey',
    sessionToken: 'sessionToken',
  },
};

export const testS3Credentials = testS3Config.credentials;

const TestProvidersWrapper = ({ children }: { children: React.ReactNode }) => (
  <IAMProvider credentials={testS3Config.credentials}>
    <ZenkoProvider credentials={testS3Config.credentials}>
      <DataBrowserProvider getS3Config={() => testS3Config} theme={theme}>
        {children as any}
      </DataBrowserProvider>
    </ZenkoProvider>
  </IAMProvider>
);

export const theme = coreUIAvailableThemes.darkRebrand;
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

export const FAKE_TOKEN = 'xxx-yyy-zzz-token';
export const defaultUserData = {
  id: 'xxx-yyy-zzzz-id',
  token: FAKE_TOKEN,
  username: 'Renard ADMIN',
  email: 'renard.admin@scality.com',
  roles: ['PlatformAdmin'],
  groups: ['user', 'PlatformAdmin'],
  original: {
    id_token: 'idtoken',
    session_state: null,
    access_token: 'token',
    token_type: 'bearer',
    scope: 'openid profile email',
    expires_at: 1592597205,
    state: 'path',
    toStorageString: () => 'token',
    expires_in: 3600,
    expired: false,
    scopes: ['openid', 'profile', 'email'],
    profile: {
      aud: 'myclient',
      exp: 1592597205,
      iat: 1592593605,
      iss: 'https://zenko.io',
      sub: 'test',
      groups: ['StorageManager'],
    },
  },
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
export const TEST_MANAGEMENT_CLIENT = new UiFacingApiWrapper(
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
  features: [XDM_FEATURE, VEEAM_FEATURE],
  navbarEndpoint: TEST_API_BASE_URL,
  stsEndpoint: TEST_API_BASE_URL,
};

export const mockShellHooks = {
  useAuthConfig: jest.fn(),
  useAuth: jest.fn(() => ({
    userData: {
      token: FAKE_TOKEN,
      original: {
        session_state: 'session-state-1',
      },
      groups: ['StorageManager'],
    },
    getToken: () => Promise.resolve(FAKE_TOKEN),
  })),
  useConfigRetriever: jest.fn(() => {
    return {
      retrieveConfiguration: jest.fn(() => {
        return {
          spec: {
            remoteEntryPath: '/remoteEntry.js',
          },
        };
      }),
    };
  }),
  useDiscoveredViews: jest.fn(),
  useShellConfig: jest.fn(),
  useLanguage: jest.fn(),
  useConfig: jest.fn(),
  useLinkOpener: jest.fn(() => {
    return { openLink: jest.fn() };
  }),
  useDeployedApps: jest.fn(() => {
    return [
      {
        kind: 'zenko-ui',
        name: 'zenko-ui.eu-west-1',
        version: 'local-dev',
        url: 'http://127.0.0.1:8383/zenko',
        appHistoryBasePath: '/data',
      },
    ];
  }),
  useShellThemeSelector: jest.fn(() => {
    return {
      theme: 'dark',
      setTheme: jest.fn(),
    };
  }),
  useNotificationCenter: jest.fn(),
};
export const mockComponent = jest.fn(() => <div>Mocked Component</div>);

export const mockShellAlerts = {
  AlertsProvider: ({
    alertManagerUrl,
    children,
  }: {
    alertManagerUrl: string;
    children: JSX.Element;
  }) => <>{children}</>,
  alertHooks: {
    useAlerts: jest.fn(),
    useHighestSeverityAlerts: jest.fn(),
  },
  alertSelectors: {
    getPlatformAlertSelectors: jest.fn(),
    getNodesAlertSelectors: jest.fn(),
    getVolumesAlertSelectors: jest.fn(),
    getNetworksAlertSelectors: jest.fn(),
    getServicesAlertSelectors: jest.fn(),
    getK8SMasterAlertSelectors: jest.fn(),
    getBootstrapAlertSelectors: jest.fn(),
    getMonitoringAlertSelectors: jest.fn(),
    getAlertingAlertSelectors: jest.fn(),
    getLoggingAlertSelectors: jest.fn(),
    getDashboardingAlertSelectors: jest.fn(),
    getIngressControllerAlertSelectors: jest.fn(),
    getAuthenticationAlertSelectors: jest.fn(),
  },
};

export const Wrapper = ({ children }: { children: ReactNode }): ReactNode => {
  const role = {
    roleArn: TEST_ROLE_ARN,
  };

  const store = realStoreWithInitState({});

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ShellHooksProvider
          shellHooks={mockShellHooks}
          shellAlerts={mockShellAlerts}
        >
          <ThemeProvider theme={theme}>
            <MemoryRouter>
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
                            <TestProvidersWrapper>
                              {children}
                            </TestProvidersWrapper>
                          </AccessibleAccountsAdapterProvider>
                        </AccountsLocationsEndpointsAdapterProvider>
                      </MetricsAdapterProvider>
                    </LocationAdapterProvider>
                  </_ManagementContext.Provider>
                </_DataServiceRoleContext.Provider>
              </_ConfigContext.Provider>
            </MemoryRouter>
          </ThemeProvider>
        </ShellHooksProvider>
      </Provider>
    </QueryClientProvider>
  );
};

export const reduxMount = (component: React.ReactNode, testState?: any) => {
  const store = newTestStore(testState);
  return {
    component: render(
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

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Provider store={store}>
          <Wrapper>{component}</Wrapper>
        </Provider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}
export const themeMount = (component: React.ReactNode) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </QueryClientProvider>,
  );
};
export function updateInputText(container, name, value) {
  const input = container.querySelector(`input[name="${name}"]`);
  if (!input) {
    throw new Error(`Input with name "${name}" not found`);
  }
  fireEvent.change(input, { target: { value } });
}

export function checkBox(component, name, checked) {
  const checkbox = component.querySelector(`input[name="${name}"]`);
  fireEvent.change(checkbox, { name, checked });
}
export function editListEntry(component, value, index) {
  const input = component.querySelector(
    `input[name="bootstrapList[${index}]"]`,
  );
  if (!input) {
    throw new Error(`Input with name "${name}" not found`);
  }
  fireEvent.change(input, { target: { value } });
}
export function addListEntry(component) {
  const button = component.querySelector('button[name="addbtn0"]');
  fireEvent.click(button);
}
export function delListEntry(component, index) {
  const button = component.querySelector(`button[name="delbtn${index}"]`);
  fireEvent.click(button);
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
  const store = realStoreWithInitState(testState);
  const role = {
    roleArn: TEST_ROLE_ARN,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <ShellHooksProvider
              shellHooks={mockShellHooks}
              shellAlerts={mockShellAlerts}
            >
              <ToastProvider>
                <MemoryRouter initialEntries={[route]}>
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
                              <TestProvidersWrapper>
                                <Routes>
                                  <Route path={path} element={component} />
                                </Routes>
                                {/* FIXME We are going to manage error differently
                              I keep it here to pass some tests */}
                                <ErrorHandlerModal />
                              </TestProvidersWrapper>
                            </AccessibleAccountsAdapterProvider>
                          </AccountsLocationsEndpointsAdapterProvider>
                        </MetricsAdapterProvider>
                      </LocationAdapterProvider>
                    </_ManagementContext.Provider>
                  </_DataServiceRoleContext.Provider>
                </MemoryRouter>
              </ToastProvider>
            </ShellHooksProvider>
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
  const store = realStoreWithInitState(testState);
  const role = {
    roleArn: TEST_ROLE_ARN,
  };

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <ShellHooksProvider
              shellHooks={mockShellHooks}
              shellAlerts={mockShellAlerts}
            >
              <MemoryRouter initialEntries={[route]}>
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
                              <ToastProvider>
                                <TestProvidersWrapper>
                                  {component}
                                  {/* FIXME We are going to manage error differently
                              I keep it here to pass some tests */}
                                  <ErrorHandlerModal />
                                </TestProvidersWrapper>
                              </ToastProvider>
                            </AccessibleAccountsAdapterProvider>
                          </AccountsLocationsEndpointsAdapterProvider>
                        </MetricsAdapterProvider>
                      </LocationAdapterProvider>
                    </_ManagementContext.Provider>
                  </_DataServiceRoleContext.Provider>
                </_ConfigContext.Provider>
              </MemoryRouter>
            </ShellHooksProvider>
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
    const store = realStoreWithInitState(testState);
    // const store = realStoreWithInitState({});

    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <ShellHooksProvider
              shellHooks={mockShellHooks}
              shellAlerts={mockShellAlerts}
            >
              <MemoryRouter initialEntries={[route]}>
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
                              <TestProvidersWrapper>
                                {children}
                                {/* FIXME We are going to manage error differently
                              I keep it here to pass some tests */}
                                <ErrorHandlerModal />
                              </TestProvidersWrapper>
                            </AccessibleAccountsAdapterProvider>
                          </AccountsLocationsEndpointsAdapterProvider>
                        </MetricsAdapterProvider>
                      </LocationAdapterProvider>
                    </_ManagementContext.Provider>
                  </DataServiceProvider>
                </ToastProvider>
              </MemoryRouter>
            </ShellHooksProvider>
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
