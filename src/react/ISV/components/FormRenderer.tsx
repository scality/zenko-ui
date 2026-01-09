import { FormGroup, Toggle } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { Controller, UseFormReturn } from 'react-hook-form';
import {
  FieldDef,
  FormData,
  SelectFieldDef,
  ToggleFieldDef,
  TextFieldDef,
  NumberFieldDef,
  CustomFieldDef,
  BucketArrayFieldDef,
  AccountSelectorFieldDef,
  IAMUserSelectorFieldDef,
} from '../engine/types';
import { BucketArrayField, AccountSelectorField, IAMUserSelectorField } from './fields';

type FormRendererContext = {
  platform?: string;
};

type FormRendererProps = {
  fields: FieldDef[];
  formMethods: UseFormReturn<FormData>;
  context?: FormRendererContext;
};

/**
 * Renders a single field based on its type definition.
 */
const renderField = (
  field: FieldDef,
  formMethods: UseFormReturn<FormData>,
  context?: FormRendererContext,
): React.ReactNode => {
  const {
    control,
    register,
    formState: { errors },
    watch,
  } = formMethods;

  // Check showWhen condition
  if (field.showWhen) {
    const formValues = watch();
    if (!field.showWhen(formValues)) {
      return null;
    }
  }

  switch (field.type) {
    case 'text': {
      const textField = field as TextFieldDef;
      return (
        <FormGroup
          key={field.name}
          id={field.name}
          label={field.label}
          labelHelpTooltip={field.tooltip}
          helpErrorPosition="bottom"
          error={(errors[field.name as keyof FormData]?.message as string) ?? ''}
          content={
            <Input
              id={field.name}
              type="text"
              autoComplete="off"
              placeholder={textField.placeholder}
              {...register(field.name as keyof FormData)}
            />
          }
        />
      );
    }

    case 'number': {
      const numberField = field as NumberFieldDef;
      return (
        <FormGroup
          key={field.name}
          id={field.name}
          label={field.label}
          labelHelpTooltip={field.tooltip}
          helpErrorPosition="bottom"
          error={(errors[field.name as keyof FormData]?.message as string) ?? ''}
          content={
            <Controller
              name={field.name as keyof FormData}
              control={control}
              render={({ field: { value, onChange } }) => (
                <Input
                  id={field.name}
                  type="number"
                  placeholder={numberField.placeholder}
                  value={value as number}
                  onChange={onChange}
                />
              )}
            />
          }
        />
      );
    }

    case 'toggle': {
      const toggleField = field as ToggleFieldDef;
      return (
        <FormGroup
          key={field.name}
          id={field.name}
          label={toggleField.label}
          labelHelpTooltip={field.tooltip}
          help={field.helpText}
          helpErrorPosition="bottom"
          content={
            <Controller
              name={field.name as keyof FormData}
              control={control}
              render={({ field: { value, onChange } }) => (
                <Toggle
                  id={field.name}
                  aria-label={field.name}
                  name={field.name}
                  toggle={value as boolean}
                  label={value ? 'Enabled' : 'Disabled'}
                  onChange={onChange}
                />
              )}
            />
          }
        />
      );
    }

    case 'select': {
      const selectField = field as SelectFieldDef;
      return (
        <FormGroup
          key={field.name}
          id={field.name}
          label={field.label}
          labelHelpTooltip={field.tooltip}
          helpErrorPosition="bottom"
          error={(errors[field.name as keyof FormData]?.message as string) ?? ''}
          content={
            <Controller
              name={field.name as keyof FormData}
              control={control}
              render={({ field: { value, onChange } }) => (
                <Select
                  id={field.name}
                  value={value as string}
                  onChange={onChange}
                  placeholder={selectField.placeholder}
                >
                  {selectField.options.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          }
        />
      );
    }

    case 'custom': {
      const customField = field as CustomFieldDef;
      return customField.render({
        name: field.name,
        control,
        errors,
        formValues: watch(),
      });
    }

    case 'bucketArray': {
      const bucketField = field as BucketArrayFieldDef;
      return (
        <BucketArrayField
          field={bucketField}
          formMethods={formMethods}
          platform={context?.platform ?? ''}
        />
      );
    }

    case 'accountSelector': {
      const accountField = field as AccountSelectorFieldDef;
      return (
        <AccountSelectorField field={accountField} formMethods={formMethods} />
      );
    }

    case 'iamUserSelector': {
      const iamField = field as IAMUserSelectorFieldDef;
      return (
        <IAMUserSelectorField field={iamField} formMethods={formMethods} />
      );
    }

    default:
      return null;
  }
};

/**
 * FormRenderer dynamically renders form fields based on FieldDef array.
 *
 * Supported field types:
 * - text, number, toggle, select, custom, bucketArray, accountSelector, iamUserSelector
 */
export const FormRenderer: React.FC<FormRendererProps> = ({
  fields,
  formMethods,
  context,
}) => {
  return (
    <>
      {fields.map((field) => {
        const rendered = renderField(field, formMethods, context);
        return rendered ? <div key={field.name}>{rendered}</div> : null;
      })}
    </>
  );
};


