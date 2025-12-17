import { FormGroup, Toggle, Stack, Text } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import { MAX_IMMUTABLE_PERIOD_DAYS } from '../constants';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';
import { useVeeamAutoRepositoryFeature } from '../hooks/useVeeamAutoRepositoryFeature';

export const VeeamRepositoryFields = () => {
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext();
  const isVeeamVBROnly = useIsVeeamVBROnly();
  const isAutoRepoFeatureEnabled = useVeeamAutoRepositoryFeature();
  const autoCreateRepository = watch('autoCreateRepository');
  const enableImmutableBackup = watch('enableImmutableBackup');

  if (!isVeeamVBROnly || !isAutoRepoFeatureEnabled) {
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
          error={(errors.immutablePeriodDays?.message as string) ?? ''}
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
                    max={MAX_IMMUTABLE_PERIOD_DAYS}
                  />
                )}
              />
              <Text>day(s)</Text>
            </Stack>
          }
        />
      )}
    </>
  );
};
