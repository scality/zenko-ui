import { FormGroup, Toggle, Stack } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';

export const VeeamRepositoryFields = () => {
  const { control, watch } = useFormContext();
  const isVeeamVBROnly = useIsVeeamVBROnly();

  if (!isVeeamVBROnly) {
    return null;
  }

  return (
    <>
      <FormGroup
        id="autoCreateRepository"
        label="Veeam repository creation"
        help="Will automatically create the Veeam repository with all the needed information from ARTESCA Object storage."
        labelHelpTooltip={<></>}
        helpErrorPosition="bottom"
        content={
          <Controller
            name="autoCreateRepository"
            control={control}
            render={({ field: { value, onChange } }) => {
              return (
                <Toggle
                  id="autoCreateRepository"
                  aria-label="autoCreateRepository"
                  name="autoCreateRepository"
                  toggle={value}
                  label={value ? 'Enabled' : 'Disabled'}
                  onChange={onChange}
                />
              );
            }}
          />
        }
      />

      {/* Immutable Period Days field - only show when auto-repository and immutable backup are enabled */}
      {watch('autoCreateRepository') && watch('enableImmutableBackup') && (
        <FormGroup
          id="immutablePeriodDays"
          label="Veeam Immutable retention period"
          help="Minimum immutability period"
          labelHelpTooltip={<></>}
          helpErrorPosition="bottom"
          content={
            <Stack direction="horizontal">
              <Controller
                name="immutablePeriodDays"
                control={control}
                render={({ field: { value, onChange } }) => {
                  return (
                    <Input
                      id="immutablePeriodDays"
                      type="number"
                      size="1/3"
                      value={value}
                      onChange={onChange}
                      min={1}
                    />
                  );
                }}
              />
              <Input
                id="immutablePeriodDays-label"
                type="text"
                size="1/3"
                value={'Day(s)'}
                readOnly
              />
            </Stack>
          }
        />
      )}
    </>
  );
};
