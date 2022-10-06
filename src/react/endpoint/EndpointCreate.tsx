import { Controller, useForm } from 'react-hook-form';
import { useRef } from 'react';
import { clearError, createEndpoint } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
} from '@scality/core-ui';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { push } from 'connected-react-router';
import { useOutsideClick } from '../utils/hooks';
import { renderLocation } from '../backend/location/utils';

const schema = Joi.object({
  hostname: Joi.string().label('Hostname').required().min(3),
  locationName: Joi.string().required(),
});

function EndpointCreate() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    mode: 'all',
    resolver: joiResolver(schema),
  });
  const dispatch = useDispatch();
  const hasError = useSelector(
    (state: AppState) =>
      !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
  );
  const errorMessage = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const locations = useSelector(
    (state: AppState) => state.configuration.latest?.locations,
  );

  const clearServerError = () => {
    if (hasError) {
      dispatch(clearError());
    }
  };

  // clear server errors if clicked on outside of element.
  const formRef = useRef(null);
  useOutsideClick(formRef, clearServerError);

  const onSubmit = ({
    hostname,
    locationName,
  }: {
    hostname: string;
    locationName: string;
  }) => {
    clearServerError();
    dispatch(createEndpoint(hostname, locationName));
  };

  const handleCancel = () => {
    clearServerError();
    dispatch(push('/dataservices'));
  };

  return (
    <Form
      ref={formRef}
      layout={{ kind: 'page', title: 'Create a New Data Service' }}
      requireMode="partial"
      rightActions={
        <Stack gap="r16">
          <Button
            disabled={loading}
            id="cancel-btn"
            variant="outline"
            onClick={handleCancel}
            label="Cancel"
            type="button"
          />
          <Button
            disabled={loading}
            id="create-endpoint-btn"
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            label="Create"
          />
        </Stack>
      }
      banner={
        hasError && (
          <Banner
            id="zk-error-banner"
            icon={<Icon name="Exclamation-triangle" />}
            title="Error"
            variant="danger"
          >
            {errorMessage}
          </Banner>
        )
      }
    >
      <FormSection>
        <FormGroup
          id="hostname"
          label="Hostname (endpoint)"
          labelHelpTooltip="Cannot be modified after creation."
          direction="vertical"
          error={errors.hostname?.message ?? ''}
          content={
            <Input
              type="text"
              id="hostname"
              {...register('hostname')}
              placeholder="s3.example.com"
              onChange={clearServerError}
              disabled={loading}
              autoComplete="off"
            />
          }
        />
        <FormGroup
          id="locationName"
          label="Storage Location"
          direction="vertical"
          labelHelpTooltip="Cannot be modified after creation."
          content={
            <Controller
              control={control}
              name="locationName"
              defaultValue="us-east-1"
              render={({ field: { onChange, value: locationName } }) => {
                return (
                  <Select
                    id="locationName"
                    onChange={onChange}
                    placeholder="Location Name"
                    value={locationName}
                    disabled={loading}
                  >
                    {Object.values(locations || []).map((location: any, i) => (
                      <Select.Option
                        key={i}
                        value={location.name}
                        disabled={location?.isCold}
                      >
                        {renderLocation(location)}
                      </Select.Option>
                    ))}
                  </Select>
                );
              }}
            />
          }
        />
      </FormSection>
    </Form>
  );
}

export default EndpointCreate;
