import { FormProvider, useForm } from 'react-hook-form';
import ObjectLockRetentionSettings from './ObjectLockRetentionSettings';
import { reduxMountAct } from '../../utils/testUtil';
import { act } from 'react-dom/test-utils';
import { useEffect } from 'react';
describe('ObjectLockRetentionSettings', () => {
  it('should enable retention settings when default retention is checked', async () => {
    const Form = () => {
      const methods = useForm({
        defaultValues: {
          isObjectLockEnabled: true,
        },
      });
      return (
        <FormProvider {...methods}>
          <ObjectLockRetentionSettings />
        </FormProvider>
      );
    };

    const component = await reduxMountAct(<Form />);

    const objectLockDefaultRetentionEnabled = component.find(
      'input[placeholder="isDefaultRetentionEnabled"]',
    );

    await act(async () => {
      objectLockDefaultRetentionEnabled.simulate('change', {
        target: {
          checked: true,
        },
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
      component.find('input[id="retentionPeriodFrequencyChoice"]').getDOMNode()
        .disabled,
    ).toBe(false);
  });
  it('should display retention period error message', async () => {
    const Form = () => {
      const methods = useForm({
        defaultValues: {
          isObjectLockEnabled: true,
        },
      });
      useEffect(() => {
        methods.setError('retentionPeriod', {
          message: 'Expected error',
        });
      }, []);

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
        target: {
          checked: true,
        },
      });
    });
    expect(
      component
        .find(
          `#${component
            .find('input[name="retentionPeriod"]')
            .getDOMNode()
            .getAttribute('aria-describedby')}`,
        )
        .first()
        .text(),
    ).toContain('Expected error');
  });
});
