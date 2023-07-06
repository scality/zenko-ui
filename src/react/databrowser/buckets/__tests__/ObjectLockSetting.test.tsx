import { renderWithRouterMatch } from '../../../utils/testUtil';
import { screen } from '@testing-library/react';
import ObjectLockSetting from '../ObjectLockSetting';
describe('ObjectLockSetting', () => {
  const errorMessage = 'This is an error test message';
  it('should render ObjectLockSetting component with no error banner', async () => {
    renderWithRouterMatch(<ObjectLockSetting />, {
      path: '/:bucketName',
      route: '/test-bucket',
    });
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
  });
  it('should render ObjectLockSetting component with an error banner', async () => {
    renderWithRouterMatch(
      <ObjectLockSetting />,
      {
        path: '/:bucketName',
        route: '/test-bucket',
      },
      {
        uiErrors: {
          errorMsg: errorMessage,
          errorType: 'byComponent',
        },
      },
    );
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  it('should render ObjectLockSetting component with current data filled', async () => {
    renderWithRouterMatch(
      <ObjectLockSetting />,
      {
        path: '/:bucketName',
        route: '/test-bucket',
      },
      {
        s3: {
          bucketInfo: {
            name: 'test-bucket',
            objectLockConfiguration: {
              ObjectLockEnabled: 'Enabled',
              Rule: {
                DefaultRetention: {
                  Days: 1,
                  Mode: 'GOVERNANCE',
                },
              },
            },
          },
        },
      },
    );

    expect(screen.getByText(/Enabled/i)).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: /governance/i, checked: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
    expect(screen.getByDisplayValue(/days/i)).toBeInTheDocument();
  });
});
