import { FormGroup, FormSection, Radio, Stack, Wrap } from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import { CertificateSection } from '../../../../ui-elements/CertificateSection';
import type { ConfigureFormValues } from './schema';

type Props = {
  isCheckingConnection: boolean;
  onCheckConnection: () => void;
};

export const DestinationConnectionSection = ({ isCheckingConnection, onCheckConnection }: Props) => {
  const {
    control,
    register,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const connectionMode = watch('connectionMode');
  const errorIfTouched = (field: keyof ConfigureFormValues) =>
    touchedFields[field] ? errors[field]?.message : undefined;

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Destination Connection' }}>
      <FormGroup
        id="connectionMode"
        direction="horizontal"
        label="Mode"
        required
        helpErrorPosition="bottom"
        content={
          <Controller
            name="connectionMode"
            control={control}
            render={({ field }) => (
              <Stack direction="horizontal" gap="r16">
                <Radio
                  name="connectionMode"
                  value="management-network"
                  checked={field.value === 'management-network'}
                  onChange={() => field.onChange('management-network')}
                  label="Management Network"
                />
                <Radio
                  name="connectionMode"
                  value="data-network"
                  checked={field.value === 'data-network'}
                  onChange={() => field.onChange('data-network')}
                  label="Data Network"
                />
              </Stack>
            )}
          />
        }
      />
      {connectionMode === 'management-network' && (
        <FormGroup
          id="url"
          direction="horizontal"
          label="URL"
          required
          helpErrorPosition="bottom"
          error={errorIfTouched('url')}
          content={<Input id="url" noPlaceholderPrefix placeholder="https://<IP>:8443" {...register('url')} />}
        />
      )}
      {connectionMode === 'data-network' && (
        <FormGroup
          id="baseDomain"
          direction="horizontal"
          label="Base Domain"
          required
          helpErrorPosition="bottom"
          error={errorIfTouched('baseDomain')}
          content={<Input id="baseDomain" {...register('baseDomain')} />}
        />
      )}
      {connectionMode === 'data-network' && (
        <FormGroup
          id="s3Endpoint"
          direction="horizontal"
          label="S3 Endpoint"
          required
          helpErrorPosition="bottom"
          error={errorIfTouched('s3Endpoint')}
          content={
            <Input
              id="s3Endpoint"
              noPlaceholderPrefix
              placeholder="https://s3.example.com"
              {...register('s3Endpoint')}
            />
          }
        />
      )}
      <FormGroup
        id="username"
        direction="horizontal"
        label="Username"
        required
        helpErrorPosition="bottom"
        error={errorIfTouched('username')}
        content={<Input id="username" autoComplete="off" {...register('username')} />}
      />
      <FormGroup
        id="password"
        direction="horizontal"
        label="Password"
        required
        helpErrorPosition="bottom"
        error={errorIfTouched('password')}
        content={<Input id="password" type="password" autoComplete="new-password" {...register('password')} />}
      />
      <CertificateSection name="certificate" />
      <Wrap width="100%">
        <div />
        <Button
          type="button"
          variant="secondary"
          label="Check Connection"
          isLoading={isCheckingConnection}
          onClick={onCheckConnection}
        />
      </Wrap>
    </FormSection>
  );
};
