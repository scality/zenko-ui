// @noflow
import { Controller, useFormContext } from 'react-hook-form';
import { Banner, Icon, Input, Toggle } from '@scality/core-ui';
import { SmallerText } from '@scality/core-ui/dist/components/text/Text.component';
import * as F from '../../ui-elements/FormLayout';
import Joi from '@hapi/joi';
import styled from 'styled-components';
import { Box } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
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

const StyledSelect = styled<F.Select>(F.Select)({
  margin: 0,
});

export default function ObjectLockRetentionSettings(props: {
  isEditRetentionSetting?: boolean;
}) {
  const { isEditRetentionSetting } = props;
  const {
    control,
    register,
    watch,

    formState: { errors },
  } = useFormContext();
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
          render={({
            field: { onChange, value: isDefaultRetentionEnabled },
          }) => {
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
      <Box md={2}>
        <F.LabelSecondary>
          Automatically protect objects put into this bucket from being deleted
          or overwritten.
        </F.LabelSecondary>
      </Box>
      <div
        style={{
          opacity: isDefaultRetentionEnabled ? 1 : 0.5,
          paddingBottom: '1rem',
        }}
      >
        <Box mt={2}>
          <Banner
            variant="infoPrimary"
            icon={<Icon name="Exclamation-circle" />}
          >
            {
              'If objects are uploaded into the bucket with their own Retention settings, these will override the Default Retention setting placed on the bucket'
            }
          </Banner>
        </Box>

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
                {...register('retentionMode')}
                disabled={!isDefaultRetentionEnabled}
              />
              <Box ml={1}>Governance</Box>
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
                {...register('retentionMode')}
                disabled={!isDefaultRetentionEnabled}
              />
              <Box ml={1}>Compliance</Box>
            </F.Label>
          </F.Fieldset>
          <SmallerText>
            No one can overwrite protected object versions during the retention
            period.
          </SmallerText>
        </F.Fieldset>
        <F.Fieldset direction="row" alignItems="center">
          <F.Label>Retention period</F.Label>

          <Controller
            control={control}
            id="retentionPeriod"
            name="retentionPeriod"
            render={({ field: { onChange, value: retentionPeriod } }) => {
              return (
                <Input
                  name="retentionPeriod"
                  value={retentionPeriod}
                  onChange={(e) => onChange(e.target.value)}
                  type="number"
                  style={{
                    width: '4.5rem',
                    boxSizing: 'border-box',
                    height: spacing.sp32,
                  }}
                  min={1}
                  disabled={!isDefaultRetentionEnabled}
                />
              );
            }}
          />

          <Controller
            control={control}
            id="retentionPeriodFrequencyChoice"
            name="retentionPeriodFrequencyChoice"
            defaultValue={'DAYS'}
            render={({
              field: { onChange, value: retentionPeriodFrequencyChoice },
            }) => {
              return (
                <Box width="25%" ml={2}>
                  <StyledSelect
                    onChange={onChange}
                    placeholder="retentionPeriodFrequencyChoice"
                    value={retentionPeriodFrequencyChoice}
                    disabled={!isDefaultRetentionEnabled}
                  >
                    <F.Select.Option value={'DAYS'}>Days</F.Select.Option>
                    <F.Select.Option value={'YEARS'}>Years</F.Select.Option>
                  </StyledSelect>
                </Box>
              );
            }}
          />

          <F.ErrorInput
            id="error-retentionPeriod"
            error={errors.retentionPeriod?.message}
          />
        </F.Fieldset>
      </div>
    </>
  );
}
