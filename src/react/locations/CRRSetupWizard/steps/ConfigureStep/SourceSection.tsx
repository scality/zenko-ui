import { FormGroup, FormSection } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { RadioGroup } from '../../../../ISV/components/RadioGroup';
import { useListAccounts } from '../../../../next-architecture/domain/business/accounts';
import { useAccessibleAccountsAdapter } from '../../../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { NoOpMetricsAdapter } from '../../../../ui-elements/SelectAccountIAMRole';
import type { ConfigureFormValues } from './schema';

const RADIO_OPTIONS = [
  { value: 'create', label: 'Create a new Account' },
  { value: 'existing', label: 'Use an existing Account' },
];

export const SourceSection = () => {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const accountNameType = watch('accountNameType');
  const accountNameError = touchedFields.accountName ? errors.accountName?.message : undefined;

  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = useMemo(() => new NoOpMetricsAdapter(), []);
  const { accounts: accountsResult } = useListAccounts({ accessibleAccountsAdapter, metricsAdapter });
  const accounts = useMemo(
    () =>
      accountsResult.status === 'success'
        ? accountsResult.value.filter((account) => account.name !== 'scality-internal-services')
        : [],
    [accountsResult],
  );

  const canPickExisting = accounts.length > 0;
  const radioOptions = useMemo(
    () => RADIO_OPTIONS.map((opt) => (opt.value === 'existing' && !canPickExisting ? { ...opt, disabled: true } : opt)),
    [canPickExisting],
  );

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Source' }}>
      <FormGroup
        id="accountNameType"
        direction="horizontal"
        label="Account"
        required
        helpErrorPosition="bottom"
        content={
          <Controller
            name="accountNameType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                options={radioOptions}
                value={field.value}
                onChange={(next) => {
                  field.onChange(next);
                  setValue('accountName', '', { shouldValidate: true, shouldDirty: false, shouldTouch: false });
                }}
                direction="vertical"
              />
            )}
          />
        }
      />
      <FormGroup
        id="accountName"
        direction="horizontal"
        label="Account Name"
        required
        helpErrorPosition="bottom"
        error={accountNameError}
        content={
          accountNameType === 'existing' && canPickExisting ? (
            <Controller
              name="accountName"
              control={control}
              render={({ field }) => (
                <Select
                  id="accountName"
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  placeholder="Select existing account"
                >
                  {accounts.map((account) => (
                    <Select.Option key={account.name} value={account.name}>
                      {account.name}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          ) : (
            <Input id="accountName" autoComplete="off" {...register('accountName')} />
          )
        }
      />
    </FormSection>
  );
};
