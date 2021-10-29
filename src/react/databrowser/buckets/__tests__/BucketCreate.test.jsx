import BucketCreate from '../BucketCreate';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { reduxMountAct } from '../../../utils/test';

describe('BucketCreate', () => {
  const errorMessage = 'This is an error test message';

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
      expectedEmptyNameError: ' "Name" is not allowed to be empty ',
      expectedMinLengthNameError: null,
      expectedMaxLengthNameError: null,
    },
    {
      description:
        'should render an input form error when submitting with an name.length < 3',
      testValue: 'ab',
      expectedEmptyNameError: null,
      expectedMinLengthNameError:
        ' "Name" length must be at least 3 characters long ',
      expectedMaxLengthNameError: null,
    },
    {
      description:
        'should render an input form error when submitting with an name.length > 63',
      testValue:
        'Z4VbHlmEKC0a8n85FEneHN6EhBwFSkmSh4tGOKy53ktdmQlwq5xJVi7hm32jFuKB',
      expectedEmptyNameError: null,
      expectedMinLengthNameError: null,
      expectedMaxLengthNameError:
        ' "Name" length must be less than or equal to 63 characters long ',
    },
  ];

  tests.forEach(t => {
    it(t.description, async () => {
      const component = await reduxMountAct(<BucketCreate />);

      await act(async () => {
        const input = component.find('input#name');
        input.getDOMNode().value = t.testValue;
        input.getDOMNode().dispatchEvent(new Event('input'));

        component.find('form').simulate('submit');
      });

      if (t.expectedEmptyNameError !== null) {
        expect(component.find('ErrorInput#error-name').text()).toContain(
          t.expectedEmptyNameError,
        );
      } else if (t.expectedMinLengthNameError !== null) {
        expect(component.find('ErrorInput#error-name').text()).toContain(
          t.expectedMinLengthNameError,
        );
      } else if (t.expectedMaxLengthNameError !== null) {
        expect(component.find('ErrorInput#error-name').text()).toContain(
          t.expectedMaxLengthNameError,
        );
      }
      component.unmount();
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

      objectLockEnabled.simulate('change', { target: { checked: true } });
    });

    expect(
      component.find('input[placeholder="Versioning"]').getDOMNode().checked,
    ).toBe(true);
    expect(
      component.find('input[placeholder="Versioning"]').getDOMNode().disabled,
    ).toBe(true);

    component.unmount();
  });
});
