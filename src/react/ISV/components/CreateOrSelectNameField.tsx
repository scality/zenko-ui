import { FormGroup, Stack } from '@scality/core-ui';
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
  status: 'loading' | 'success' | string;
  options: Option[];
  platform: string;
  type: OptionValue;
  fieldName: string;
  label: string;
  tooltip?: JSX.Element;
  disabledExistingReason?: React.ReactNode;
  onFieldNameChange?: (fieldValue: string) => void;
  onOptionChange?: (value: string) => void;
  children?: React.ReactNode;
  selectRef?: Ref<SelectRef<Option, false, null>>;
  errorOverride?: string;
}

const FORM_FIELDS = {
  ACCOUNT_NAME_TYPE: 'accountNameType',
  IAM_USER_NAME: 'IAMUserName',
  IAM_USER_NAME_TYPE: 'IAMUserNameType',
  GENERATE_KEY: 'generateKey',
};

const getRadioOptions = (
  isAccount: boolean,
  disableCreate: boolean,
  disableExisting: boolean,
  disabledExistingReason?: React.ReactNode,
) => {
  return [
    {
      value: 'create',
      label: `Create a new ${isAccount ? 'Account' : 'IAM User'}`,
      disabled: disableCreate,
    },
    {
      value: 'existing',
      label: `Use an existing ${isAccount ? 'Account' : 'IAM User'}`,
      disabled: disableExisting,
      disabledReason: disabledExistingReason,
    },
  ];
};

export const CreateOrSelectNameField = ({
  status,
  options,
  platform,
  type,
  fieldName,
  label,
  tooltip = null,
  disabledExistingReason,
  onFieldNameChange = null,
  onOptionChange = null,
  selectRef,
  children = null,
  errorOverride,
}: CreateOrSelectNameFieldProps) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const isAccount = !!onFieldNameChange;
  const typeFieldName = isAccount ? FORM_FIELDS.ACCOUNT_NAME_TYPE : FORM_FIELDS.IAM_USER_NAME_TYPE;
  const [searchParams] = useSearchParams();
  const paramsAccountName = searchParams.get('account');
  const isParamsAccountNameInOptions = options.some((option) => option.name === paramsAccountName);
  const isExistingDisabled = options.length === 0;
  const isCreateDisabled = isAccount && isParamsAccountNameInOptions;

  const radioOptions = getRadioOptions(isAccount, isCreateDisabled, isExistingDisabled, disabledExistingReason);
  const showTextInput = type === 'create' || options.length === 0;

  const fieldError = errorOverride ?? (errors[fieldName]?.message as string) ?? '';

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
        error={fieldError}
        content={
          <Stack gap="r8" direction="vertical">
            {showTextInput ? (
              <Input
                id={fieldName}
                type="text"
                autoComplete="off"
                placeholder={status === 'success' && options.length !== 0 ? `${platform}` : undefined}
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
                      disabled={isAccount && isParamsAccountNameInOptions}
                      placeholder={`Select existing ${isAccount ? 'account' : 'user'}`}
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
