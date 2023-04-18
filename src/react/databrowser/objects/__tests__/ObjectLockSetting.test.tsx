import { MemoryRouter, Route, Switch } from 'react-router';
import { reduxMountAct } from '../../../utils/testUtil';
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
    const component = await reduxMountAct(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/test-bucket/objects',
            search: '?prefix=object&versionId=1',
          },
        ]}
        initialIndex={0}
      >
        <Switch>
          <Route path="/:bucketName">
            <ObjectLockSetting />
          </Route>
        </Switch>
      </MemoryRouter>,
      {
        s3: {
          objectMetadata: {
            bucketName: 'test-bucket',
            objectRetention: {
              mode: 'GOVERNANCE',
              retainUntilDate: '2022-01-31 00:00:00"',
            },
          },
        },
      },
    );
    expect(component.find('ToggleSwitch#edit-retention').prop('disabled')).toBe(
      true,
    );
    expect(component.find('ToggleSwitch#edit-retention').prop('label')).toBe(
      'Active',
    );
    expect(
      component.find('input[value="GOVERNANCE"]').getDOMNode().checked,
    ).toBe(true);
    expect(
      component.find('input[name="retention-until-date"]').getDOMNode().value,
    ).toBe('2022-01-31');
    component.unmount();
  });
  it('should disable the governance option for ObjectLockSetting component ', async () => {
    const component = await reduxMountAct(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/test-bucket/objects',
            search: '?prefix=object&versionId=1',
          },
        ]}
        initialIndex={0}
      >
        <Switch>
          <Route path="/:bucketName">
            <ObjectLockSetting />
          </Route>
        </Switch>
      </MemoryRouter>,
      {
        s3: {
          objectMetadata: {
            bucketName: 'test-bucket',
            objectRetention: {
              mode: 'COMPLIANCE',
              retainUntilDate: '2022-01-31 00:00:00"',
            },
          },
        },
      },
    );
    expect(component.find('ToggleSwitch#edit-retention').prop('disabled')).toBe(
      true,
    );
    expect(component.find('ToggleSwitch#edit-retention').prop('label')).toBe(
      'Active',
    );
    expect(
      component.find('input[value="COMPLIANCE"]').getDOMNode().checked,
    ).toBe(true);
    expect(
      component.find('input[value="GOVERNANCE"]').getDOMNode().disabled,
    ).toBe(true);
    expect(
      component.find('input[name="retention-until-date"]').getDOMNode().value,
    ).toBe('2022-01-31');
    component.unmount();
  });
});
