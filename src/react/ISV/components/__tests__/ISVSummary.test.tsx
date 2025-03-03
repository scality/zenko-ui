import { Stepper } from '@scality/core-ui';
import { render, screen, waitFor } from '@testing-library/react';

import { DEFAULT_REGION, ISVSummary, ISVSummaryProps } from '../ISVSummary';
import userEvent from '@testing-library/user-event';
import {
  VEEAM_BACKUP_REPLICATION,
  VEEAM_DEFAULT_ACCOUNT_NAME,
  VEEAM_OFFICE_365_V8,
} from '../../constants';

import { mockShellHooks, Wrapper } from '../../../utils/testUtil';
import { ISVStepperContext, ISVStepperContextType } from '../ISVSteps';
import { ISVPlatformConfig } from '../../types';

import * as modFed from '@scality/module-federation';

const useAuth = mockShellHooks.useAuth;

const mockAuthUserData = {
  userData: {
    original: {
      session_state: 'xxx-yyy-zzzz-id',
    },
    id: 'xxx-yyy-zzzz-id',
    token: 'xxx-yyy-zzz-token',
    username: 'Renard ADMIN',
    email: 'renard.admin@scality.com',
    groups: ['user', 'PlatformAdmin'],
  },
  getToken: async (): Promise<string> => {
    return 'xxx-yyy-zzz-token';
  },
};

const mockVeeamPlatform: ISVPlatformConfig = {
  name: 'Veeam',
  logo: <div />,
  id: 'veeam',
  description: 'Veeam Backup & Replication',
  bucketTag: 'veeam',
  fieldOverrides: [],
};
const BUCKET_NAME = 'bucket-name';
const SERVICE_POINT = 's3.test.local';
const ACCESS_KEY = 'access-key';
const SECRET_KEY = 'secret-access-key';

const mockStepperContext: ISVStepperContextType = {
  platform: mockVeeamPlatform,
  config: {
    accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
    enableImmutableBackup: true,
    buckets: [{ name: BUCKET_NAME, tag: 'veeam' }],
    application: VEEAM_BACKUP_REPLICATION,
    accountNameType: 'create',
  },
  setConfig: jest.fn(),
};

const mockSummaryProps: ISVSummaryProps = {
  platform: mockVeeamPlatform,
  accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  buckets: [{ name: BUCKET_NAME, tag: 'veeam' }],
  enableImmutableBackup: true,
};

const mockExistingAccountSummaryProps: ISVSummaryProps = {
  platform: mockVeeamPlatform,
  accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
  accessKey: undefined,
  secretKey: undefined,
  accessKeys: ['access-key-1', 'access-key-2'],
  buckets: [{ name: BUCKET_NAME, tag: 'veeam' }],
  enableImmutableBackup: true,
};

const mockMultiBucketSummaryProps: ISVSummaryProps = {
  platform: mockVeeamPlatform,
  accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
  accessKey: ACCESS_KEY,
  secretKey: SECRET_KEY,
  buckets: [
    { name: BUCKET_NAME, tag: 'veeam' },
    { name: 'bucket-name-2', tag: 'veeam' },
  ],
  enableImmutableBackup: true,
};

const CERTIFICATE_SECTION_TITLE = '1. Certificates';
const CREDENTIALS_SECTION_TITLE = 'Credentials';
const BUCKET_SECTION_TITLE = 'Buckets';
const CONFIGURATION_SUMMARY_TITLE = (platformName: string) =>
  new RegExp(`Information for the ${platformName} configuration`, 'i');
const SUMMARY_TITLE = (platformName) => /preparation summary/;

jest.setTimeout(10000);
const platformName = 'Veeam';

describe('ISVSummary', () => {
  const selectors = {
    title: (platformName) => screen.getByText(SUMMARY_TITLE(platformName)),
    informationSection: (platformName) =>
      screen.getByText(CONFIGURATION_SUMMARY_TITLE(platformName)),
    credentialsSection: () => screen.getByText(CREDENTIALS_SECTION_TITLE),
    bucketSection: () => screen.getByText(BUCKET_SECTION_TITLE),
    certificateSection: () => screen.queryByText(CERTIFICATE_SECTION_TITLE),
    certificateButton: () =>
      screen.queryByRole('button', { name: /Download/i }),
    copyServicePointButton: () =>
      screen.getByRole('button', { name: /copy service point/i }),
    copySecretKeyButton: () =>
      screen.getByRole('button', { name: /copy secret access key/i }),
    copyAccessKeyButton: () =>
      screen.getByRole('button', { name: /copy access key/i }),
    copyBucketNameButton: () =>
      screen.getByRole('button', { name: /copy bucket name/i }),
    copyRegionButton: () =>
      screen.getByRole('button', { name: /copy region/i }),
    copyAllButton: () => screen.getByRole('button', { name: /copy all/i }),
    secretKeyOutput: () => screen.queryByLabelText(/Secret Access key/i),
    accessKeysOutput: () => screen.queryAllByText(/Access key ID/),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

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
    // // Verify the copy buttons
    // await user.click(selectors.copyServicePointButton());
    // await expect(navigator.clipboard.readText()).resolves.toBe(SERVICE_POINT);
    // await user.click(selectors.copyAccessKeyButton());
    // await expect(navigator.clipboard.readText()).resolves.toBe(ACCESS_KEY);
    // await user.click(selectors.copySecretKeyButton());
    // await expect(navigator.clipboard.readText()).resolves.toBe(SECRET_KEY);
    // await user.click(selectors.copyBucketNameButton());
    // await expect(navigator.clipboard.readText()).resolves.toBe(BUCKET_NAME);
    // await user.click(selectors.copyRegionButton());
    // await expect(navigator.clipboard.readText()).resolves.toBe(DEFAULT_REGION);
    // await user.click(selectors.copyAllButton());
    // await expect(navigator.clipboard.readText()).resolves.toBe(
    //   `Service point\t${SERVICE_POINT}\nRegion\t${DEFAULT_REGION}\nAccess key ID\t${ACCESS_KEY}\nSecret Access key\t${SECRET_KEY}\nBuckets name\t${BUCKET_NAME}`,
    // );
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
  it('should render available access keys for existing account', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });
    render(
      <ISVStepperContext.Provider
        value={{
          platform: mockVeeamPlatform,
          config: {
            accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
            enableImmutableBackup: true,
            buckets: [{ name: BUCKET_NAME, tag: 'veeam' }],
            application: 'VEEAM_BACKUP_REPLICATION_XML_VALUE',
            accountNameType: 'existing',
          },
          setConfig: jest.fn(),
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
    expect(selectors.accessKeysOutput()).toHaveLength(2);
  });
  it('should render a list of buckets if more than one bucket is created', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });

    render(
      <ISVStepperContext.Provider
        value={{
          platform: mockVeeamPlatform,
          config: {
            accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
            enableImmutableBackup: true,
            buckets: [
              { name: BUCKET_NAME, tag: 'veeam' },
              { name: 'bucket-name-2', tag: 'veeam' },
            ],
            application: 'VEEAM_BACKUP_REPLICATION_XML_VALUE',
            accountNameType: 'create',
          },
          setConfig: jest.fn(),
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
  it.skip('should copy all information to the clipboard when clicking on the copy all button in single bucket case', async () => {
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

    //E
    const copyAllButton = selectors.copyAllButton();
    expect(copyAllButton).toBeInTheDocument();
    expect(copyAllButton).toBeEnabled();
    await userEvent.click(copyAllButton);
    expect(window.navigator.clipboard.writeText).toHaveBeenCalled();
    //V
    const copiedText = await window.navigator.clipboard.readText();
    expect(copiedText).toBe(
      `Service point\t${SERVICE_POINT}\nRegion\t${DEFAULT_REGION}\nAccess key ID\t${ACCESS_KEY}\nSecret Access key\t${SECRET_KEY}\nBuckets name\t${BUCKET_NAME}`,
    );
  });
  it.skip('should copy all information to the clipboard when clicking on the copy all button in multiple bucket case', async () => {});
  it.skip('should redirect to the first bucket overview page when clicking on the finish button', async () => {
    //S
    useAuth.mockImplementation(() => {
      return mockAuthUserData;
    });
    const mockNavigate = jest.fn();
    jest.spyOn(modFed, 'useBasenameRelativeNavigate').mockImplementation(() => {
      console.log('mocked navigate');
      return mockNavigate;
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
    //E

    const finishButton = screen.getByRole('button', { name: /Finish/i });
    expect(finishButton).toBeInTheDocument();
    expect(finishButton).toBeEnabled();
    await userEvent.click(finishButton);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/buckets/bucket-name');
    });
    expect(finishButton).toBeDisabled();
    //V
  });
  it.skip('should render the ISVSummary with certificate download button', async () => {
    useAuth.mockImplementation(() => {
      return {
        userData: {
          original: {
            session_state: 'xxx-yyy-zzzz-id',
          },
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: ['user', 'PlatformAdmin'],
        },
        getToken: async (): Promise<string> => {
          return 'xxx-yyy-zzz-token';
        },
      };
    });
    render(
      <ISVStepperContext.Provider
        value={{
          platform: mockVeeamPlatform,
          config: {
            accountName: 'Veeam',
            enableImmutableBackup: true,
            buckets: [{ name: BUCKET_NAME, tag: 'veeam' }],
            application: 'VEEAM_BACKUP_REPLICATION_XML_VALUE',
            accountNameType: 'create',
          },
          setConfig: jest.fn(),
        }}
      >
        <Stepper
          steps={[
            {
              label: 'Summary',
              Component: ({ children }: { children: React.ReactNode }) => {
                return (
                  <ISVSummary
                    platform={mockVeeamPlatform}
                    accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
                    accessKey={ACCESS_KEY}
                    secretKey={SECRET_KEY}
                    buckets={[{ name: BUCKET_NAME, tag: 'veeam' }]}
                    enableImmutableBackup={true}
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
  describe('Immutability Section', () => {
    it('should render WORM storage lock for Commvault', async () => {
      //S
      const mockCommvaultPlatform: ISVPlatformConfig = {
        name: 'COMMVAULT',
        logo: <div />,
        id: 'commvault',
        description: 'Commvault',
        bucketTag: 'commvault',
        fieldOverrides: [],
      };
      render(
        <ISVStepperContext.Provider
          value={{
            platform: mockCommvaultPlatform,
            config: {
              accountName: 'Commvault',
              enableImmutableBackup: true,
              buckets: [{ name: BUCKET_NAME, tag: 'commvault' }],
            },
            setConfig: jest.fn(),
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      platform={mockCommvaultPlatform}
                      accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME, tag: 'commvault' }]}
                      enableImmutableBackup={true}
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
      expect(screen.getByText(/WORM/i)).toBeInTheDocument();
    });
    it('should render Immutability Section with help text for Veeam Backup & Replication', async () => {
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
      expect(screen.getByText(/Immutable backup/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Ensure "Make recent backups immutable"/i),
      ).toBeInTheDocument();
    });
    it('should render Immutability Section with help text for Veeam VBO V8', async () => {
      //S
      const mockVeeamVBOV8Platform: ISVPlatformConfig = {
        name: 'Veeam',
        logo: <div />,
        id: 'veeam',
        description: 'Veeam Backup for Microsoft Office 365 V8',
        bucketTag: 'veeam',
        fieldOverrides: [],
      };
      render(
        <ISVStepperContext.Provider
          value={{
            platform: mockVeeamVBOV8Platform,
            config: {
              application: VEEAM_OFFICE_365_V8,
              accountName: 'Veeam',
              enableImmutableBackup: true,
              buckets: [{ name: BUCKET_NAME, tag: 'veeam' }],
            },
            setConfig: jest.fn(),
          }}
        >
          <Stepper
            steps={[
              {
                label: 'Summary',
                Component: ({ children }: { children: React.ReactNode }) => {
                  return (
                    <ISVSummary
                      platform={mockVeeamVBOV8Platform}
                      accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
                      accessKey={ACCESS_KEY}
                      secretKey={SECRET_KEY}
                      buckets={[{ name: BUCKET_NAME, tag: 'veeam' }]}
                      enableImmutableBackup={true}
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
      expect(screen.getByText(/Immutable backup/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Ensure "Make backups immutable"/i),
      ).toBeInTheDocument();
    });
  });
});
