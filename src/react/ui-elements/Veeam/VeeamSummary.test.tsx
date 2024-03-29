import { Stepper } from '@scality/core-ui';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../next-architecture/ui/AuthProvider';
import { Wrapper } from '../../utils/testUtil';
import {
  ACCOUNT_SECTION_TITLE,
  BUCKET_SECTION_TITLE,
  CERTIFICATE_SECTION_TITLE,
  CREDENTIALS_SECTION_TITLE,
  DEFAULT_REGION,
  VEEAM_SUMMARY_TITLE,
  VeeamSummary,
} from './VeeamSummary';
import userEvent from '@testing-library/user-event';
import { VEEAM_DEFAULT_ACCOUNT_NAME } from './VeeamConstants';

jest.mock('../../next-architecture/ui/CertificateDownloadButton', () => ({
  CertificateDownloadButton: () => <button type="button">Download</button>,
}));
jest.mock('./useGetS3ServicePoint', () => ({
  useGetS3ServicePoint: () => {
    return {
      s3ServicePoint: SERVICE_POINT,
    };
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
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

const SERVICE_POINT = 's3.test.local';
const ACCESS_KEY = 'access-key';
const SECRET_KEY = 'secret-access-key';
const VEEAM_BUCKET_NAME = 'veeam-bucket-name';

jest.setTimeout(10000);

describe('VeeamSummary', () => {
  const selectors = {
    title: () => screen.getByText(VEEAM_SUMMARY_TITLE),
    accountSection: () => screen.getByText(ACCOUNT_SECTION_TITLE),
    credentialsSection: () => screen.getByText(CREDENTIALS_SECTION_TITLE),
    bucketSection: () => screen.getByText(BUCKET_SECTION_TITLE),
    certificateSection: () => screen.getByText(CERTIFICATE_SECTION_TITLE),
    certificateButton: () => screen.getByRole('button', { name: /Download/i }),
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
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  const WrappedVeeamSummary = ({ children }: { children: React.ReactNode }) => {
    return (
      <VeeamSummary
        accountName={VEEAM_DEFAULT_ACCOUNT_NAME}
        accessKey={ACCESS_KEY}
        secretKey={SECRET_KEY}
        bucketName={VEEAM_BUCKET_NAME}
        enableImmutableBackup={true}
      />
    );
  };

  it('should render VeeamSummary', async () => {
    //S
    mockUseAuth.mockImplementation(() => mockAuthUserData);
    render(
      <Stepper
        steps={[
          {
            label: 'Summary',
            Component: WrappedVeeamSummary,
          },
        ]}
      />,
      { wrapper: Wrapper },
    );
    const user = userEvent.setup();
    //E+V
    expect(selectors.title()).toBeInTheDocument();
    expect(selectors.accountSection()).toBeInTheDocument();
    expect(selectors.credentialsSection()).toBeInTheDocument();
    expect(selectors.bucketSection()).toBeInTheDocument();
    // Verify the copy buttons
    await user.click(selectors.copyServicePointButton());
    await expect(navigator.clipboard.readText()).resolves.toBe(SERVICE_POINT);
    await user.click(selectors.copyAccessKeyButton());
    await expect(navigator.clipboard.readText()).resolves.toBe(ACCESS_KEY);
    await user.click(selectors.copySecretKeyButton());
    await expect(navigator.clipboard.readText()).resolves.toBe(SECRET_KEY);
    await user.click(selectors.copyBucketNameButton());
    await expect(navigator.clipboard.readText()).resolves.toBe(
      VEEAM_BUCKET_NAME,
    );
    await user.click(selectors.copyRegionButton());
    await expect(navigator.clipboard.readText()).resolves.toBe(DEFAULT_REGION);
    await user.click(selectors.copyAllButton());
    await expect(navigator.clipboard.readText()).resolves.toBe(
      `Service point\t${SERVICE_POINT}\nRegion\t${DEFAULT_REGION}\nAccess key ID\t${ACCESS_KEY}\nSecret Access key\t${SECRET_KEY}\nBucket name\t${VEEAM_BUCKET_NAME}`,
    );
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
      { wrapper: Wrapper },
    );
    expect(selectors.certificateSection()).toBeInTheDocument();
    expect(selectors.certificateButton()).toBeInTheDocument();
  });
});
