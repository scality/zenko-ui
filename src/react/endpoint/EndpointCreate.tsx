import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
  spacing,
} from '@scality/core-ui';
import { Box, Button, Input, Select } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import {
  useCreateEndpointMutation,
  useWaitForRunningConfigurationVersionToBeUpdated,
} from '../../js/mutations';
import { renderLocation } from '../locations/utils';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';

const BannerMessageList = styled.ul`
  margin: ${spacing.r8} 0;
  padding-left: ${spacing.r16};
  li {
    margin-bottom: ${spacing.r8};
  }
`;

const schema = Joi.object({
  hostname: Joi.string().label('Hostname').required().min(3),
  locationName: Joi.string().required(),
});

function EndpointCreate() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    resolver: joiResolver(schema),
    defaultValues: {
      hostname: '',
      locationName: 'us-east-1',
    },
  });
  const history = useHistory();
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const {
    accountsLocationsAndEndpoints,
    status,
    refetchAccountsLocationsEndpointsMutation,
  } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter,
  });
  const createEndpointMutation = useCreateEndpointMutation();
  const instanceId = useInstanceId();
  const loading = status === 'idle' || status === 'loading';
  const {
    setReferenceVersion,
    waitForRunningConfigurationVersionToBeUpdated,
    status: waiterStatus,
  } = useWaitForRunningConfigurationVersionToBeUpdated();

  const onSubmit = ({
    hostname,
    locationName,
  }: {
    hostname: string;
    locationName: string;
  }) => {
    setReferenceVersion({
      onRefTaken: () => {
        createEndpointMutation.mutate(
          {
            hostname,
            locationName,
            instanceId,
          },
          {
            onSuccess: () => {
              waitForRunningConfigurationVersionToBeUpdated();
            },
          },
        );
      },
    });
  };

  useMemo(() => {
    if (waiterStatus === 'success') {
      refetchAccountsLocationsEndpointsMutation.mutate(undefined, {
        onSuccess: () => {
          history.push('/dataservices');
        },
      });
    }
  }, [waiterStatus]);

  const handleCancel = () => {
    history.push('/dataservices');
  };

  return (
    <Form
      layout={{ kind: 'page', title: 'Create new Data Service' }}
      requireMode="partial"
      rightActions={
        <Stack gap="r16">
          <Button
            disabled={
              createEndpointMutation.isLoading || waiterStatus === 'waiting'
            }
            id="cancel-btn"
            variant="outline"
            onClick={handleCancel}
            label="Cancel"
            type="button"
          />
          <Button
            disabled={
              !isValid ||
              createEndpointMutation.isLoading ||
              loading ||
              waiterStatus === 'waiting'
            }
            id="create-endpoint-btn"
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            label={
              createEndpointMutation.isLoading || waiterStatus === 'waiting'
                ? 'Creating...'
                : 'Create'
            }
          />
        </Stack>
      }
      banner={
        <Stack gap="r16" direction="vertical">
          <Banner
            icon={
              <Box display="flex" alignItems="center" ml={spacing.r8}>
                <Icon
                  name="Exclamation-circle"
                  color="statusWarning"
                  size="lg"
                />
              </Box>
            }
            variant="warning"
          >
            <BannerMessageList>
              <li>Expect some delay—creating a new Data Service takes time.</li>
              <li>
                Creating a new Data Service will regenerate all Certificates
                related to Data Services. If these Certificates were already
                replaced by ones issued by your Authority, they will have to be
                replaced again. Contact your Platform admin if needed.
              </li>
            </BannerMessageList>
          </Banner>
          {createEndpointMutation.isError ? (
            <Banner
              icon={<Icon name="Exclamation-triangle" />}
              title="Error"
              variant="danger"
            >
              {createEndpointMutation.error?.message}
            </Banner>
          ) : null}
        </Stack>
      }
    >
      <FormSection>
        <FormGroup
          id="hostname"
          label="Hostname (endpoint)"
          labelHelpTooltip="Cannot be modified after creation."
          direction="vertical"
          error={errors.hostname?.message ?? ''}
          required
          content={
            <Input
              type="text"
              id="hostname"
              {...register('hostname')}
              placeholder="s3.example.com"
              autoFocus
              autoComplete="off"
            />
          }
        />
        <FormGroup
          id="locationName"
          label="Storage Location"
          direction="vertical"
          labelHelpTooltip="Cannot be modified after creation."
          required
          content={
            loading ? (
              <>Loading locations...</>
            ) : status === 'error' ? (
              <>Failed to load locations</>
            ) : (
              <Controller
                control={control}
                name="locationName"
                render={({
                  field: { onChange, onBlur, value: locationName },
                }) => {
                  return (
                    <Select
                      id="locationName"
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder="Location Name"
                      value={locationName}
                    >
                      {accountsLocationsAndEndpoints?.locations.map(
                        (location, i) => (
                          <Select.Option
                            key={i}
                            value={location.name}
                            disabled={location?.isCold}
                          >
                            {renderLocation(location)}
                          </Select.Option>
                        ),
                      )}
                    </Select>
                  );
                }}
              />
            )
          }
        />
      </FormSection>
    </Form>
  );
}

export default EndpointCreate;
