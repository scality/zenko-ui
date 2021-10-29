import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import ObjectLockRetentionSettings from './ObjectLockRetentionSettings';
import { reduxMountAct } from '../../../utils/test';
import { act } from 'react-dom/test-utils';

describe('ObjectLockRetentionSettings', () => {
  it('should enable retention settings when default retention is checked', async () => {
    const Form = () => {
      const methods = useForm();

      return (
        <FormProvider {...methods}>
          <ObjectLockRetentionSettings />
        </FormProvider>
      );
    };

    const component = await reduxMountAct(<Form />);

    await act(async () => {
      const objectLockDefaultRetentionEnabled = component.find(
        'input[placeholder="isDefaultRetentionEnabled"]',
      );

      objectLockDefaultRetentionEnabled.simulate('change', {
        target: { checked: true },
      });
    });

    expect(
      component.find('input[value="GOVERNANCE"]').getDOMNode().disabled,
    ).toBe(false);
    expect(
      component.find('input[value="COMPLIANCE"]').getDOMNode().disabled,
    ).toBe(false);
    expect(
      component.find('input[name="retentionPeriod"]').getDOMNode().disabled,
    ).toBe(false);
    expect(
      component
        .find('select[placeholder="retentionPeriodFrequencyChoice"]')
        .getDOMNode().disabled,
    ).toBe(false);
  });

  it('should display retention period error message', async () => {
    const Form = () => {
      const methods = useForm();

      return (
        <FormProvider
          {...{
            ...methods,
            errors: { retentionPeriod: { message: 'Expected error' } },
          }}
        >
          <ObjectLockRetentionSettings />
        </FormProvider>
      );
    };

    const component = await reduxMountAct(<Form />);

    await act(async () => {
      const objectLockDefaultRetentionEnabled = component.find(
        'input[placeholder="isDefaultRetentionEnabled"]',
      );

      objectLockDefaultRetentionEnabled.simulate('change', {
        target: { checked: true },
      });
    });

    expect(component.find('#error-retentionPeriod').text()).toContain(
      'Expected error',
    );
  });
});
