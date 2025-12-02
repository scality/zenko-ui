import { FormGroup, Toggle, Stack } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';

export const VeeamRepositoryFields = () => {
  const { control, watch } = useFormContext();
  const isVeeamVBROnly = useIsVeeamVBROnly();
  const autoCreateRepository = watch('autoCreateRepository');
  const enableImmutableBackup = watch('enableImmutableBackup');

  if (!isVeeamVBROnly) {
    return null;
  }

  return (
    <>
      <FormGroup
        id="autoCreateRepository"
        label="Veeam repository creation"
        help="Will automatically create the Veeam repository with all the needed information from ARTESCA Object storage."
        helpErrorPosition="bottom"
        content={
          <Controller
            name="autoCreateRepository"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Toggle
                id="autoCreateRepository"
                aria-label="autoCreateRepository"
                name="autoCreateRepository"
                toggle={value}
                label={value ? 'Enabled' : 'Disabled'}
                onChange={onChange}
              />
            )}
          />
        }
      />

      {autoCreateRepository && enableImmutableBackup && (
        <FormGroup
          id="immutablePeriodDays"
          label="Veeam Immutable retention period"
          help="Minimum immutability period"
          helpErrorPosition="bottom"
          content={
            <Stack direction="horizontal">
              <Controller
                name="immutablePeriodDays"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <Input
                    id="immutablePeriodDays"
                    type="number"
                    size="1/3"
                    value={value}
                    onChange={onChange}
                    min={1}
                  />
                )}
              />
              <Input
                id="immutablePeriodDays-label"
                type="text"
                size="1/3"
                value="Day(s)"
                readOnly
              />
            </Stack>
          }
        />
      )}
    </>
  );
};
