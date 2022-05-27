import { Banner, Toggle } from '@scality/core-ui';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import FormContainer, * as F from '../../ui-elements/FormLayout';
import {
  HelpAsyncNotification,
  HelpNonAsyncLocation,
  HelpBucketCreateVersioning,
} from '../../ui-elements/Help';
import React, { useMemo, useRef } from 'react';
import { clearError, createBucket } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { isIngestLocation } from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { storageOptions } from '../../backend/location/LocationDetails';
import { useOutsideClick } from '../../utils/hooks';
import type { Location } from '../../../types/config';
import ObjectLockRetentionSettings, {
  objectLockRetentionSettingsValidationRules,
} from './ObjectLockRetentionSettings';
import { XDM_FEATURE } from '../../../js/config';
export const bucketErrorMessage =
  'Bucket names can include only lowercase letters, numbers, dots (.), and hyphens (-)';
const schema = Joi.object({
  name: Joi.string()
    .label('Name')
    .required()
    .min(3)
    .pattern(/^[a-z0-9.-]+$/)
    .max(63),
  locationName: Joi.string().required(),
  isVersioning: Joi.boolean(),
  isObjectLockEnabled: Joi.boolean(),
  isAsyncNotification: Joi.boolean(),
  ...objectLockRetentionSettingsValidationRules,
});

function BucketCreate() {
  // TODO: redirect to list buckets if no account
  const useFormMethods = useForm({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: {
      retentionMode: 'GOVERNANCE',
      retentionPeriod: 1,
      retentionPeriodFrequencyChoice: 'DAYS',
    },
  });
  const { register, handleSubmit, control, watch, setValue, formState } =
    useFormMethods;
  const { isValid, errors } = formState;
  const isObjectLockEnabled = watch('isObjectLockEnabled');
  const isAsyncNotification = watch('isAsyncNotification');
  const watchLocationName = watch('locationName');
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
  const features = useSelector((state: AppState) => state.auth.config.features);
  const isAsyncNotificationReady = useMemo(
    () =>
      !!watchLocationName &&
      !!locations &&
      !!locations[watchLocationName] &&
      isIngestLocation(locations[watchLocationName], capabilities),
    [watchLocationName, locations, capabilities],
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
    name,
    locationName,
    isVersioning,
    isObjectLockEnabled,
    isDefaultRetentionEnabled,
    retentionMode,
    retentionPeriod,
    retentionPeriodFrequencyChoice,
    isAsyncNotification,
  }) => {
    clearServerError();
    const retentionPeriodToSubmit =
      retentionPeriodFrequencyChoice === 'DAYS'
        ? {
            days: retentionPeriod,
          }
        : {
            years: retentionPeriod,
          };
    let lName = locationName;

    if (
      isAsyncNotification &&
      isIngestLocation(locations[locationName], capabilities)
    ) {
      lName = `${locationName}:ingest`;
    }

    dispatch(
      createBucket(
        {
          name,
          locationConstraint: lName,
          isObjectLockEnabled,
        },
        {
          isVersioning,
        },
        {
          isDefaultRetentionEnabled,
          retentionMode,
          retentionPeriod: retentionPeriodToSubmit,
        },
      ),
    );
  };

  const handleCancel = () => {
    clearServerError();
    dispatch(push('/buckets'));
  };

  const renderLocation = (option: Location) => {
    const locationType = option.locationType;
    const locationTypeName = storageOptions[locationType]?.name;
    if (option.isCold) {
      return `${option.name} (${locationTypeName}) - Cold Location can't be used`;
    }
    return `${option.name} (${locationTypeName})`;
  };

  const matchVersioning = (checked: boolean) => {
    if (checked) {
      setValue('isVersioning', true);
    }
  };

  return (
    <FormProvider {...useFormMethods}>
      <FormContainer>
        <F.Form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
          <F.Title> Create a New Bucket </F.Title>
          <F.SubTitle>All * Are Mandatory Fields</F.SubTitle>
          <F.FormScrollArea>
            <F.Fieldset>
              <F.Label
                htmlFor="name"
                tooltipMessages={[
                  'Must be unique',
                  'Cannot be modified after creation',
                  bucketErrorMessage,
                ]}
                tooltipWidth="20rem"
              >
                Bucket Name*
              </F.Label>
              <F.Input
                type="text"
                id="name"
                {...register('name')}
                autoFocus={true}
                onChange={clearServerError}
                aria-invalid={!!errors.name}
                aria-describedby="error-name"
                autoComplete="off"
              />
              <F.ErrorInput id="error-name" hasError={errors.name}>
                {' '}
                {errors.name?.type === 'string.pattern.base'
                  ? bucketErrorMessage
                  : errors.name?.message}{' '}
              </F.ErrorInput>
            </F.Fieldset>
            <F.Fieldset>
              <F.Label
                tooltipMessages={['Cannot be modified after creation']}
                tooltipWidth="13rem"
              >
                Select Storage Location*
              </F.Label>
              <Controller
                control={control}
                id="locationName"
                name="locationName"
                defaultValue="us-east-1"
                render={({ field: { onChange, value: locationName } }) => {
                  return (
                    <F.Select
                      onChange={(value) => {
                        onChange(value);
                        // Note: when changing location we make sure
                        // to reset isAsyncNotification toggle to false.
                        setValue('isAsyncNotification', false);
                      }}
                      placeholder="Location Name"
                      value={locationName}
                    >
                      {Object.values(locations).map((location: any, i) => (
                        <F.Select.Option
                          key={i}
                          value={location.name}
                          disabled={location?.isCold}
                        >
                          {renderLocation(location)}
                        </F.Select.Option>
                      ))}
                    </F.Select>
                  );
                }}
              />
            </F.Fieldset>
            {features.includes(XDM_FEATURE) && (
              <F.Fieldset direction={'row'}>
                <F.Label
                  tooltipMessages={[
                    'Enabling Async Metadata updates automatically activates Versioning for the bucket, and you won’t be able to suspend Versioning.',
                  ]}
                  tooltipWidth="28rem"
                >
                  Async Metadata updates
                </F.Label>
                <Controller
                  control={control}
                  id="isAsyncNotification"
                  name="isAsyncNotification"
                  defaultValue={false}
                  render={({
                    field: { onChange, value: isAsyncNotification },
                  }) => {
                    return (
                      <>
                        <Toggle
                          disabled={!isAsyncNotificationReady}
                          onChange={(e) => {
                            onChange(e.target.checked);
                            matchVersioning(e.target.checked);
                          }}
                          label={isAsyncNotification ? 'Enabled' : 'Disabled'}
                          toggle={isAsyncNotification}
                          placeholder="isAsyncNotification"
                        />
                        {watchLocationName &&
                          isAsyncNotificationReady &&
                          isAsyncNotification && <HelpAsyncNotification />}
                      </>
                    );
                  }}
                />
                {watchLocationName && !isAsyncNotificationReady && (
                  <HelpNonAsyncLocation />
                )}
              </F.Fieldset>
            )}
            <F.SessionSeperation />
            <F.Fieldset direction={'row'}>
              <F.Label>Versioning</F.Label>
              <Controller
                control={control}
                id="isVersioning"
                name="isVersioning"
                defaultValue={false}
                render={({ field: { onChange, value: isVersioning } }) => {
                  return (
                    <Toggle
                      disabled={isObjectLockEnabled || isAsyncNotification}
                      onChange={(e) => onChange(e.target.checked)}
                      placeholder="Versioning"
                      label={isVersioning ? 'Active' : 'Inactive'}
                      toggle={isVersioning}
                    />
                  );
                }}
              />
              {(isObjectLockEnabled || isAsyncNotification) && (
                <HelpBucketCreateVersioning
                  isObjectLockEnabled={isObjectLockEnabled}
                  isAsyncNotification={isAsyncNotification}
                />
              )}
            </F.Fieldset>
            <F.SessionSeperation />
            <F.SubTitle>Object-lock option</F.SubTitle>
            <F.Fieldset direction={'row'}>
              <F.Label
                tooltipMessages={[
                  'Object-lock option cannot be removed after bucket creation, but you will be able to disable the retention itself on edition.',
                  'Once the bucket is created, you might be blocked from deleting the objects and the bucket.',
                  'Enabling Object-lock automatically activates Versioning for the bucket, and you won’t be able to suspend Versioning.',
                ]}
                tooltipWidth="28rem"
              >
                Object-lock
              </F.Label>
              <Controller
                control={control}
                id="isObjectLockEnabled"
                name="isObjectLockEnabled"
                defaultValue={false}
                render={({
                  field: { onChange, value: isObjectLockEnabled },
                }) => {
                  return (
                    <Toggle
                      onChange={(e) => {
                        onChange(e.target.checked);
                        matchVersioning(e.target.checked);
                      }}
                      placeholder="isObjectLockEnabled"
                      label={isObjectLockEnabled ? 'Enabled' : 'Disabled'}
                      toggle={isObjectLockEnabled}
                    />
                  );
                }}
              />
            </F.Fieldset>
            <SpacedBox md={2}>
              <F.LabelSecondary>
                Permanently allows objects in this bucket to be locked.
              </F.LabelSecondary>
            </SpacedBox>
            {isObjectLockEnabled && <ObjectLockRetentionSettings />}
          </F.FormScrollArea>
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
                type="button"
                label="Cancel"
              />
              <Button
                disabled={loading || !isValid}
                id="create-account-btn"
                type="submit"
                variant="primary"
                label="Create"
              />
            </F.FooterButtons>
          </F.Footer>
        </F.Form>
      </FormContainer>
    </FormProvider>
  );
}

export default BucketCreate;
