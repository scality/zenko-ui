import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { mockShellHooks, Wrapper } from '../../utils/testUtil';
import { StartCRRConfigurationButton } from './StartCRRConfigurationButton';

const CurrentUrl = () => {
  const { pathname, search } = useLocation();
  return <output>{`${pathname}${search}`}</output>;
};

// The global setup serves a config without the CRR wizard flag.
const defaultConfig = (useConfig as jest.Mock).getMockImplementation();
const withFeatures = (features: string[]) =>
  (useConfig as jest.Mock).mockImplementation(() => ({ ...defaultConfig?.(), features }));
afterEach(() => {
  (useConfig as jest.Mock).mockImplementation(defaultConfig);
});

describe('StartCRRConfigurationButton', () => {
  it.each([
    [
      'from a bucket, with the bucket and its account preselected',
      { accountName: 'finance', bucketName: 'finance-src' },
      '/create-crr-configuration?account=finance&bucket=finance-src',
    ],
    ['from Locations, with nothing preselected', undefined, '/create-crr-configuration'],
  ])('opens the wizard %s', async (_case, source, url) => {
    withFeatures(['CRR_CONFIGURATOR']);
    render(
      <>
        <StartCRRConfigurationButton source={source} />
        <CurrentUrl />
      </>,
      { wrapper: Wrapper },
    );

    await userEvent.click(screen.getByRole('button', { name: 'Start CRR Configuration' }));

    expect(screen.getByRole('status')).toHaveTextContent(url);
  });

  it('is not offered to users who cannot manage locations', () => {
    withFeatures(['CRR_CONFIGURATOR']);
    const defaultAuth = mockShellHooks.useAuth.getMockImplementation();
    mockShellHooks.useAuth.mockImplementation(() => {
      const auth = defaultAuth?.();
      return { ...auth, userData: { ...auth?.userData, groups: ['user'] } };
    });
    render(<StartCRRConfigurationButton />, { wrapper: Wrapper });
    mockShellHooks.useAuth.mockImplementation(defaultAuth);
    expect(screen.queryByRole('button', { name: 'Start CRR Configuration' })).not.toBeInTheDocument();
  });

  it('is not offered when the CRR wizard is not enabled', () => {
    withFeatures([]);
    render(<StartCRRConfigurationButton />, { wrapper: Wrapper });
    expect(screen.queryByRole('button', { name: 'Start CRR Configuration' })).not.toBeInTheDocument();
  });
});
