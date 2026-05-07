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

export function getRadioOptions(
  isAccount: boolean,
  disableCreate: boolean,
  disableExisting: boolean,
  disabledExistingReason?: string,
) {
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
}

const renderNameInput = (
  fieldName: string,
  status: string,
  options: Option[],
  platform: string,
  register: ReturnType<typeof useFormContext>['register'],
) => {
  const showPlaceholder = status === 'success' && options.length !== 0;
  return (
    <Input
      id={fieldName}
      type="text"
      autoComplete="off"
      placeholder={showPlaceholder ? platform : undefined}
      {...register(fieldName)}
    />
  );
};

const renderNameSelect = (
  fieldName: string,
  status: string,
  options: Option[],
  isAccount: boolean,
  isSelectAccountDisabled: boolean,
  onFieldNameChange: ((fieldValue: string) => void) | undefined,
  control: ReturnType<typeof useFormContext>['control'],
  selectRef: Ref<SelectRef<Option, false, null>> | undefined,
) => (
  <Controller
    name={fieldName}
    control={control}
    defaultValue={options.length > 0 ? options[0].name : ''}
    render={({ field: { onChange, value } }) => (
      <Select
        menuPosition="fixed"
        ref={selectRef}
        id={fieldName}
        onChange={(selectedValue) => {
          onFieldNameChange?.(selectedValue);
          onChange(selectedValue);
        }}
        value={value}
        disabled={isSelectAccountDisabled && isAccount}
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
    )}
  />
);

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

  const isAccount = !!onFieldNameChange;
  const typeFieldName = isAccount ? FORM_FIELDS.ACCOUNT_NAME_TYPE : FORM_FIELDS.IAM_USER_NAME_TYPE;

  const [searchParams] = useSearchParams();
  const paramsAccountName = searchParams.get('account');
  const isParamsAccountNameInOptions = options.some((option) => option.name === paramsAccountName);

  const isExistingDisabled = (isAccount && isParamsAccountNameInOptions && isExist) || options.length === 0;
  const isCreateDisabled = isAccount && isExist && isParamsAccountNameInOptions;
  const isSelectAccountDisabled = isAccount && isParamsAccountNameInOptions && isExist;

  const disabledExistingReason =
    !isAccount && options.length === 0 ? 'No existing IAM Users available' : undefined;

  const radioOptions = getRadioOptions(isAccount, isCreateDisabled, isExistingDisabled, disabledExistingReason);

  const showCreateInput = type === 'create' || options.length === 0;

  const existsError = isExist && type === 'create'
    ? `${isAccount ? 'Account' : 'IAM User'} name already exists`
    : ((errors[fieldName]?.message as string) ?? '');

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
                onChange={(selectedValue) => {
                  onChange(selectedValue);
                  onOptionChange?.(selectedValue);
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
        error={existsError}
        content={
          <Stack gap="r8" direction="vertical">
            {showCreateInput
              ? renderNameInput(fieldName, status, options, platform, register)
              : renderNameSelect(
                  fieldName,
                  status,
                  options,
                  isAccount,
                  isSelectAccountDisabled,
                  onFieldNameChange,
                  control,
                  selectRef,
                )}
            {children}
          </Stack>
        }
      />
    </Stack>
  );
};
