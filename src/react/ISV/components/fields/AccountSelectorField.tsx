import type { UseFormReturn } from 'react-hook-form';
import type { AccountSelectorFieldDef, FormData } from '../../engine/types';
import { CreateOrSelectNameField } from '../CreateOrSelectNameField';
import { useISVFormContext } from '../ISVFormContext';

type AccountSelectorFieldProps = {
  field: AccountSelectorFieldDef;
  formMethods: UseFormReturn<FormData>;
};

export const AccountSelectorField = ({ field, formMethods }: AccountSelectorFieldProps) => {
  const { platform, accounts, accountsStatus, isAccountExist, onAccountSelected, resetIAMFields } = useISVFormContext();

  const { watch } = formMethods;
  const accountNameType = watch('accountNameType');

  return (
    <CreateOrSelectNameField
      isExist={isAccountExist}
      status={accountsStatus}
      options={accounts}
      platform={platform.id}
      type={accountNameType}
      fieldName="accountName"
      label={field.label || 'Account'}
      tooltip={field.tooltip as React.ReactElement}
      onOptionChange={(mode: string) => {
        const firstAccountName = accounts[0]?.name;
        resetIAMFields(mode as 'create' | 'existing', firstAccountName);
        if (mode === 'existing' && firstAccountName) {
          onAccountSelected(firstAccountName);
        }
      }}
      onFieldNameChange={onAccountSelected}
    />
  );
};
