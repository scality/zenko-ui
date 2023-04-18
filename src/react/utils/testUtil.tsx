import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { act } from 'react-dom/test-utils';
import configureStore from 'redux-mock-store';
import { initialFullState } from '../reducers/initialConstants';
import { mount, ReactWrapper } from 'enzyme';
import thunk from 'redux-thunk';
import { createMemoryHistory } from 'history';
import IAMClient from '../../js/IAMClient';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Router } from 'react-router-dom';
import { _IAMContext } from '../IAMProvider';

import { render } from '@testing-library/react';
import { _ManagementContext } from '../ManagementProvider';
import { UiFacingApi } from '../../js/managementClient/api';
import { Configuration } from '../../js/managementClient/configuration';
import Activity from '../ui-elements/Activity';
import ErrorHandlerModal from '../ui-elements/ErrorHandlerModal';
import zenkoUIReducer from '../reducers';
import { applyMiddleware, compose, createStore } from 'redux';
import { routerMiddleware } from 'connected-react-router';
import { _DataServiceRoleContext } from '../DataServiceRoleProvider';
import { authenticatedUserState } from '../actions/__tests__/utils/testUtil';
import ReauthDialog from '../ui-elements/ReauthDialog';
import ZenkoClient from '../../js/ZenkoClient';
import { _ConfigContext } from '../next-architecture/ui/ConfigProvider';
import { S3AssumeRoleClientProvider } from '../next-architecture/ui/S3ClientProvider';
import { _AuthContext } from '../next-architecture/ui/AuthProvider';
import { XDM_FEATURE } from '../../js/config';
//LocationTestOK
const theme = {
  name: 'Dark Rebrand Theme',
  brand: {
    // Dark Rebrand
    statusHealthy: '#0AADA6',
    statusWarning: '#F8F32B',
    statusCritical: '#E84855',
    selectedActive: '#037AFF',
    highlight: '#1A3C75',
    border: '#313131',
    buttonPrimary: '#2F4185',
    buttonSecondary: '#595A78',
    buttonDelete: '#3D0808',
    infoPrimary: '#8E8EAC',
    infoSecondary: '#333366',
    backgroundLevel1: '#121219',
    backgroundLevel2: '#323245',
    backgroundLevel3: '#232331',
    backgroundLevel4: '#171721',
    textPrimary: '#FFFFFF',
    textSecondary: '#EAEAEA',
    textTertiary: '#B5B5B5',
    textReverse: '#000000',
    textLink: '#71AEFF',
  },
};
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
  const zenkoClient = new ZenkoClient(TEST_API_BASE_URL);
  zenkoClient.login({
    accessKey: 'accessKey',
    secretKey: 'secretKey',
    sessionToken: 'sessionToken',
  });
  const store = createStore(
    zenkoUIReducer(history),
    {
      ...initialFullState,
      ...authenticatedUserState(),
      configuration,
      ...{ zenko: { ...initialFullState.zenko, zenkoClient } },
      ...(state || {}),
    },
    compose(applyMiddleware(thunk, routerMiddleware(history))),
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
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
export const Wrapper = ({ children }: { children: ReactNode }) => {
  const role = {
    roleArn: TEST_ROLE_ARN,
  };
  return (
    <QueryClientProvider client={queryClient}>
      <Router history={history}>
        <_ConfigContext.Provider
          value={{
            iamEndpoint: TEST_API_BASE_URL,
            managementEndpoint: TEST_API_BASE_URL,
            zenkoEndpoint: TEST_API_BASE_URL,
            navbarConfigUrl: TEST_API_BASE_URL,
            features: [XDM_FEATURE],
            navbarEndpoint: TEST_API_BASE_URL,
            stsEndpoint: TEST_API_BASE_URL,
          }}
        >
          <_AuthContext.Provider
            value={{
              user: { access_token: 'token', profile: { sub: 'test' } },
            }}
          >
            <_DataServiceRoleContext.Provider value={{ role }}>
              <_IAMContext.Provider
                value={{
                  iamClient,
                }}
              >
                <_ManagementContext.Provider
                  value={{
                    managementClient: TEST_MANAGEMENT_CLIENT,
                  }}
                >
                  <S3AssumeRoleClientProvider>
                    {children}
                  </S3AssumeRoleClientProvider>
                </_ManagementContext.Provider>
              </_IAMContext.Provider>
            </_DataServiceRoleContext.Provider>
          </_AuthContext.Provider>
        </_ConfigContext.Provider>
      </Router>
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

export const reduxRender = (component, testState) => {
  const store = realStoreWithInitState(testState);
  return {
    component: render(
      <Wrapper>
        <ThemeProvider theme={theme}>
          <Provider store={store}>
            <>
              {component}
              <Activity />
              <ErrorHandlerModal />
              <ReauthDialog />
            </>
          </Provider>
        </ThemeProvider>
      </Wrapper>,
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
        <Provider store={store}>{component}</Provider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return wrapper;
}
export const themeMount = (component: React.ReactNode) => {
  return mount(
    <QueryClientProvider client={new QueryClient()}>
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
