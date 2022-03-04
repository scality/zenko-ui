// @noflow
import { Controller, useFormContext } from 'react-hook-form';
import { Banner, Input, Toggle } from '@scality/core-ui';
import { SmallerText } from '@scality/core-ui/dist/components/text/Text.component';
import SpacedBox from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { spacing } from '@scality/core-ui/dist/style/theme';
import * as F from '../../ui-elements/FormLayout';
import React from 'react';
import Joi from '@hapi/joi';
export const objectLockRetentionSettingsValidationRules = {
  isDefaultRetentionEnabled: Joi.boolean().default(false),
  retentionMode: Joi.when('isDefaultRetentionEnabled', {
    is: Joi.equal(true),
    then: Joi.string().required(),
    otherwise: Joi.valid(),
  }),
  retentionPeriod: Joi.when('isDefaultRetentionEnabled', {
    is: Joi.equal(true),
    then: Joi.number().required(),
    otherwise: Joi.valid(),
  }),
  retentionPeriodFrequencyChoice: Joi.when('isDefaultRetentionEnabled', {
    is: Joi.equal(true),
    then: Joi.string().required(),
    otherwise: Joi.valid(),
  }),
};
export default function ObjectLockRetentionSettings(props: {
  isEditRetentionSetting?: boolean;
}) {
  const { isEditRetentionSetting } = props;
  const { control, register, watch, errors } = useFormContext();
  const isDefaultRetentionEnabled = watch('isDefaultRetentionEnabled');
  return (
    <>
      <F.Fieldset direction={'row'}>
        <F.Label
          tooltipMessages={
            isEditRetentionSetting
              ? [
                  'These settings apply only to new objects placed into the bucket without any specific specific object-lock parameters.',
                ]
              : [
                  'These settings apply only to new objects placed into the bucket without any specific specific object-lock parameters.',
                  'You can activate this option after the bucket creation.',
                ]
          }
          tooltipWidth="28rem"
        >
          Default Retention
        </F.Label>
        <Controller
          control={control}
          id="isDefaultRetentionEnabled"
          name="isDefaultRetentionEnabled"
          defaultValue={false}
          render={({ onChange, value: isDefaultRetentionEnabled }) => {
            return (
              <Toggle
                onChange={(e) => onChange(e.target.checked)}
                placeholder="isDefaultRetentionEnabled"
                label={isDefaultRetentionEnabled ? 'Active' : 'Inactive'}
                toggle={isDefaultRetentionEnabled}
              />
            );
          }}
        />
      </F.Fieldset>
      <SpacedBox md={2}>
        <F.LabelSecondary>
          Automatically protect objects put into this bucket from being deleted
          or overwritten.
        </F.LabelSecondary>
      </SpacedBox>
      <div
        style={{
          opacity: isDefaultRetentionEnabled ? 1 : 0.5,
        }}
      >
        <SpacedBox mt={2}>
          <Banner
            variant="infoPrimary"
            icon={<i className="fas fa-exclamation-circle" />}
          >
            {
              'If objects are uploaded into the bucket with their own Retention settings, these will override the Default Retention setting placed on the bucket'
            }
          </Banner>
        </SpacedBox>

        <F.Fieldset>
          <F.Label>Retention mode</F.Label>
          <F.Fieldset direction="row">
            <F.Label
              for="GOVERNANCE"
              style={{
                alignItems: 'baseline',
              }}
            >
              <F.Input
                type="radio"
                id="GOVERNANCE"
                value="GOVERNANCE"
                name="retentionMode"
                ref={register}
                disabled={!isDefaultRetentionEnabled}
              />
              <SpacedBox ml={8}>Governance</SpacedBox>
            </F.Label>
          </F.Fieldset>
          <SmallerText>
            An user with a specific IAM permissions can overwrite/delete
            protected object versions during the retention period.
          </SmallerText>
          <F.Fieldset direction="row">
            <F.Label
              for="COMPLIANCE"
              style={{
                alignItems: 'baseline',
              }}
            >
              <F.Input
                type="radio"
                id="COMPLIANCE"
                value="COMPLIANCE"
                name="retentionMode"
                ref={register}
                disabled={!isDefaultRetentionEnabled}
              />
              <SpacedBox ml={8}>Compliance</SpacedBox>
            </F.Label>
          </F.Fieldset>
          <SmallerText>
            No one can overwrite protected object versions during the retention
            period.
          </SmallerText>
        </F.Fieldset>
        <F.Fieldset direction="row" alignItems="baseline">
          <F.Label>Retention period</F.Label>

          <div>
            <Controller
              control={control}
              id="retentionPeriod"
              name="retentionPeriod"
              render={({ onChange, value: retentionPeriod }) => {
                return (
                  <Input
                    name="retentionPeriod"
                    value={retentionPeriod}
                    onChange={(e) => onChange(e.target.value)}
                    type="number"
                    style={{
                      width: spacing.sp40,
                    }}
                    min={1}
                    disabled={!isDefaultRetentionEnabled}
                  />
                );
              }}
            />
          </div>

          <SpacedBox
            style={{
              width: '25%',
            }}
            ml={8}
          >
            <Controller
              control={control}
              id="retentionPeriodFrequencyChoice"
              name="retentionPeriodFrequencyChoice"
              defaultValue={'DAYS'}
              render={({ onChange, value: retentionPeriodFrequencyChoice }) => {
                return (
                  <>
                    <F.Select
                      onChange={onChange}
                      placeholder="retentionPeriodFrequencyChoice"
                      value={retentionPeriodFrequencyChoice}
                      disabled={!isDefaultRetentionEnabled}
                    >
                      <F.Select.Option value={'DAYS'}>Days</F.Select.Option>
                      <F.Select.Option value={'YEARS'}>Years</F.Select.Option>
                    </F.Select>
                  </>
                );
              }}
            />
          </SpacedBox>

          <F.ErrorInput
            id="error-retentionPeriod"
            hasError={errors.retentionPeriod}
          >
            {' '}
            {errors.retentionPeriod?.message}{' '}
          </F.ErrorInput>
        </F.Fieldset>
      </div>
    </>
  );
}