// @flow
import { Controller, useForm } from 'react-hook-form';
import FormContainer, * as F from '../ui-elements/FormLayout';
import React, { useRef } from 'react';
import { clearError, createEndpoint } from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import type { Location } from '../../types/config';
import { joiResolver } from '@hookform/resolvers';
import { push } from 'connected-react-router';
import { storageOptions } from '../backend/location/LocationDetails';
import { useOutsideClick } from '../utils/hooks';

const schema = Joi.object({
  hostname: Joi.string()
    .label('Host Name')
    .required()
    .min(3),
  locationName: Joi.string().required(),
});

function EndpointCreate() {
  const { register, handleSubmit, errors, control } = useForm({
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
    (state: AppState) => state.configuration.latest.locations,
  );

  const clearServerError = () => {
    if (hasError) {
      dispatch(clearError());
    }
  };
  // clear server errors if clicked on outside of element.
  const formRef = useRef(null);
  useOutsideClick(formRef, clearServerError);

  const onSubmit = ({ hostname, locationName }) => {
    clearServerError();
    dispatch(createEndpoint(hostname, locationName));
  };

  const handleCancel = () => {
    clearServerError();
    dispatch(push('/dataservices'));
  };

  const renderLocation = (option: Location) => {
    const locationType = option.locationType;
    const locationTypeName = storageOptions[locationType].name;
    return `${option.name} (${locationTypeName})`;
  };

  return (
    <FormContainer>
      <F.Form ref={formRef}>
        <F.Title> Create a New Data Service </F.Title>
        <F.Fieldset>
          <F.Label tooltipMessages={['Cannot be modified after creation']}>
            Hostname (endpoint)
          </F.Label>
          <F.Input
            type="text"
            id="hostname"
            name="hostname"
            placeholder="s3.example.com"
            ref={register}
            onChange={clearServerError}
            disabled={loading}
            autoComplete="off"
          />
          <F.ErrorInput id="error-name" hasError={errors.hostname}>
            {' '}
            {errors.hostname?.message}{' '}
          </F.ErrorInput>
        </F.Fieldset>
        <F.Fieldset>
          <F.Label tooltipMessages={['Cannot be modified after creation']}>
            Select Storage Location
          </F.Label>
          <Controller
            control={control}
            id="locationName"
            name="locationName"
            defaultValue="us-east-1"
            render={({ onChange, value: locationName }) => {
              return (
                <F.Select
                  onChange={onChange}
                  placeholder="Location Name"
                  value={locationName}
                  disabled={loading}
                >
                  {Object.values(locations).map((location: any, i) => (
                    <F.Select.Option key={i} value={location.name}>
                      {renderLocation(location)}
                    </F.Select.Option>
                  ))}
                </F.Select>
              );
            }}
          />
        </F.Fieldset>
        <F.Footer>
          <F.FooterError>
            {hasError && (
              <Banner
                id="zk-error-banner"
                icon={<i className="fas fa-exclamation-triangle" />}
                title="Error"
                variant="danger"
              >
                {errorMessage}
              </Banner>
            )}
          </F.FooterError>
          <F.FooterButtons>
            <Button
              disabled={loading}
              id="cancel-btn"
              variant="outline"
              onClick={handleCancel}
              label="Cancel"
            />
            <Button
              disabled={loading}
              id="create-endpoint-btn"
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              label="Create"
            />
          </F.FooterButtons>
        </F.Footer>
      </F.Form>
    </FormContainer>
  );
}

export default EndpointCreate;