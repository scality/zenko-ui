import '@testing-library/jest-dom';
import fetch from 'node-fetch';
import { queryClient } from './src/react/utils/testUtil';

window.fetch = (url, ...rest) =>
  fetch(/^https?:/.test(url) ? url : new URL(url, 'http://localhost'), ...rest);

beforeEach(() => {
  queryClient.clear();
});

jest.mock('./src/react/next-architecture/ui/AuthProvider', () => {
  const INSTANCE_ID = '3d49e1f9-fa2f-40aa-b2d4-c7a8b04c6cde';
  return {
    ...jest.requireActual('./src/react/next-architecture/ui/AuthProvider'),
    __esModule: true,
    useAccessToken: jest.fn(() => 'tototo'),
    useInstanceId: jest.fn(() => INSTANCE_ID),
    useAuth: jest.fn(() => {
      return {
        userData: {
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: ['StorageManager', 'user', 'PlatformAdmin'],
        },
      };
    }),
  };
});

jest.mock('./src/react/next-architecture/ui/ConfigProvider', () => {
  const TEST_API_BASE_URL = 'http://testendpoint';
  return {
    ...jest.requireActual('./src/react/next-architecture/ui/ConfigProvider'),
    __esModule: true,
    useConfig: jest.fn(() => {
      return {
        managementEndpoint: TEST_API_BASE_URL,
        stsEndpoint: TEST_API_BASE_URL,
        zenkoEndpoint: TEST_API_BASE_URL,
        iamEndpoint: TEST_API_BASE_URL,
        navbarEndpoint: TEST_API_BASE_URL,
        navbarConfigUrl: TEST_API_BASE_URL,
        features: [],
        basePath: '',
      };
    }),
    useGrafanaURL: jest.fn(() => TEST_API_BASE_URL + '/grafana'),
  };
});

// useConfig
// jest.mock('./containers/ConfigProvider', () => ({
//   __esModule: true,
//   default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
// }));

// jest.mock('./containers/AlertProvider', () => ({
//   __esModule: true,
//   default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
//   useHighestSeverityAlerts: jest.fn(),
//   useAlerts: jest.fn(),
//   useAlertLibrary: jest.fn(() => {
//     return {
//       getNodesAlertSelectors: jest.fn(),
//       getVolumesAlertSelectors: jest.fn(),
//       getNetworksAlertSelectors: jest.fn(),
//       getServicesAlertSelectors: jest.fn(),
//       getK8SMasterAlertSelectors: jest.fn(),
//       getBootstrapAlertSelectors: jest.fn(),
//       getMonitoringAlertSelectors: jest.fn(),
//       getAlertingAlertSelectors: jest.fn(),
//       getLoggingAlertSelectors: jest.fn(),
//       getDashboardingAlertSelectors: jest.fn(),
//       getIngressControllerAlertSelectors: jest.fn(),
//       getAuthenticationAlertSelectors: jest.fn(),

//       useHighestSeverityAlerts: jest.fn(),
//       useAlerts: jest.fn(),
//     };
//   }),
//   highestAlertToStatus: (alerts?: Alert[]): string => {
//     return (alerts?.[0] && (alerts[0].severity as any as string)) || 'healthy';
//   },
// }));

// jest.mock('./containers/PrivateRoute', () => ({
//   __esModule: true,
//   default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
//   useAuth: jest.fn(() => {
//     return {
//       userData: {
//         id: 'xxx-yyy-zzzz-id',
//         token: 'xxx-yyy-zzz-token',
//         username: 'Renard ADMIN',
//         email: 'renard.admin@scality.com',
//         groups: ['StorageManager', 'user', 'PlatformAdmin'],
//       },
//     };
//   }),
//   useShellConfig: jest.fn(() => {
//     return {
//       config: {
//         navbar: {
//           main: [
//             {
//               kind: 'artesca-base-ui',
//               view: 'overview',
//             },
//             {
//               kind: 'artesca-base-ui',
//               view: 'identity',
//             },
//             {
//               kind: 'metalk8s-ui',
//               view: 'platform',
//             },
//             {
//               kind: 'xcore-ui',
//               view: 'storageservices',
//             },
//             {
//               kind: 'metalk8s-ui',
//               view: 'alerts',
//             },
//           ],
//           subLogin: [
//             {
//               kind: 'artesca-base-ui',
//               view: 'certificates',
//             },
//             {
//               kind: 'artesca-base-ui',
//               view: 'about',
//             },
//             {
//               kind: 'artesca-base-ui',
//               view: 'license',
//               icon: 'fas fa-file-invoice',
//             },
//           ],
//         },
//         discoveryUrl: '/shell/deployed-ui-apps.json',
//         productName: 'MetalK8s',
//       },
//       favicon: '/navbar/artesca-favicon.svg',
//       themes: {
//         darkRebrand: { logoPath: '/logo.svg' },
//       },
//       status: 'success',
//     };
//   }),
// }));
