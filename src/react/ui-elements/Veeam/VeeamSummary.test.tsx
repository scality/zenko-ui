import { Stepper } from '@scality/core-ui';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from 'styled-components';
import { AccountsLocationsEndpointsAdapterProvider } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useAuth } from '../../next-architecture/ui/AuthProvider';
import { _ConfigContext } from '../../next-architecture/ui/ConfigProvider';
import {
  TEST_API_BASE_URL,
  theme,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import {
  ACCOUNT_SECTION_TITLE,
  BUCKET_SECTION_TITLE,
  CERTIFICATE_SECTION_TITLE,
  CREDENTIALS_SECTION_TITLE,
  VEEAM_SUMMARY_TITLE,
  VeeamSummary,
} from './VeeamSummary';
import { useGetS3ServicePoint } from './useGetS3ServicePoint';

jest.mock('../../next-architecture/ui/CertificateDownloadButton', () => ({
  CertificateDownloadButton: () => <button type="button">Download</button>,
}));
jest.mock('./useGetS3ServicePoint', () => {
  return {
    useGetS3ServicePoint: jest.fn(),
  };
});

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseGetS3ServicePoint = useGetS3ServicePoint as jest.MockedFunction<
  typeof useGetS3ServicePoint
>;
const mockServicePoint = 'mock-service-point';
const mockAuthUserData = {
  userData: {
    id: 'xxx-yyy-zzzz-id',
    token: 'xxx-yyy-zzz-token',
    username: 'Renard ADMIN',
    email: 'renard.admin@scality.com',
    roles: ['StorageManager'],
    groups: ['user', 'StorageManager'],
  },
};
const config = {
  ...zenkoUITestConfig,
  iamInternalFQDN: TEST_API_BASE_URL,
  s3InternalFQDN: TEST_API_BASE_URL,
  basePath: '',
  features: ['Veeam'],
};

const VeeamSummaryWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AccountsLocationsEndpointsAdapterProvider>
        <_ConfigContext.Provider value={config}>
          <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </_ConfigContext.Provider>
      </AccountsLocationsEndpointsAdapterProvider>
    </QueryClientProvider>
  );
};

describe('VeeamSummary', () => {
  const selectors = {
    title: () => screen.getByText(VEEAM_SUMMARY_TITLE),
    accountSection: () => screen.getByText(ACCOUNT_SECTION_TITLE),
    credentialsSection: () => screen.getByText(CREDENTIALS_SECTION_TITLE),
    bucketSection: () => screen.getByText(BUCKET_SECTION_TITLE),
    certificateSection: () => screen.getByText(CERTIFICATE_SECTION_TITLE),
    certificateButton: () => screen.getByRole('button', { name: /Download/i }),
  };

  beforeEach(() => {
    mockUseAuth.mockImplementation(() => mockAuthUserData);
    mockUseGetS3ServicePoint.mockImplementation(() => ({
      s3ServicePoint: '',
    }));
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render VeeamSummary', () => {
    render(
      <Stepper
        steps={[
          {
            label: 'Summary',
            Component: VeeamSummary,
          },
        ]}
      />,
      {
        wrapper: VeeamSummaryWrapper,
      },
    );

    expect(selectors.title()).toBeInTheDocument();
    expect(selectors.accountSection()).toBeInTheDocument();
    expect(selectors.credentialsSection()).toBeInTheDocument();
    expect(selectors.bucketSection()).toBeInTheDocument();
  });

  it('should render the VeeamSumamry with certificate download button', async () => {
    mockUseAuth.mockImplementation(() => ({
      userData: {
        id: 'xxx-yyy-zzzz-id',
        token: 'xxx-yyy-zzz-token',
        username: 'Renard ADMIN',
        email: 'renard.admin@scality.com',
        roles: ['PlatformAdmin'],
        groups: ['user', 'PlatformAdmin'],
      },
    }));

    render(
      <Stepper
        steps={[
          {
            label: 'Summary',
            Component: VeeamSummary,
          },
        ]}
      />,
      {
        wrapper: VeeamSummaryWrapper,
      },
    );

    expect(selectors.certificateSection()).toBeInTheDocument();
    expect(selectors.certificateButton()).toBeInTheDocument();
  });

  it('should diplay s3 service point', async () => {
    mockUseGetS3ServicePoint.mockImplementation(() => ({
      s3ServicePoint: mockServicePoint,
    }));

    render(
      <Stepper
        steps={[
          {
            label: 'Summary',
            Component: VeeamSummary,
          },
        ]}
      />,
      {
        wrapper: VeeamSummaryWrapper,
      },
    );

    expect(screen.getByText(mockServicePoint)).toBeInTheDocument();
  });
});
