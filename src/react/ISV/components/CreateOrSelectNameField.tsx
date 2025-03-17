import { FormGroup } from '@scality/core-ui/dist/components/form/Form.component';
import { Stack } from '@scality/core-ui/dist/spacing';
import { Controller, useFormContext } from 'react-hook-form';
import { RadioGroup } from './RadioGroup';
import { Input, Select } from '@scality/core-ui/dist/next';
import { Loader } from '@scality/core-ui/dist/components/loader/Loader.component';
import { JSX, Ref } from 'react';
import { useSearchParams } from 'react-router';
import { SelectRef } from '@scality/core-ui/dist/components/selectv2/Selectv2.component';

export interface Option {
  name: string;
  preferredAssumableRoleArn?: string;
}

type OptionValue = 'create' | 'existing';

interface CreateOrSelectNameFieldProps {
  isExist: boolean;
  status: 'loading' | 'success' | string;
  options: Option[];
  platform: string;
  type: OptionValue;
  fieldName: string;
  label: string;
  tooltip?: JSX.Element;
  onFieldNameChange?: (fieldValue: string) => void;
  onOptionChange?: (value: string) => void;
  children?: React.ReactNode;
  selectRef?: Ref<SelectRef<Option, false, null>>;
}

const FORM_FIELDS = {
  ACCOUNT_NAME_TYPE: 'accountNameType',
  IAM_USER_NAME: 'IAMUserName',
  IAM_USER_NAME_TYPE: 'IAMUserNameType',
  GENERATE_KEY: 'generateKey',
};

const getRadioOptions = (
  isAccount: boolean,
  options: Option[],
  disabled = false,
) => {
  return [
    {
      value: 'create',
      label: `Create a new ${isAccount ? 'Account' : 'IAM User'}`,
      disabled,
    },
    {
      value: 'existing',
      label: `Use an existing ${isAccount ? 'Account' : 'IAM User'}`,
      disabled: options.length === 0,
    },
  ];
};

export const CreateOrSelectNameField = ({
  isExist,
  status,
  options,
  platform,
  type,
  fieldName,
  label,
  tooltip = null,
  onFieldNameChange = null,
  onOptionChange = null,
  selectRef,
  children = null,
}: CreateOrSelectNameFieldProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const isAccount = onFieldNameChange ? true : false;
  const typeFieldName = isAccount
    ? FORM_FIELDS.ACCOUNT_NAME_TYPE
    : FORM_FIELDS.IAM_USER_NAME_TYPE;
  const [searchParams] = useSearchParams();
  const disabled = !!searchParams.get('account');
  const radioOptions = getRadioOptions(isAccount, options, disabled);

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
                value={options.length === 0 ? radioOptions[0].value : value}
                onChange={(value) => {
                  onChange(value);
                  if (onOptionChange) {
                    onOptionChange(value);
                  }
                }}
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
            {type === 'create' || options.length === 0 ? (
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
                render={({ field: { onChange, value } }) => {
                  return (
                    <Select
                      menuPosition="fixed"
                      ref={selectRef}
                      id={fieldName}
                      onChange={(value) => {
                        if (onFieldNameChange) {
                          onFieldNameChange(value);
                        }
                        onChange(value);
                      }}
                      value={value}
                      disabled={disabled && isAccount}
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
                  );
                }}
              />
            )}
            {children}
          </Stack>
        }
      />
    </Stack>
  );
};
