import { FormProvider, useForm } from 'react-hook-form';
import ObjectLockRetentionSettings from './ObjectLockRetentionSettings';
import { reduxRender } from '../../utils/testUtil';
import { fireEvent, screen } from '@testing-library/react';
import { useEffect } from 'react';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../types/typeGuards';

describe('ObjectLockRetentionSettings', () => {
  const selectors = {
    defaultRetention: () => screen.getByLabelText(/Default Retention/i),
    governanceRetentionMode: () => screen.getByLabelText(/Governance/i),
    complianceRetentionMode: () => screen.getByLabelText(/Compliance/i),
    retentionPeriodInput: () => screen.getByLabelText(/retention period/i),
    retentionPeriodDaysOption: () =>
      screen.getByRole('option', { name: /days/i }),
    retentionPeriodYearsOption: () =>
      screen.getByRole('option', { name: /years/i }),
    objectlock: () => screen.getByLabelText(/object-lock/i),
  };
  it('should enable retention settings when default retention is checked', () => {
    //S
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

    const {
      component: { container },
    } = reduxRender(<Form />);
    //E
    userEvent.click(selectors.defaultRetention());
    //V
    expect(selectors.governanceRetentionMode()).toBeEnabled();
    expect(selectors.complianceRetentionMode()).toBeEnabled();
    expect(selectors.retentionPeriodInput()).toBeEnabled();
    userEvent.click(selectors.retentionPeriodInput());

    const selector = notFalsyTypeGuard(
      container.querySelector('.sc-select__control'),
    );
    fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
    expect(selectors.retentionPeriodYearsOption()).toBeInTheDocument();
    expect(selectors.retentionPeriodDaysOption()).toBeInTheDocument();
  });
  it('should disable the object-lock while editing on bucket that was created with object-lock enabled and should disable retention setting since retention is not active', () => {
    //S
    const Form = () => {
      const methods = useForm({
        defaultValues: {
          isObjectLockEnabled: true,
          isDefaultRetentionEnabled: false,
        },
      });
      return (
        <FormProvider {...methods}>
          <ObjectLockRetentionSettings isEditRetentionSetting />
        </FormProvider>
      );
    };
    reduxRender(<Form />);
    //E+V
    expect(selectors.objectlock()).toBeChecked();
    expect(selectors.objectlock()).toBeDisabled();
    expect(selectors.defaultRetention()).not.toBeChecked();
    expect(selectors.defaultRetention()).toBeEnabled();
    // The retention setting should be disabled since default retention is not enabled
    expect(selectors.governanceRetentionMode()).not.toBeChecked();
    expect(selectors.governanceRetentionMode()).toBeDisabled();
    expect(selectors.complianceRetentionMode()).not.toBeChecked();
    expect(selectors.complianceRetentionMode()).toBeDisabled();
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
          <ObjectLockRetentionSettings isLocationAzureOrGcpSelected={false} />
        </FormProvider>
      );
    };

    reduxRender(<Form />);
    userEvent.click(selectors.defaultRetention());
    expect(screen.getByText(/expected error/i)).toBeInTheDocument();
  });
});
