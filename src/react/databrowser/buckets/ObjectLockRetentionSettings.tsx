import { ChangeEvent } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import Joi from '@hapi/joi';
import { FormGroup, FormSection, Stack, Text, Toggle } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { convertRemToPixels } from '@scality/core-ui/dist/components/tablev2/TableUtils';

export const objectLockRetentionSettingsValidationRules = {
  isObjectLockEnabled: Joi.boolean(),
  isDefaultRetentionEnabled: Joi.boolean().default(false),
  retentionMode: Joi.when('isDefaultRetentionEnabled', {
    is: Joi.equal(true),
    then: Joi.string().required(),
    otherwise: Joi.valid(),
  }),
  retentionPeriod: Joi.when('isDefaultRetentionEnabled', {
    is: Joi.equal(true),
    then: Joi.number().min(1).required(),
    otherwise: Joi.valid(),
  }),
  retentionPeriodFrequencyChoice: Joi.when('isDefaultRetentionEnabled', {
    is: Joi.equal(true),
    then: Joi.string().required(),
    otherwise: Joi.valid(),
  }),
};

export default function ObjectLockRetentionSettings({
  isEditRetentionSetting = false,
}: {
  isEditRetentionSetting?: boolean;
}) {
  const {
    control,
    register,
    watch,
    formState: { errors },
    setValue,
  } = useFormContext();
  const isDefaultRetentionEnabled = watch('isDefaultRetentionEnabled');
  const isObjectLockEnabled = watch('isObjectLockEnabled');
  const matchVersioning = (checked: boolean) => {
    if (checked) {
      setValue('isVersioning', true);
    }
  };
  return (
    <FormSection
      title={isEditRetentionSetting ? null : { name: 'Object-lock' }}
      forceLabelWidth={convertRemToPixels(17.5)}
    >
      <FormGroup
        id="isObjectLockEnabled"
        label="Object-lock"
        content={
          <Controller
            control={control}
            name="isObjectLockEnabled"
            defaultValue={isEditRetentionSetting}
            render={({ field: { onChange, value: isObjectLockEnabled } }) => {
              return (
                <Toggle
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    onChange(e.target.checked);
                    matchVersioning(e.target.checked);
                  }}
                  placeholder="isObjectLockEnabled"
                  label={isObjectLockEnabled ? 'Enabled' : 'Disabled'}
                  toggle={isObjectLockEnabled}
                  disabled={isObjectLockEnabled}
                />
              );
            }}
          />
        }
        labelHelpTooltip={
          <ul>
            <li>Permanently allows objects in this bucket to be locked</li>
            <li>
              Object-lock option cannot be removed after bucket creation, but
              you will be able to disable the retention itself on edition.
            </li>
            <li>
              Once the bucket is created, you might be blocked from deleting the
              objects and the bucket.
            </li>
            <li>
              Enabling Object-lock automatically activates Versioning for the
              bucket, and you won’t be able to suspend Versioning.
            </li>
          </ul>
        }
        helpErrorPosition="bottom"
        disabled={isEditRetentionSetting}
      ></FormGroup>
      {isObjectLockEnabled && (
        <>
          <FormGroup
            id="isDefaultRetentionEnabled"
            label="Default Retention"
            helpErrorPosition="bottom"
            labelHelpTooltip={
              isEditRetentionSetting ? (
                <ul>
                  <li>
                    These settings apply only to new objects placed into the
                    bucket without any specific specific object-lock parameters.
                  </li>
                  <li>
                    Automatically protect objects put into this bucket from
                    being deleted or overwritten.
                  </li>
                  <li>
                    If objects are uploaded into the bucket with their own
                    Retention settings, these will override the Default
                    Retention setting placed on the bucket.
                  </li>
                </ul>
              ) : (
                <ul>
                  <li>
                    Automatically protect objects put into this bucket from
                    being deleted or overwritten.
                  </li>
                  <li>
                    These settings apply only to new objects placed into the
                    bucket without any specific specific object-lock parameters.
                  </li>
                  <li>
                    You can activate this option after the bucket creation.
                  </li>
                  <li>
                    If objects are uploaded into the bucket with their own
                    Retention settings, these will override the Default
                    Retention setting placed on the bucket.
                  </li>
                </ul>
              )
            }
            content={
              <Controller
                control={control}
                name="isDefaultRetentionEnabled"
                render={({
                  field: { onChange, value: isDefaultRetentionEnabled },
                }) => {
                  return (
                    <Toggle
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onChange(e.target.checked)
                      }
                      placeholder="isDefaultRetentionEnabled"
                      label={isDefaultRetentionEnabled ? 'Active' : 'Inactive'}
                      toggle={isDefaultRetentionEnabled}
                    />
                  );
                }}
              />
            }
          />
          <FormGroup
            id="objectlockMode"
            label="Retention mode"
            direction="vertical"
            disabled={!isDefaultRetentionEnabled}
            helpErrorPosition="bottom"
            content={
              <div style={{ opacity: isDefaultRetentionEnabled ? 1 : 0.5 }}>
                <Stack direction="vertical">
                  <Stack direction="vertical">
                    <Stack>
                      <input
                        id="locktype-governance"
                        type="radio"
                        value="GOVERNANCE"
                        disabled={!isDefaultRetentionEnabled}
                        {...register('retentionMode')}
                      />
                      <label htmlFor="locktype-governance">Governance</label>
                    </Stack>
                    <Text color="textSecondary" isEmphazed variant="Smaller">
                      An user with a specific IAM permissions can
                      overwrite/delete protected object versions during the
                      retention period.
                    </Text>
                  </Stack>
                  <Stack>
                    <input
                      id="locktype-compliance"
                      type="radio"
                      value="COMPLIANCE"
                      disabled={!isDefaultRetentionEnabled}
                      {...register('retentionMode')}
                    />
                    <label htmlFor="locktype-compliance">Compliance</label>
                  </Stack>
                  <Text color="textSecondary" isEmphazed variant="Smaller">
                    No one can overwrite protected object versions during the
                    retention period.
                  </Text>
                </Stack>
              </div>
            }
          />
          <FormGroup
            id="retentionPeriod"
            label="Retention period"
            direction="horizontal"
            helpErrorPosition="bottom"
            help="Must be a positive whole number."
            error={errors.retentionPeriod?.message}
            disabled={!isDefaultRetentionEnabled}
            content={
              <Stack direction="horizontal">
                <Controller
                  control={control}
                  name="retentionPeriod"
                  render={({ field: { onChange, value: retentionPeriod } }) => {
                    return (
                      <Input
                        id="retentionPeriod"
                        name="retentionPeriod"
                        value={retentionPeriod}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          onChange(e.target.value)
                        }
                        type="number"
                        min={1}
                        
                        size="2/3"
                      />
                    );
                  }}
                />
                <Controller
                  control={control}
                  name="retentionPeriodFrequencyChoice"
                  defaultValue={'DAYS'}
                  render={({
                    field: { onChange, value: retentionPeriodFrequencyChoice },
                  }) => {
                    return (
                      <Select
                        id="retentionPeriodFrequencyChoice"
                        onChange={onChange}
                        placeholder="retentionPeriodFrequencyChoice"
                        value={retentionPeriodFrequencyChoice}
                        disabled={!isDefaultRetentionEnabled}
                        size={'1/3'}
                      >
                        <Select.Option value={'DAYS'}>Days</Select.Option>
                        <Select.Option value={'YEARS'}>Years</Select.Option>
                      </Select>
                    );
                  }}
                />
              </Stack>
            }
          />
        </>
      )}
    </FormSection>
  );
}
