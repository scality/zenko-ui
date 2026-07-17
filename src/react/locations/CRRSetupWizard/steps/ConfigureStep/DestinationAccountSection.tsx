import { FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import { useFormContext } from 'react-hook-form';
import type { ConfigureFormValues } from './schema';

export const DestinationAccountSection = () => {
  const {
    register,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const nameError = touchedFields.destinationAccountName ? errors.destinationAccountName?.message : undefined;

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Destination Account' }}>
      <FormGroup
        id="destinationAccountName"
        direction="horizontal"
        label="Account Name"
        required
        helpErrorPosition="bottom"
        error={nameError}
        content={<Input id="destinationAccountName" autoComplete="off" {...register('destinationAccountName')} />}
      />
    </FormSection>
  );
};
