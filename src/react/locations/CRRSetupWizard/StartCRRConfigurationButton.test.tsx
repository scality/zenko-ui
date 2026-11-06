import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { mockShellHooks, Wrapper } from '../../utils/testUtil';
import { StartCRRConfigurationButton } from './StartCRRConfigurationButton';

const CurrentUrl = () => {
  const { pathname, search } = useLocation();
  return <output>{`${pathname}${search}`}</output>;
};

describe('StartCRRConfigurationButton', () => {
  it.each([
    [
      'from a bucket, with the bucket and its account preselected',
      { accountName: 'finance', bucketName: 'finance-src' },
      '/create-crr-configuration?account=finance&bucket=finance-src',
    ],
    ['from Locations, with nothing preselected', undefined, '/create-crr-configuration'],
  ])('opens the wizard %s', async (_case, source, url) => {
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
    const defaultAuth = mockShellHooks.useAuth.getMockImplementation();
    mockShellHooks.useAuth.mockImplementation(() => {
      const auth = defaultAuth?.();
      return { ...auth, userData: { ...auth?.userData, groups: ['user'] } };
    });
    render(<StartCRRConfigurationButton />, { wrapper: Wrapper });
    mockShellHooks.useAuth.mockImplementation(defaultAuth);
    expect(screen.queryByRole('button', { name: 'Start CRR Configuration' })).not.toBeInTheDocument();
  });
});
