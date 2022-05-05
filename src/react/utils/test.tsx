import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { act } from 'react-dom/test-utils';
import configureStore from 'redux-mock-store';
import { initialFullState } from '../reducers/initialConstants';
import { mount } from 'enzyme';
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
    // degraded colors
    alert: '#FFE508',
    base: '#7B7B7B',
    primary: '#1D1D1D',
    primaryDark1: '#171717',
    primaryDark2: '#0A0A0A',
    secondary: '#0F7FFF',
    secondaryDark1: '#1C3D59',
    secondaryDark2: '#1C2E3F',
    success: '#006F62',
    healthy: '#30AC26',
    healthyLight: '#69E44C',
    warning: '#FFC10A',
    danger: '#AA1D05',
    critical: '#BE321F',
    background: '#121212',
    backgroundBluer: '#192A41',
    borderLight: '#A5A5A5',
    info: '#434343',
  },
};
const history = createMemoryHistory();
export const newTestStore = (state) => {
  const store = configureStore([thunk])({
    ...initialFullState,
    ...authenticatedUserState(),
    ...(state || {}),
  });
  return store;
};

export const realStoreWithInitState = (state) => {
  const store = createStore(
    zenkoUIReducer(history),
    { ...initialFullState, ...authenticatedUserState(), ...(state || {}) },
    compose(applyMiddleware(thunk, routerMiddleware(history))),
  );

  return store;
};

export const TEST_API_BASE_URL = 'http://testendpoint';
export const Wrapper = ({ children }: { children: ReactNode }) => {
  const params = {
    accessKey: 'accessKey',
    secretKey: 'secretKey',
    sessionToken: 'sessionToken',
  };
  const iamClient = new IAMClient(TEST_API_BASE_URL);
  iamClient.login(params);
  const mgtClient = new UiFacingApi(
    new Configuration({
      apiKey: 'token',
      basePath: `${TEST_API_BASE_URL}/api/v1`,
    }),
    `${TEST_API_BASE_URL}/api/v1`,
    fetch,
  );
  const roleArn =
    'arn:aws:iam::000000000000:role/scality-internal/storage-manager-role';
  const roleName = 'storage-manager-role';
  const role = {
    roleArn,
    roleName,
  };
  return (
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
      <Router history={history}>
        <_DataServiceRoleContext.Provider value={{ role }}>
          <_IAMContext.Provider
            value={{
              iamClient,
            }}
          >
            <_ManagementContext.Provider
              value={{
                managementClient: mgtClient,
              }}
            >
              {children}
            </_ManagementContext.Provider>
          </_IAMContext.Provider>
        </_DataServiceRoleContext.Provider>
      </Router>
    </QueryClientProvider>
  );
};

export const reduxMount = (component, testState) => {
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
  let wrapper = null;
  await act(async () => {
    wrapper = mount(
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
  });
  return wrapper;
}
export const themeMount = (component) => {
  return mount(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
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
  const wrapper = component
    .find('InputList')
    .find(`input[name="entry${index}"]`);
  wrapper.simulate('change', {
    target: {
      value,
    },
  });
}
export function addListEntry(component) {
  const btnWrapper = component.find('InputList').find('button[name="addbtn"]');
  btnWrapper.simulate('click');
}
export function delListEntry(component, index) {
  const btnWrapper = component.find('InputList').find(`button#delbtn${index}`);
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
