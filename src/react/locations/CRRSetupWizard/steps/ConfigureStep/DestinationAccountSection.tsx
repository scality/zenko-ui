import { Icon, Loader, Stack, Text, Tooltip } from '@scality/core-ui';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { RadioGroup } from '../../../../ISV/components/RadioGroup';
import { FormGroup, FormSection } from '../../../../ui-elements/CoreUIForm';
import { FIELD_CONTENT_STRETCH } from '../../../../ui-elements/responsive';
import type { DestinationAccount, DestinationEndpoint } from '../../api/types';
import type { ConfigureFormValues } from './schema';

export type ResolveStatus = 'idle' | 'checking' | 'resolvable' | 'unresolvable';

type Props = {
  isConnected: boolean;
  endpoints: DestinationEndpoint[];
  accounts: DestinationAccount[];
  resolveStatus: ResolveStatus;
  onEndpointSelected: (hostname: string) => void;
};

const ACCOUNT_OPTIONS = [
  { value: 'create', label: 'Create a new Account' },
  { value: 'existing', label: 'Use an existing Account' },
];

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

export const DestinationAccountSection = ({
  isConnected,
  endpoints,
  accounts,
  resolveStatus,
  onEndpointSelected,
}: Props) => {
  const {
    control,
    register,
    setValue,
    getValues,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext<ConfigureFormValues>();
  const nameError = touchedFields.destinationAccountName ? errors.destinationAccountName?.message : undefined;
  const usesExistingAccount = watch('destinationAccountNameType') === 'existing';

  const canPickExisting = accounts.length > 0;
  const accountOptions = useMemo(
    () =>
      ACCOUNT_OPTIONS.map((opt) =>
        opt.value === 'existing' && !canPickExisting
          ? {
              ...opt,
              disabled: true,
              disabledReason: isConnected
                ? 'The destination has no account to reuse'
                : 'Connect to the destination to list its accounts',
            }
          : opt,
      ),
    [canPickExisting, isConnected],
  );

  return (
    <FormSection forceLabelWidth="19rem" title={{ name: 'Destination site' }}>
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
      <FormGroup
        id="destinationAccountNameType"
        direction="horizontal"
        label="Account"
        required
        helpErrorPosition="bottom"
        content={
          <Controller
            name="destinationAccountNameType"
            control={control}
            render={({ field }) => (
              <RadioGroup
                options={accountOptions}
                value={field.value}
                onChange={(next) => {
                  field.onChange(next);
                  setValue('destinationAccountName', '', {
                    shouldValidate: true,
                    shouldDirty: false,
                    shouldTouch: false,
                  });
                }}
                direction="vertical"
              />
            )}
          />
        }
      />
      {!usesExistingAccount && (
        <Text color="textSecondary">An account will be created on the destination site with this name.</Text>
      )}
      <FormGroup
        id="destinationAccountName"
        direction="horizontal"
        label="Account name"
        required
        helpErrorPosition="bottom"
        error={nameError}
        content={
          usesExistingAccount && canPickExisting ? (
            <Controller
              name="destinationAccountName"
              control={control}
              render={({ field }) => (
                <Select
                  id="destinationAccountName"
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  placeholder="Select existing account"
                >
                  {accounts.map((account) => (
                    <Select.Option key={account.id} value={account.name}>
                      {account.name}
                    </Select.Option>
                  ))}
                </Select>
              )}
            />
          ) : (
            <Stack direction="vertical" gap="r8" style={FIELD_CONTENT_STRETCH}>
              <Input id="destinationAccountName" autoComplete="off" {...register('destinationAccountName')} />
              <Button
                type="button"
                variant="outline"
                label="Use Source site name"
                onClick={() =>
                  setValue('destinationAccountName', getValues('accountName'), {
                    shouldValidate: true,
                    shouldDirty: true,
                    shouldTouch: true,
                  })
                }
              />
            </Stack>
          )
        }
      />
    </FormSection>
  );
};
