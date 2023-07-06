import router from 'react-router';
import BucketCreate, { bucketErrorMessage } from '../BucketCreate';
import { reduxMountAct, reduxRender } from '../../../utils/testUtil';
import { XDM_FEATURE } from '../../../../js/config';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('BucketCreate', () => {
  const errorMessage = 'This is an error test message';
  beforeAll(() => {
    jest.spyOn(router, 'useParams').mockReturnValue({
      accountName: 'accountName',
    });
  });

  it('should render BucketCreate component with no error banner', async () => {
    const component = await reduxMountAct(<BucketCreate />);
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
  it('should render BucketCreate component with an error banner', async () => {
    const component = await reduxMountAct(<BucketCreate />, {
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byComponent',
      },
    });
    expect(component.find('#zk-error-banner')).toHaveLength(1);
    expect(component.find('#zk-error-banner').text()).toContain(errorMessage);
    component.unmount();
  });
  // TESTING INPUT NAME:
  // 1) empty name input
  // 2) name input < 3 characters
  // 3) name input > 63 characters
  const tests = [
    {
      description:
        'should render an input form error when submitting with an empty name',
      testValue: '',
      expectedEmptyNameError: '"Bucket Name" is not allowed to be empty',
      expectedMinLengthNameError: null,
      expectedMaxLengthNameError: null,
      expectedPAtternNameError: null,
    },
    {
      description:
        'should render an input form error when submitting with a name.length < 3',
      testValue: 'ab',
      expectedEmptyNameError: null,
      expectedMinLengthNameError:
        '"Bucket Name" length must be at least 3 characters long',
      expectedMaxLengthNameError: null,
      expectedPAtternNameError: null,
    },
    {
      description:
        'should render an input form error when submitting with a name.length > 63',
      testValue:
        'z4vbhlmekc0a8n85fenehn6ehbwfskmsh4tgoky53ktdmqlwq5xjvi7hm32jfukb',
      expectedEmptyNameError: null,
      expectedMinLengthNameError: null,
      expectedPAtternNameError: null,
      expectedMaxLengthNameError:
        '"Bucket Name" length must be less than or equal to 63 characters long',
    },
    {
      description:
        'should render an input form error when submitting with a name with uppercase letters',
      testValue: 'dozA',
      expectedEmptyNameError: null,
      expectedMinLengthNameError: null,
      expectedPAtternNameError: bucketErrorMessage
        .replaceAll(/\(/g, '\\(')
        .replaceAll(/\)/g, '\\)'),
      expectedMaxLengthNameError: null,
    },
    {
      description:
        'should render an input form error when submitting with a name with special characters',
      testValue: 'doz_',
      expectedEmptyNameError: null,
      expectedMinLengthNameError: null,
      expectedPAtternNameError: bucketErrorMessage
        .replaceAll(/\(/g, '\\(')
        .replaceAll(/\)/g, '\\)'),
      expectedMaxLengthNameError: null,
    },
  ];
  tests.forEach((t) => {
    it(t.description, async () => {
      await reduxRender(<BucketCreate />);

      // NOTE: All validation methods in React Hook Form are treated
      // as async functions, so it's important to wrap async around your act.
      await act(async () => {
        userEvent.type(
          screen.getByRole('textbox', { name: /bucket name */i }),
          `${t.testValue}`,
        );
        userEvent.tab();
      });

      if (t.expectedEmptyNameError !== null) {
        expect(
          screen.getByText(new RegExp(`.*${t.expectedEmptyNameError}.*`, 'i')),
        ).toBeInTheDocument();
      } else if (t.expectedMinLengthNameError !== null) {
        expect(
          screen.getByText(
            new RegExp(`.*${t.expectedMinLengthNameError}.*`, 'i'),
          ),
        ).toBeInTheDocument();
      } else if (t.expectedMaxLengthNameError !== null) {
        expect(
          screen.getByText(
            new RegExp(`.*${t.expectedMaxLengthNameError}.*`, 'i'),
          ),
        ).toBeInTheDocument();
      } else if (t.expectedPAtternNameError !== null) {
        expect(
          screen.getByText(
            new RegExp(`.*${t.expectedPAtternNameError}.*`, 'i'),
          ),
        ).toBeInTheDocument();
      }
    });
  });
  it('should toggle versioning and disable it when enabling object lock', async () => {
    const component = await reduxMountAct(<BucketCreate />);
    await act(async () => {
      const input = component.find('input#name');
      input.getDOMNode().value = 'test';
      input.getDOMNode().dispatchEvent(new Event('input'));
      const objectLockEnabled = component.find(
        'input[placeholder="isObjectLockEnabled"]',
      );
      objectLockEnabled.simulate('change', {
        target: {
          checked: true,
        },
      });
    });
    expect(
      component.find('input[placeholder="Versioning"]').getDOMNode().checked,
    ).toBe(true);
    expect(
      component.find('input[placeholder="Versioning"]').getDOMNode().disabled,
    ).toBe(true);
    component.unmount();
  });
  it('should toggle versioning and disable it when enabling Async Metadata updates', async () => {
    const component = await reduxMountAct(<BucketCreate />, {
      auth: {
        config: {
          features: [XDM_FEATURE],
        },
      },
    });
    await act(async () => {
      const input = component.find('input#name');
      input.getDOMNode().value = 'test';
      input.getDOMNode().dispatchEvent(new Event('input'));
      const isAsyncNotification = component.find(
        'input[placeholder="isAsyncNotification"]',
      );
      isAsyncNotification.simulate('change', {
        target: {
          checked: true,
        },
      });
    });
    expect(
      component.find('input[placeholder="Versioning"]').getDOMNode().checked,
    ).toBe(true);
    expect(
      component.find('input[placeholder="Versioning"]').getDOMNode().disabled,
    ).toBe(true);
    component.unmount();
  });
  it('should disable cold location as a source storage location when creating a bucket', async () => {
    const coldLocation = 'europe25-myroom-cold';
    //E
    await reduxRender(<BucketCreate />, {
      configuration: {
        latest: {
          locations: {
            [coldLocation]: {
              locationType: 'location-dmf-v1',
              name: coldLocation,
              isCold: true,
              details: {
                endpoint: 'ws://tape.myroom.europe25.cnes:8181',
                repoId: ['repoId'],
                nsId: 'nsId',
                username: 'username',
                password: 'password',
              },
            },
          },
        },
      },
    });
    await userEvent.click(screen.getByText('Location Name'));
    //V
    expect(
      screen.queryByRole('option', { name: new RegExp(coldLocation, 'i') }),
    ).toHaveAttribute('aria-disabled', 'true');
  });
  it('should disable versioning for Microsoft Azure Blob Storage', () => {
    const azureblobstorage = 'azureblobstorage';
    reduxRender(<BucketCreate />, {
      configuration: {
        latest: {
          locations: {
            [azureblobstorage]: {
              locationType: 'location-azure-v1',
              name: azureblobstorage,
              details: {},
            },
          },
        },
      },
    });
    userEvent.click(screen.getByText('Location Name'));
    userEvent.click(
      screen.getByRole('option', { name: new RegExp(azureblobstorage, 'i') }),
    );
    //V
    expect(screen.getByLabelText('Versioning')).toBeDisabled();
    //E
    userEvent.click(screen.getByLabelText('Object-lock'));
    //Verify the versioning is off even though set object-lock for Azure Blob Storage
    expect(screen.getByLabelText('Versioning')).toBeDisabled();
    expect(screen.getByLabelText('Versioning')).not.toBeChecked();
  });
});
