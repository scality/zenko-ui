import { UseFormReturn } from 'react-hook-form';
import { AccountSelectorFieldDef, FormData } from '../../engine/types';
import { CreateOrSelectNameField } from '../CreateOrSelectNameField';
import { useISVFormContext } from '../ISVFormContext';

type AccountSelectorFieldProps = {
  field: AccountSelectorFieldDef;
  formMethods: UseFormReturn<FormData>;
};

export const AccountSelectorField = ({
  field,
  formMethods,
}: AccountSelectorFieldProps) => {
  const {
    template,
    accounts,
    accountsStatus,
    isAccountExist,
    onAccountSelected,
    resetIAMFields,
  } = useISVFormContext();

  const { watch } = formMethods;
  const accountNameType = watch('accountNameType');

  return (
    <CreateOrSelectNameField
      isExist={isAccountExist}
      status={accountsStatus}
      options={accounts}
      platform={template.id}
      type={accountNameType}
      fieldName="accountName"
      label={field.label || 'Account'}
      tooltip={field.tooltip as React.ReactElement}
      onOptionChange={resetIAMFields}
      onFieldNameChange={onAccountSelected}
    />
  );
};
