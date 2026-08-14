import { FormGroup, FormSection, Icon, Loader, Stack, Text, Tooltip } from '@scality/core-ui';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import type { DestinationEndpoint } from '../../api/types';
import type { ConfigureFormValues } from './schema';

export type ResolveStatus = 'idle' | 'checking' | 'resolvable' | 'unresolvable';

type Props = {
  isConnected: boolean;
  endpoints: DestinationEndpoint[];
  resolveStatus: ResolveStatus;
  onEndpointSelected: (hostname: string) => void;
};

const RESOLVE_COPY = {
  checking: 'Checking connectivity…',
  resolvable: 'Reachable from this site',
  unresolvable: 'Not reachable from this site — check DNS/network access to the endpoint, then select again',
} as const;

const ResolveIndicator = ({ status }: { status: ResolveStatus }) => {
  if (status === 'checking') {
    return (
      <span role="img" aria-label={RESOLVE_COPY.checking}>
        <Loader size="base" />
      </span>
    );
  }
  if (status === 'idle') {
    return null;
  }
  const resolvable = status === 'resolvable';
  return (
    <Tooltip overlay={RESOLVE_COPY[status]}>
      <span role="img" aria-label={RESOLVE_COPY[status]}>
        <Icon
          name={resolvable ? 'Check-circle' : 'Times-circle'}
          color={resolvable ? 'statusHealthy' : 'statusCritical'}
        />
      </span>
    </Tooltip>
  );
};

export const DestinationAccountSection = ({ isConnected, endpoints, resolveStatus, onEndpointSelected }: Props) => {
  const {
    control,
    register,
    setValue,
    getValues,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const nameError = touchedFields.destinationAccountName ? errors.destinationAccountName?.message : undefined;

  return (
    <FormSection forceLabelWidth={280} title={{ name: 'Destination site' }}>
      <FormGroup
        id="selectedEndpoint"
        direction="horizontal"
        label="Destination S3 endpoint"
        required
        helpErrorPosition="bottom"
        content={
          !isConnected ? (
            <Text color="textSecondary">Connect to the destination to discover its S3 endpoints.</Text>
          ) : (
            <Stack gap="r8">
              <Controller
                name="selectedEndpoint"
                control={control}
                render={({ field }) => (
                  <Select
                    id="selectedEndpoint"
                    value={field.value}
                    placeholder="Select an endpoint"
                    onChange={(value) => {
                      field.onChange(value);
                      onEndpointSelected(value);
                    }}
                  >
                    {endpoints.map((endpoint) => (
                      <Select.Option key={endpoint.hostname} value={endpoint.hostname}>
                        {endpoint.hostname}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              />
              <ResolveIndicator status={resolveStatus} />
            </Stack>
          )
        }
      />
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
