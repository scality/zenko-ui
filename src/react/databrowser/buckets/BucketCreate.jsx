// @flow
import { Controller, useForm } from 'react-hook-form';
import FormContainer, * as F from '../../ui-elements/FormLayout';
import React, { useMemo, useRef } from 'react';
import { clearError, createBucket } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Banner, Toggle } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers';
import { locationWithIngestion } from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { storageOptions } from '../../backend/location/LocationDetails';
import { useOutsideClick } from '../../utils/hooks';

const schema = Joi.object({
    name: Joi.string().label('Name').required().min(3).max(63),
    locationName: Joi.string().required(),
});

function BucketCreate() {
  // TODO: redirect to list buckets if no account
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
  const capabilities = useSelector(
    (state: AppState) => state.instanceStatus.latest.state.capabilities,
  );

  const clearServerError = () => {
    if (hasError) {
      dispatch(clearError());
    }
  };
  // clear server errors if clicked on outside of element.
  const formRef = useRef(null);
  useOutsideClick(formRef, clearServerError);

    const onSubmit = ({ name, locationName }) => {
        clearServerError();
        dispatch(createBucket({ name, locationConstraint: locationName }));
    };

  const handleCancel = () => {
    clearServerError();
    dispatch(push('/buckets'));
  };

  const renderLocation = option => {
    const locationType = option.locationType;
    const mirrorMode = option.mirrorMode;
    const locationTypeName = storageOptions[locationType].name;
    return mirrorMode
      ? `${
          option.value.split(':ingest')[0]
        } (Mirror mode) (${locationTypeName})`
      : `${option.value} (${locationTypeName})`;
  };

  const selectLocations = useMemo(() => {
    return locationWithIngestion(locations, capabilities);
  }, [locations, capabilities]);

    return <FormContainer>
        <F.Form ref={formRef}>
            <F.Title> Create a New Bucket </F.Title>
            <F.Fieldset>
                <F.Label tooltipMessages={['Must be unique', 'Cannot be modified after creation']} tooltipWidth="15rem">
                    Bucket Name
                </F.Label>
                <F.Input
                    type='text'
                    id='name'
                    name='name'
                    ref={register}
                    onChange={clearServerError}
                    autoComplete='off' />
                <F.ErrorInput id='error-name' hasError={errors.name}> {errors.name?.message} </F.ErrorInput>
            </F.Fieldset>
            <F.Fieldset>
                <F.Label tooltipMessages={['Cannot be modified after creation']} tooltipWidth="13rem">
                    Select Storage Location
                </F.Label>
                <Controller
                    control={control}
                    id='locationName'
                    name='locationName'
                    defaultValue='us-east-1'
                    render={({ onChange, value: locationName }) => {
                        return <F.Select
                            onChange={onChange}
                            placeholder='Location Name'
                            value={locationName}
                        >
                            {selectLocations.map((opt, i) => <F.Select.Option key={i} value={opt.value}>{renderLocation(opt)}</F.Select.Option>)}
                        </F.Select>;
                    }}
                />
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
              id="create-account-btn"
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

export default BucketCreate;
