import { FormGroup, FormSection, Icon, Stack, Text } from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import { useFormContext } from 'react-hook-form';
import type { ConfigureFormValues } from './schema';

export const DestinationAccountSection = () => {
  const {
    register,
    setValue,
    getValues,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const nameError = touchedFields.destinationAccountName ? errors.destinationAccountName?.message : undefined;

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Destination site' }}>
      <Text color="textSecondary">An account will be created on the destination site with this name.</Text>
      <FormGroup
        id="destinationAccountName"
        direction="horizontal"
        label="Account name"
        required
        helpErrorPosition="bottom"
        error={nameError}
        content={
          <Stack direction="vertical" gap="r8">
            <Input id="destinationAccountName" autoComplete="off" {...register('destinationAccountName')} />
            <Button
              type="button"
              variant="outline"
              label="Copy from Source site Account name"
              icon={<Icon name="Copy" />}
              onClick={() =>
                setValue('destinationAccountName', getValues('accountName'), {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }
            />
          </Stack>
        }
      />
    </FormSection>
  );
};
