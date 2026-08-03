import { FormGroup, FormSection, Icon, Stack, spacing, Text, Wrap } from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import styled from 'styled-components';
import { RadioGroup } from '../../../../ISV/components/RadioGroup';
import { CertificateSection } from '../../../../ui-elements/CertificateSection';
import type { ConfigureFormValues } from './schema';

const ConnectionBox = styled.div`
  background: ${(props) => props.theme.backgroundLevel2};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 6px;
  padding: ${spacing.r16};
`;

const ConstrainedInput = styled(Input)`
  max-width: 22rem;
`;

type Props = {
  isCheckingConnection: boolean;
  onCheckConnection: () => void;
  isConnected: boolean;
  connectedInstanceName?: string;
};

export const DestinationConnectionSection = ({
  isCheckingConnection,
  onCheckConnection,
  isConnected,
  connectedInstanceName,
}: Props) => {
  const {
    control,
    register,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const values = watch();
  const connectionMode = values.connectionMode;
  const errorIfTouched = (field: keyof ConfigureFormValues) =>
    touchedFields[field] ? errors[field]?.message : undefined;

  const connectionFields: (keyof ConfigureFormValues)[] =
    connectionMode === 'data-network'
      ? ['baseDomain', 's3Endpoint', 'username', 'password', 'certificate']
      : ['url', 'username', 'password', 'certificate'];
  const connectionValid = connectionFields.every((field) => Boolean(values[field]) && !errors[field]);

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Destination Connection' }}>
      <ConnectionBox>
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
                <RadioGroup
                  name="connectionMode"
                  options={[
                    {
                      value: 'management-network',
                      label: 'Management Network',
                      description: 'Connects directly to the management IP.',
                    },
                    {
                      value: 'data-network',
                      label: 'Data Network',
                      description: 'Goes through the public S3 endpoint instead.',
                    },
                  ]}
                  value={field.value}
                  onChange={(next) => field.onChange(next)}
                  direction="vertical"
                />
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
            content={
              <ConstrainedInput id="url" noPlaceholderPrefix placeholder="https://<IP>:8443" {...register('url')} />
            }
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
            content={
              <ConstrainedInput
                id="baseDomain"
                noPlaceholderPrefix
                placeholder="ui.<base-domain>"
                {...register('baseDomain')}
              />
            }
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
              <ConstrainedInput
                id="s3Endpoint"
                noPlaceholderPrefix
                placeholder="https://s3.example.com"
                {...register('s3Endpoint')}
              />
            }
          />
        )}
      </ConnectionBox>
      <Text color="textSecondary">
        Credentials: these must belong to a user with at least the Storage Manager role on the destination site
        deployment.
      </Text>
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
        {isConnected ? (
          <Stack gap="r8">
            <Icon name="Check-circle" color="statusHealthy" />
            <Text>
              <Text isEmphazed>Connected</Text>
              {connectedInstanceName ? `: ${connectedInstanceName}` : ''}
            </Text>
          </Stack>
        ) : (
          <div />
        )}
        <Button
          type="button"
          variant="secondary"
          label="Check Connection"
          isLoading={isCheckingConnection}
          disabled={!connectionValid}
          tooltip={connectionValid ? undefined : { overlay: 'Fill in the destination fields to check the connection' }}
          onClick={onCheckConnection}
        />
      </Wrap>
    </FormSection>
  );
};
