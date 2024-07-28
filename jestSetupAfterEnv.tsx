import '@testing-library/jest-dom';
import fetch from 'node-fetch';
import { queryClient } from './src/react/utils/testUtil';

window.fetch = (url, ...rest) =>
  //@ts-expect-error fix this when you are working on it
  fetch(/^https?:/.test(url) ? url : new URL(url, 'http://localhost'), ...rest);

beforeEach(() => {
  queryClient.clear();
});

const shellHooks = {
  useShellThemeSelector: jest.fn(() => {
    return {
      theme: 'dark',
      setTheme: jest.fn(),
    };
  }),
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
};

// @ts-expect-error The type is wrong because we only mock what we need for the test
window.shellHooks = shellHooks;

// When testing that the upload api is effectively called
// we are getting this error from MSW
// error: TypeError [NetworkingError]: The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received an instance of Blob
// at new NodeError (node:internal/errors:372:5)
// at Function.from (node:buffer:323:9)
// at Object.concatChunkToBuffer (/Users/yanjincheng/Scality/zenko-ui/node_modules/@mswjs/interceptors/src/interceptors/ClientRequest/utils/concatChunkToBuffer.ts:6:20)
// at NodeClientRequest.Object.<anonymous>.NodeClientRequest.getRequestBody (/Users/yanjincheng/Scality/zenko-ui/node_modules/@mswjs/interceptors/src/interceptors/ClientRequest/NodeClientRequest.ts:372:26)
// at NodeClientRequest.Object.<anonymous>.NodeClientRequest.end (/Users/yanjincheng/Scality/zenko-ui/node_modules/@mswjs/interceptors/src/interceptors/ClientRequest/NodeClientRequest.ts:112:30)
// We suspect this to be solved in msw 2.0.0, lets have a look when upgrading
const originalBufferFrom = Buffer.from;
Buffer.from = (potentialyBlob) => {
  if (potentialyBlob instanceof Blob) {
    return originalBufferFrom('test');
  }
  return originalBufferFrom(potentialyBlob);
};

jest.mock('./src/react/next-architecture/ui/AuthProvider', () => {
  const INSTANCE_ID = '3d49e1f9-fa2f-40aa-b2d4-c7a8b04c6cde';
  return {
    ...jest.requireActual('./src/react/next-architecture/ui/AuthProvider'),
    __esModule: true,
    useAccessToken: jest.fn(() => 'Token'),
    useInstanceId: jest.fn(() => INSTANCE_ID),
    useAuth: jest.fn(() => {
      return {
        userData: {
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: ['StorageManager', 'user', 'PlatformAdmin'],
          original: {
            session_state: 'session-state-1',
          },
        },
        getToken: Promise.resolve('xxx-yyy-zzz-token'),
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
        features: ['Veeam', 'XDM'],
        basePath: '',
      };
    }),
    useGrafanaURL: jest.fn(() => TEST_API_BASE_URL + '/grafana'),
    useDeployedApps: jest.fn(() => {
      const mockDeployedApps = [
        {
          kind: 'artesca-base-ui',
          name: 'artesca-ui.eu-west-1',
          version: 'test',
          url: TEST_API_BASE_URL,
          appHistoryBasePath: '/data',
        },
      ];
      return mockDeployedApps;
    }),
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
    useXcoreConfig: jest.fn(() => {
      return {
        spec: {
          hooks: {
            xcore_library: {
              module: './xcoreLibrary',
              scope: 'xcore',
            },
          },
        },
      };
    }),
    useLinkOpener: jest.fn(() => {
      return { openLink: jest.fn() };
    }),
  };
});

jest.mock('./src/react/next-architecture/ui/XCoreLibraryProvider', () => {
  return {
    ...jest.requireActual(
      './src/react/next-architecture/ui/XCoreLibraryProvider',
    ),
    __esModule: true,
    useXCoreLibrary: jest.fn(() => {
      return {
        useClusterCapacity: jest.fn(() => ({
          clusterCapacity: '5000000000',
          clusterCapacityStatus: 'success',
        })),
      };
    }),
  };
});

jest.mock('@module-federation/enhanced/runtime', () => {}, { virtual: true });
