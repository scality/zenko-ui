import { Checkbox } from '@scality/core-ui/dist/components/checkbox/Checkbox.component';

import { FormGroup } from '@scality/core-ui/dist/components/form/Form.component';
import { Stack } from '@scality/core-ui/dist/spacing';
import { Controller, useFormContext } from 'react-hook-form';
import { RadioGroup } from './RadioGroup';
import { Input, Select } from '@scality/core-ui/dist/next';
import { Loader } from '@scality/core-ui/dist/components/loader/Loader.component';
import { JSX } from 'react';

interface Option {
  name: string;
  preferredAssumableRoleArn?: string;
}

interface OnFieldNameChangeProps {
  getIAMUsersMutation?: {
    mutate: (roleArn: string) => void;
  };
  setAccount?: (account: Option) => void;
}

interface NameFieldProps {
  isExist: boolean;
  status: 'loading' | 'success' | string;
  options: Option[];
  platform: string;
  type: 'create' | 'existing';
  fieldName: string;
  label: string;
  tooltip?: JSX.Element;
  onFieldNameChange?: OnFieldNameChangeProps | null;
}

const FORM_FIELDS = {
  ACCOUNT_NAME_TYPE: 'accountNameType',
  IAM_USER_NAME_TYPE: 'IAMUserNameType',
  GENERATE_KEY: 'generateKey',
};

const accountTypeOptions = [
  {
    value: 'create',
    label: 'Create a new account',
  },
  {
    value: 'existing',
    label: 'Use an existing Account',
  },
];

const IAMUserTypeOptions = [
  {
    value: 'create',
    label: 'Create a new IAM User',
  },
  {
    value: 'existing',
    label: 'Use an existing IAM User',
  },
];

export const NameField = ({
  isExist,
  status,
  options,
  platform,
  type,
  fieldName,
  label,
  tooltip = null,
  onFieldNameChange = null,
}: NameFieldProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const isAccount = onFieldNameChange ? true : false;
  const typeFieldName = isAccount
    ? FORM_FIELDS.ACCOUNT_NAME_TYPE
    : FORM_FIELDS.IAM_USER_NAME_TYPE;
  const radioOptions = isAccount ? accountTypeOptions : IAMUserTypeOptions;

  return (
    <Stack gap="r8" direction="vertical">
      <FormGroup
        id={fieldName}
        label={label}
        required
        labelHelpTooltip={tooltip}
        content={
          <Controller
            name={typeFieldName}
            control={control}
            defaultValue={type}
            render={({ field: { onChange, value } }) => (
              <RadioGroup
                options={radioOptions}
                value={value}
                onChange={onChange}
                direction="vertical"
              />
            )}
          />
        }
      />

      <FormGroup
        id={fieldName}
        label={isAccount ? 'Account Name' : 'IAM User Name'}
        required
        helpErrorPosition="bottom"
        error={
          isExist && type === 'create'
            ? `${isAccount ? 'Account' : 'IAM User'} name already exists`
            : (errors[fieldName]?.message as string) ?? ''
        }
        content={
          <Stack gap="r8" direction="vertical">
            {type === 'create' ? (
              <Input
                id={fieldName}
                type="text"
                autoComplete="off"
                placeholder={
                  status === 'success' && options.length !== 0
                    ? `${platform}`
                    : undefined
                }
                {...register(fieldName)}
              />
            ) : (
              <Controller
                name={fieldName}
                control={control}
                defaultValue={options.length > 0 ? options[0].name : ''}
                render={({ field: { onChange, value } }) => (
                  <Select
                    menuPosition="fixed"
                    id={fieldName}
                    onChange={(value) => {
                      if (onFieldNameChange) {
                        const { getIAMUsersMutation, setAccount } =
                          onFieldNameChange;
                        if (getIAMUsersMutation) {
                          const roleArn = options.find(
                            (option) => option.name === value,
                          ).preferredAssumableRoleArn;
                          getIAMUsersMutation.mutate(roleArn);
                        }
                        if (isAccount) {
                          const account = options.find(
                            (option) => option.name === value,
                          );
                          setAccount(account);
                        }
                      }
                      onChange(value);
                    }}
                    value={value}
                    placeholder={`Select existing ${
                      isAccount ? 'account' : 'user'
                    }`}
                  >
                    {status === 'loading' && (
                      <Select.Option
                        disabled
                        disabledReason="Please wait until the list is loaded"
                        key="loading"
                        value="loading"
                        icon={<Loader size="small" />}
                      >
                        Loading...
                      </Select.Option>
                    )}
                    {options.map((item) => (
                      <Select.Option key={item.name} value={item.name}>
                        {item.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
            )}

            {!isAccount && type === 'existing' && (
              <Controller
                name={FORM_FIELDS.GENERATE_KEY}
                control={control}
                render={({ field: { onChange, value } }) => {
                  return (
                    <Checkbox
                      id={FORM_FIELDS.GENERATE_KEY}
                      value={value}
                      label="Generate a new set of AK/SK"
                      onChange={onChange}
                      checked={value}
                    />
                  );
                }}
              />
            )}
          </Stack>
        }
      />
    </Stack>
  );
};
