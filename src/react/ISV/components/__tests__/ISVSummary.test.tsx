import { Stepper, ToastProvider } from '@scality/core-ui';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';
import { QueryClient } from 'react-query';
import { ThemeProvider } from 'styled-components';
import { mockComponent, mockShellHooks, renderWithCustomRoute, theme, TEST_ROLE_ARN, Wrapper } from '../../../utils/testUtil';
import * as hooks from '../../../utils/hooks';
import * as DSRProvider from '../../../DataServiceRoleProvider';
import { QueryClientProvider } from '../../../../QueryClientProvider';
import * as useGetS3ServicePointModule from '../../hooks/useGetS3ServicePoint';
import {
  VEEAM_BACKUP_REPLICATION,
  VEEAM_DEFAULT_ACCOUNT_NAME,
  VEEAM_OFFICE_365,
  VEEAM_OFFICE_365_V8,
} from '../../constants';
import { CommvaultPlatform } from '../../platforms/commvault';
import { VeeamVBOPlatform } from '../../platforms/veeam-vbo';
import { VeeamVBRPlatform } from '../../platforms/veeam-vbr';
import { ISVStepperContext, type ISVStepperContextType } from '../ISVStepperContext';
import { DEFAULT_REGION, ISVSummary, type ISVSummaryProps } from '../ISVSummary';

const useAuth = mockShellHooks.useAuth;
const useDeployedApps = mockShellHooks.useDeployedApps;
const useConfigRetriever = mockShellHooks.useConfigRetriever;

jest.spyOn(useGetS3ServicePointModule, 'useGetS3ServicePoint').mockReturnValue({
  s3ServicePoint: 's3.test.local',
});

const mockAuthUserData = {
  userData: {
    token: 'xxx-yyy-zzz-token',
    original: {
      id_token: 'idtoken',
      session_state: 'xxx-yyy-zzzz-id',
      access_token: 'xxx-yyy-zzz-token',
      profile: {
        sub: 'xxx-yyy-zzzz-id',
        instanceIds: ['instance-id'],
        name: 'Renard ADMIN',
        email: 'renard.admin@scality.com',
      },
      expires_at: Date.now() / 1000 + 3600,
    },
    groups: ['user', 'PlatformAdmin'],
  },
  getToken: async (): Promise<string> => {
    return 'xxx-yyy-zzz-token';
  },
};

const BUCKET_NAME = 'bucket-name';
const SERVICE_POINT = 's3.test.local';
const ACCESS_KEY = 'access-key';
const SECRET_KEY = 'secret-access-key';

const mockStepperContext: ISVStepperContextType = {
  platform: VeeamVBRPlatform,
};

const mockSummaryProps: ISVSummaryProps = {
  accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
  accountNameType: 'create',
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  buckets: [{ name: BUCKET_NAME }],
  enableImmutableBackup: true,
  application: VEEAM_BACKUP_REPLICATION,
};

const mockExistingAccountSummaryProps: ISVSummaryProps = {
  accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
  accountNameType: 'existing',
  accessKey: undefined as unknown as string,
  secretKey: undefined as unknown as string,
  accessKeys: ['access-key-1', 'access-key-2'],
  buckets: [{ name: BUCKET_NAME }],
  enableImmutableBackup: true,
  application: VEEAM_BACKUP_REPLICATION,
};

const mockMultiBucketSummaryProps: ISVSummaryProps = {
  accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
  accountNameType: 'create',
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  buckets: [{ name: BUCKET_NAME }, { name: 'bucket-name-2' }],
  enableImmutableBackup: true,
  application: VEEAM_BACKUP_REPLICATION,
};

const CERTIFICATE_SECTION_TITLE = '1. Certificates';
const CREDENTIALS_SECTION_TITLE = 'Credentials';
const BUCKET_SECTION_TITLE = 'Buckets';
const CONFIGURATION_SUMMARY_TITLE = (platformName: string) =>
  new RegExp(`Information for the ${platformName} configuration`, 'i');
const SUMMARY_TITLE = (platformName) => /preparation summary/;

jest.setTimeout(10000);
const platformName = 'Veeam';

const VEEAM_ROLE_ARN = 'arn:aws:iam::111111111111:role/scality-internal/storage-manager-role';

describe('ISVSummary', () => {
  let writeTextSpy: jest.SpyInstance;

  beforeEach(() => {
    writeTextSpy = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
  });

  afterEach(() => {
    writeTextSpy.mockRestore();
  });
  const selectors = {
    title: (platformName) => screen.getByText(SUMMARY_TITLE(platformName)),
    informationSection: (platformName) => screen.getByText(CONFIGURATION_SUMMARY_TITLE(platformName)),
    credentialsSection: () => screen.getByText(CREDENTIALS_SECTION_TITLE),
    bucketSection: () => screen.getByText(BUCKET_SECTION_TITLE),
    certificateSection: () => screen.queryByText(CERTIFICATE_SECTION_TITLE),
    certificateButton: () => screen.queryByRole('button', { name: /Download/i }),
    copyServiceEndpointButton: () => screen.getByRole('button', { name: /copy service (endpoint|point|host)/i }),
    copySecretKeyButton: () => screen.getByRole('button', { name: /copy secret access key/i }),
    copyAccessKeyButton: () => screen.getByRole('button', { name: /copy access key/i }),
    copyBucketNameButton: () => screen.getByRole('button', { name: /copy bucket name/i }),
    copyRegionButton: () => screen.getByRole('button', { name: /copy region/i }),
    copyAllButton: () => screen.getByRole('button', { name: /copy all/i }),
    secretKeyOutput: () => screen.queryByLabelText(/Secret Access key/i),
    accessKeysOutput: () => screen.queryAllByText(/Access key ID/),
  };

  it('should render Summary', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });
    render(
      <ISVStepperContext.Provider value={mockStepperContext}>
        <Stepper
          steps={[
            {
              label: 'Summary',
              Component: ({ children }: { children: React.ReactNode }) => {
                return <ISVSummary {...mockSummaryProps} />;
              },
            },
          ]}
        />
      </ISVStepperContext.Provider>,
      { wrapper: Wrapper },
    );

    //E+V
    expect(selectors.title(platformName)).toBeInTheDocument();
    expect(selectors.informationSection(platformName)).toBeInTheDocument();
    expect(selectors.credentialsSection()).toBeInTheDocument();
    expect(selectors.bucketSection()).toBeInTheDocument();
    expect(selectors.certificateSection()).toBeInTheDocument();
    expect(selectors.informationSection(platformName)).toBeInTheDocument();
    expect(screen.getByText(/2. /i)).toBeInTheDocument();
  });

  it('should not render certificate section if user is not PlatformAdmin', async () => {
    //S
    useAuth.mockImplementation(() => {
      return {
        ...mockAuthUserData,
        userData: {
          ...mockAuthUserData.userData,
          groups: ['user'],
        },
      };
    });
    render(
      <ISVStepperContext.Provider value={mockStepperContext}>
        <Stepper
          steps={[
            {
              label: 'Summary',
              Component: ({ children }: { children: React.ReactNode }) => {
                return <ISVSummary {...mockSummaryProps} />;
              },
            },
          ]}
        />
      </ISVStepperContext.Provider>,
      { wrapper: Wrapper },
    );

    //E+V
    expect(selectors.certificateSection()).not.toBeInTheDocument();
    expect(selectors.informationSection(platformName)).toBeInTheDocument();
    expect(screen.queryByText(/2. /i)).not.toBeInTheDocument();
  });
  it('should render secret key for new account', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });
    render(
      <ISVStepperContext.Provider value={mockStepperContext}>
        <Stepper
          steps={[
            {
              label: 'Summary',
              Component: ({ children }: { children: React.ReactNode }) => {
                return <ISVSummary {...mockSummaryProps} />;
              },
            },
          ]}
        />
      </ISVStepperContext.Provider>,
      { wrapper: Wrapper },
    );

    //E+V
    expect(selectors.secretKeyOutput()).toBeInTheDocument();
  });

  it('should render summary bucket banner when specified', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });
    render(
      <ISVStepperContext.Provider
        value={{
          platform: VeeamVBRPlatform,
        }}
      >
        <Stepper
          steps={[
            {
              label: 'Summary',
              Component: ({ children }: { children: React.ReactNode }) => {
                return <ISVSummary {...mockExistingAccountSummaryProps} />;
              },
            },
          ]}
        />
      </ISVStepperContext.Provider>,
      { wrapper: Wrapper },
    );

    //E+V
    expect(selectors.bucketSection()).toBeInTheDocument();
    expect(screen.getByText('Configuration warning')).toBeInTheDocument();
  });

  it('should render available access keys for existing account', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });
    render(
      <ISVStepperContext.Provider
        value={{
          platform: VeeamVBRPlatform,
        }}
      >
        <Stepper
          steps={[
            {
              label: 'Summary',
              Component: ({ children }: { children: React.ReactNode }) => {
                return <ISVSummary {...mockExistingAccountSummaryProps} />;
              },
            },
          ]}
        />
      </ISVStepperContext.Provider>,
      { wrapper: Wrapper },
    );

    //E+V
    expect(selectors.secretKeyOutput()).not.toBeInTheDocument();
    // 3 matches: 2 access key labels + 1 in the banner message
    expect(selectors.accessKeysOutput()).toHaveLength(3);
  });
  it('should render a list of buckets if more than one bucket is created', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });

    render(
      <ISVStepperContext.Provider
        value={{
          platform: VeeamVBRPlatform,
        }}
      >
        <Stepper
          steps={[
            {
              label: 'Summary',
              Component: ({ children }: { children: React.ReactNode }) => {
                return <ISVSummary {...mockMultiBucketSummaryProps} />;
              },
            },
          ]}
        />
      </ISVStepperContext.Provider>,
      { wrapper: Wrapper },
    );

    //E+V
    expect(selectors.bucketSection()).toBeInTheDocument();
    expect(screen.queryAllByText(/bucket-name/i)).toHaveLength(2);
  });

  it('should redirect to the first bucket overview page when clicking on the finish button', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });

    const ExpectedComponent = () => {
      const { accountName, bucketName } = useParams();
      return (
        <>
          <div>Account Name: {accountName}</div>
          <div>Bucket Name: {bucketName}</div>
        </>
      );
    };

    renderWithCustomRoute(
      <Routes>
        <Route
          path="/"
          element={
            <ISVStepperContext.Provider value={mockStepperContext}>
              <Stepper
                steps={[
                  {
                    label: 'Summary',
                    Component: ({ children }: { children: React.ReactNode }) => {
                      return <ISVSummary {...mockSummaryProps} />;
                    },
                  },
                ]}
              />
            </ISVStepperContext.Provider>
          }
        />
        <Route path="/accounts/:accountName/buckets/:bucketName" element={<ExpectedComponent />}></Route>
      </Routes>,
      '/',
    );
    //E

    const finishButton = screen.getByRole('button', { name: /Finish/i });
    expect(finishButton).toBeInTheDocument();
    expect(finishButton).toBeEnabled();

    await userEvent.click(finishButton);

    await waitFor(() => {
      expect(screen.getByText(/Account Name: Veeam/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Bucket Name: bucket-name/i)).toBeInTheDocument();
    //V
  });

  describe('pre-warm role on Finish', () => {
    const mockSetRolePromise = jest.fn();

    function createWrapperWithSetRolePromise(setRolePromiseFn: jest.Mock) {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      });

      return function WrapperWithSetRolePromise({ children }: { children: React.ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
              <MemoryRouter>
                <ToastProvider>
                  <DSRProvider._DataServiceRoleContext.Provider
                    //@ts-expect-error providing only the fields needed for this test
                    value={{ role: { roleArn: TEST_ROLE_ARN }, setRole: jest.fn(), setRolePromise: setRolePromiseFn }}
                  >
                    {children}
                  </DSRProvider._DataServiceRoleContext.Provider>
                </ToastProvider>
              </MemoryRouter>
            </ThemeProvider>
          </QueryClientProvider>
        );
      };
    }

    beforeEach(() => {
      mockSetRolePromise.mockReset();
      jest.spyOn(hooks, 'useAccounts').mockReturnValue({
        accounts: [
          {
            Name: VEEAM_DEFAULT_ACCOUNT_NAME,
            id: '111111111111',
            Roles: [{ Name: 'storage-manager-role', Arn: VEEAM_ROLE_ARN }],
          },
        ],
      } as any);
    });

    afterEach(() => {
      jest.spyOn(hooks, 'useAccounts').mockRestore();
    });

    it('navigates to the bucket page on Finish', async () => {
      mockSetRolePromise.mockResolvedValue({});

      const ExpectedComponent = () => {
        const { accountName, bucketName } = useParams();
        return (
          <>
            <div>Account Name: {accountName}</div>
            <div>Bucket Name: {bucketName}</div>
          </>
        );
      };

      const WrapperWithSetRolePromise = createWrapperWithSetRolePromise(mockSetRolePromise);

      render(
        <WrapperWithSetRolePromise>
          <Routes>
            <Route
              path="/"
              element={
                <ISVStepperContext.Provider value={mockStepperContext}>
                  <Stepper
                    steps={[
                      {
                        label: 'Summary',
                        Component: ({ children }: { children: React.ReactNode }) => {
                          return <ISVSummary {...mockSummaryProps} />;
                        },
                      },
                    ]}
                  />
                </ISVStepperContext.Provider>
              }
            />
            <Route path="/accounts/:accountName/buckets/:bucketName" element={<ExpectedComponent />} />
          </Routes>
        </WrapperWithSetRolePromise>,
      );

      const finishButton = screen.getByRole('button', { name: /Finish/i });
      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText(/Account Name: Veeam/i)).toBeInTheDocument();
      });
    });

    it('shows error toast and does not navigate when setRolePromise rejects', async () => {
      mockSetRolePromise.mockRejectedValue(new Error('STS failure'));

      const ExpectedComponent = () => {
        const { accountName, bucketName } = useParams();
        return (
          <>
            <div>Account Name: {accountName}</div>
            <div>Bucket Name: {bucketName}</div>
          </>
        );
      };

      const WrapperWithSetRolePromise = createWrapperWithSetRolePromise(mockSetRolePromise);

      render(
        <WrapperWithSetRolePromise>
          <Routes>
            <Route
              path="/"
              element={
                <ISVStepperContext.Provider value={mockStepperContext}>
                  <Stepper
                    steps={[
                      {
                        label: 'Summary',
                        Component: ({ children }: { children: React.ReactNode }) => {
                          return <ISVSummary {...mockSummaryProps} />;
                        },
                      },
                    ]}
                  />
                </ISVStepperContext.Provider>
              }
            />
            <Route path="/accounts/:accountName/buckets/:bucketName" element={<ExpectedComponent />} />
          </Routes>
        </WrapperWithSetRolePromise>,
      );

      const finishButton = screen.getByRole('button', { name: /Finish/i });
      await userEvent.click(finishButton);

      await waitFor(() => {
        expect(mockSetRolePromise).toHaveBeenCalledWith({ roleArn: VEEAM_ROLE_ARN });
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to assume role: STS failure/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/Account Name: Veeam/i)).not.toBeInTheDocument();
    });
  });

  describe('Certificate button', () => {
    beforeEach(() => {
      useAuth.mockImplementation(() => mockAuthUserData);
      useConfigRetriever.mockImplementation(() => {
        return {
          retrieveConfiguration: jest.fn().mockReturnValue({
            spec: {
              remoteEntryPath: '/remoteEntry.js',
            },
          }),
        };
      });
      mockComponent.mockImplementation(() => <button>Download</button>);
    });
    it('should render the ISVSummary with certificate download button with artesca', async () => {
      useDeployedApps.mockImplementation(() => {
        return [
          {
            kind: 'artesca-base-ui',
            name: 'artesca-base-ui',
            url: 'https://artesca-base-ui',
            version: '1.0.0',
            appHistoryBasePath: '/app-history',
          },
        ];
      });

      render(
        <ISVStepperContext.Provider
          value={{
            platform: VeeamVBRPlatform,
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
                      accountNameType="create"
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME }]}
                      enableImmutableBackup={true}
                      application={VEEAM_BACKUP_REPLICATION}
                    />
                  );
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );

      expect(selectors.certificateSection()).toBeInTheDocument();
      expect(selectors.certificateButton()).toBeInTheDocument();
    });
    it('should not render the certificate download button without artesca', async () => {
      useDeployedApps.mockImplementation(() => {
        return [];
      });

      render(
        <ISVStepperContext.Provider
          value={{
            platform: VeeamVBRPlatform,
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
                      accountNameType="create"
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME }]}
                      enableImmutableBackup={true}
                      application={VEEAM_BACKUP_REPLICATION}
                    />
                  );
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );

      expect(selectors.certificateButton()).not.toBeInTheDocument();
    });
  });
  describe('Copy buttons', () => {
    it('should copy correct data when clicking on the copy buttons', async () => {
      //S

      render(
        <ISVStepperContext.Provider value={mockStepperContext}>
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return <ISVSummary {...mockSummaryProps} />;
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );

      // Verify the copy buttons
      fireEvent.click(selectors.copyServiceEndpointButton());
      expect(writeTextSpy).toHaveBeenLastCalledWith(SERVICE_POINT);
      fireEvent.click(selectors.copyAccessKeyButton());
      expect(writeTextSpy).toHaveBeenLastCalledWith(ACCESS_KEY);
      fireEvent.click(selectors.copySecretKeyButton());
      expect(writeTextSpy).toHaveBeenLastCalledWith(SECRET_KEY);
      fireEvent.click(selectors.copyBucketNameButton());
      expect(writeTextSpy).toHaveBeenLastCalledWith(BUCKET_NAME);
      fireEvent.click(selectors.copyRegionButton());
      expect(writeTextSpy).toHaveBeenLastCalledWith(DEFAULT_REGION);
      fireEvent.click(selectors.copyAllButton());

      expect(writeTextSpy).toHaveBeenLastCalledWith(
        `Service Endpoint\t${SERVICE_POINT}\nRegion\t${DEFAULT_REGION}\nAccess key ID\t${ACCESS_KEY}\nSecret Access key\t${SECRET_KEY}\nBucket names\t${BUCKET_NAME}`,
      );
    });

    it('should copy all information to the clipboard when clicking on the copy all button in multiple bucket case', () => {
      //S
      render(
        <ISVStepperContext.Provider value={mockStepperContext}>
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return <ISVSummary {...mockMultiBucketSummaryProps} />;
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );

      // Verify the copy buttons
      fireEvent.click(selectors.copyAllButton());
      expect(writeTextSpy).toHaveBeenLastCalledWith(
        `Service Endpoint\t${SERVICE_POINT}\nRegion\t${DEFAULT_REGION}\nAccess key ID\t${ACCESS_KEY}\nSecret Access key\t${SECRET_KEY}\nBucket names\t${BUCKET_NAME}, bucket-name-2`,
      );
    });
    it('should copy all data when displaying access keys for existing account', () => {
      //S
      render(
        <ISVStepperContext.Provider value={mockStepperContext}>
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return <ISVSummary {...mockExistingAccountSummaryProps} />;
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );

      // Verify the copy buttons
      fireEvent.click(selectors.copyAllButton());
      expect(writeTextSpy).toHaveBeenLastCalledWith(
        `Service Endpoint\t${SERVICE_POINT}\nRegion\t${DEFAULT_REGION}\nAccess key IDs\taccess-key-1, access-key-2\nBucket names\t${BUCKET_NAME}`,
      );
    });
  });

  describe('Service Endpoint Label', () => {
    it('should render "Service Host" label for Commvault', async () => {
      render(
        <ISVStepperContext.Provider
          value={{
            platform: CommvaultPlatform,
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      accountName="commvault-account"
                      accountNameType="create"
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME }]}
                      enableImmutableBackup={true}
                      application={'Commvault'}
                    />
                  );
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );

      expect(screen.getByText('Service Host')).toBeInTheDocument();
      expect(screen.queryByText('Service point')).not.toBeInTheDocument();
    });

    it('should copy "Service Host" label for Commvault when copying all', async () => {
      render(
        <ISVStepperContext.Provider
          value={{
            platform: CommvaultPlatform,
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      accountName="commvault-account"
                      accountNameType="create"
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME }]}
                      enableImmutableBackup={true}
                      application={'Commvault'}
                    />
                  );
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );

      //E+V
      fireEvent.click(selectors.copyAllButton());
      expect(writeTextSpy).toHaveBeenLastCalledWith(
        `Service Host\t${SERVICE_POINT}\nRegion\t${DEFAULT_REGION}\nAccess key ID\t${ACCESS_KEY}\nSecret Access key\t${SECRET_KEY}\nBucket names\t${BUCKET_NAME}`,
      );
    });
  });

  describe('Immutability Section', () => {
    it('should render WORM storage lock for Commvault', async () => {
      render(
        <ISVStepperContext.Provider
          value={{
            platform: CommvaultPlatform,
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
                      accountNameType="create"
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME }]}
                      enableImmutableBackup={true}
                      application={'Commvault'}
                    />
                  );
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );

      expect(screen.getByText((content) => /worm|storage|lock/i.test(content))).toBeInTheDocument();
    });
    it('should render Immutability Section with help text for Veeam Backup & Replication', async () => {
      useAuth.mockImplementation(() => {
        return mockAuthUserData;
      });
      render(
        <ISVStepperContext.Provider value={mockStepperContext}>
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return <ISVSummary {...mockSummaryProps} />;
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );
      expect(screen.queryAllByText(/immutable/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Ensure "Make recent backups immutable"/i)).toBeInTheDocument();
    });
    it('should render Immutability Section with help text for Veeam VBO V8', async () => {
      render(
        <ISVStepperContext.Provider
          value={{
            platform: VeeamVBOPlatform,
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
                      accountNameType="create"
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME }]}
                      enableImmutableBackup={true}
                      application={VEEAM_OFFICE_365_V8}
                    />
                  );
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );
      expect(screen.queryAllByText(/immutable/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Ensure "Make recent backups immutable"/i)).toBeInTheDocument();
    });

    it('should hide Immutability Section for Veeam Office 365', async () => {
      render(
        <ISVStepperContext.Provider
          value={{
            platform: VeeamVBOPlatform,
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
                      accountNameType="create"
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME }]}
                      enableImmutableBackup={true}
                      application={VEEAM_OFFICE_365}
                    />
                  );
                },
              },
            ]}
          />
        </ISVStepperContext.Provider>,
        { wrapper: Wrapper },
      );
      expect(screen.queryByText('Option')).not.toBeInTheDocument();
      expect(screen.queryByText('Object-lock')).not.toBeInTheDocument();
      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });
  });
});
