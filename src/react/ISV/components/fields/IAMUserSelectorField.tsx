import { useRef, useEffect } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { FormSection, spacing } from '@scality/core-ui';
import { Accordion } from '@scality/core-ui/dist/next';
import { SelectRef } from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import { IAMUserSelectorFieldDef, FormData } from '../../engine/types';
import { CreateOrSelectNameField, Option } from '../CreateOrSelectNameField';
import { Checkbox } from '../../../ui-elements/FormLayout';
import { useISVFormContext } from '../ISVFormContext';

type IAMUserSelectorFieldProps = {
  field: IAMUserSelectorFieldDef;
  formMethods: UseFormReturn<FormData>;
};

export const IAMUserSelectorField = ({
  field,
  formMethods,
}: IAMUserSelectorFieldProps) => {
  const {
    template,
    iamUsers,
    iamUsersStatus,
    isIAMUserExist,
    accessKeysStatus,
    isAccordionExpanded,
  } = useISVFormContext();

  const selectRef = useRef<SelectRef<Option, false, null>>(null);
  const { watch, control } = formMethods;

  const accountNameType = watch('accountNameType');
  const accountName = watch('accountName');
  const IAMUserNameType = watch('IAMUserNameType');

  useEffect(() => {
    if (isAccordionExpanded) {
      selectRef.current?.focus();
    }
  }, [isAccordionExpanded]);

  // Only show when existing account is selected
  if (accountNameType !== 'existing' || !accountName) {
    return null;
  }

  return (
    <div style={{ position: 'relative', bottom: spacing.f8 }}>
      <Accordion
        title="Advanced settings"
        id="advanced-settings"
        open={isAccordionExpanded}
        isEmphazed={false}
      >
        <FormSection forceLabelWidth={264}>
          <CreateOrSelectNameField
            isExist={isIAMUserExist}
            status={iamUsersStatus}
            options={iamUsers}
            selectRef={selectRef}
            type={IAMUserNameType}
            platform={template.id}
            tooltip={field.tooltip as React.ReactElement}
            fieldName="IAMUserName"
            label="IAM User Management"
          >
            {IAMUserNameType === 'existing' && (
              <Controller
                name="generateKey"
                control={control}
                render={({ field: { onChange, value } }) => {
                  return (
                    <Checkbox
                      id="generateKey"
                      label={
                        accessKeysStatus === 'loading'
                          ? 'Loading...'
                          : 'Generate a new set of AK/SK'
                      }
                      onChange={onChange}
                      disabled={accessKeysStatus === 'loading'}
                      checked={value}
                    />
                  );
                }}
              />
            )}
          </CreateOrSelectNameField>
        </FormSection>
      </Accordion>
    </div>
  );
};
