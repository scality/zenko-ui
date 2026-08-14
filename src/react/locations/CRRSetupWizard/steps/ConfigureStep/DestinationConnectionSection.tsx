import { FormGroup, FormSection, Icon, Stack, spacing, Text, Wrap } from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';
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
  isConnecting: boolean;
  onConnect: () => void;
  isConnected: boolean;
};

const CONNECTION_FIELDS: (keyof ConfigureFormValues)[] = ['baseDomain', 'username', 'password', 'certificate'];

export const DestinationConnectionSection = ({ isConnecting, onConnect, isConnected }: Props) => {
  const {
    register,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const values = watch();
  const errorIfTouched = (field: keyof ConfigureFormValues) =>
    touchedFields[field] ? errors[field]?.message : undefined;

  const connectionValid = CONNECTION_FIELDS.every((field) => Boolean(values[field]) && !errors[field]);

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Destination Connection' }}>
      <ConnectionBox>
        <FormGroup
          id="baseDomain"
          direction="horizontal"
          label="Base domain"
          required
          helpErrorPosition="bottom"
          error={errorIfTouched('baseDomain')}
          content={
            <ConstrainedInput
              id="baseDomain"
              noPlaceholderPrefix
              placeholder="crr-dest.artesca.local"
              {...register('baseDomain')}
            />
          }
        />
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
            <Text isEmphazed>Connected</Text>
          </Stack>
        ) : (
          <div />
        )}
        <Button
          type="button"
          variant="secondary"
          label="Connect"
          isLoading={isConnecting}
          disabled={!connectionValid}
          tooltip={connectionValid ? undefined : { overlay: 'Fill in the base domain and credentials to connect' }}
          onClick={onConnect}
        />
      </Wrap>
    </FormSection>
  );
};
