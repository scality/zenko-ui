import React from 'react';
import { MemoryRouter, Route, Switch } from 'react-router';
import { reduxMountAct, reduxRender } from '../../../utils/testUtil';
import { screen } from '@testing-library/react';
import ObjectLockSetting from '../ObjectLockSetting';
describe('ObjectLockSetting', () => {
  const errorMessage = 'This is an error test message';
  it('should render ObjectLockSetting component with no error banner', async () => {
    const component = await reduxMountAct(
      <MemoryRouter>
        <ObjectLockSetting />
      </MemoryRouter>,
    );
    expect(component.find('#zk-error-banner')).toHaveLength(0);
    // react-hook-form is set to validate on change.
    // UseForm hook will update state multiple time and component
    // will re-render as state updates.
    // This will cause state updates to occur even when we haven't fired an action.
    // However my test is only interested in the earlier state.
    // The errors were due to state that updated after the test finished.
    // The hook will clean up properly if unmounted
    component.unmount();
  });
  it('should render ObjectLockSetting component with an error banner', async () => {
    const component = await reduxMountAct(
      <MemoryRouter>
        <ObjectLockSetting />
      </MemoryRouter>,
      {
        uiErrors: {
          errorMsg: errorMessage,
          errorType: 'byComponent',
        },
      },
    );
    expect(component.find('#zk-error-banner')).toHaveLength(1);
    expect(component.find('#zk-error-banner').text()).toContain(errorMessage);
    component.unmount();
  });
  it('should render ObjectLockSetting component with current data filled', async () => {
    const component = await reduxRender(
      <MemoryRouter initialEntries={['/test-bucket']} initialIndex={0}>
        <Switch>
          <Route path="/:bucketName">
            <ObjectLockSetting />
          </Route>
        </Switch>
      </MemoryRouter>,
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
