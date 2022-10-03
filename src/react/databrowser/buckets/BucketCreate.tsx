import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
  Toggle,
} from '@scality/core-ui';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { ChangeEvent, useMemo, useRef } from 'react';
import { clearError, createBucket } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { isIngestLocation } from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { useOutsideClick } from '../../utils/hooks';
import ObjectLockRetentionSettings, {
  objectLockRetentionSettingsValidationRules,
} from './ObjectLockRetentionSettings';
import { XDM_FEATURE } from '../../../js/config';
import { renderLocation } from '../../backend/location/utils';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { useParams } from 'react-router';

const helpNonAsyncLocation =
  'Selected Storage Location does not support Async Metadata updates.';
const helpAsyncNotification =
  'Pause/resume Async Metadata updates is handled at the location level.';

export const bucketErrorMessage =
  'Bucket names can include only lowercase letters, numbers, dots (.), and hyphens (-)';
const schema = Joi.object({
  name: Joi.string()
    .label('Bucket Name')
    .required()
    .min(3)
    .pattern(/^[a-z0-9.-]+$/)
    .max(63),
  locationName: Joi.string().required(),
  isVersioning: Joi.boolean(),
  isAsyncNotification: Joi.boolean(),
  ...objectLockRetentionSettingsValidationRules,
});

function BucketCreate() {
  // TODO: redirect to list buckets if no account
  const { accountName } = useParams<{ accountName: string }>();

  const useFormMethods = useForm({
    mode: 'onChange',
    resolver: joiResolver(schema),
    defaultValues: {
      name: '',
      locationName: 'us-east-1',
      isVersioning: false,
      isAsyncNotification: false,
      isObjectLockEnabled: false,
      isDefaultRetentionEnabled: false,
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
    (state: AppState) => state.configuration.latest?.locations,
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
  }: {
    name: string;
    locationName: string;
    isVersioning: boolean;
    isObjectLockEnabled: boolean;
    isDefaultRetentionEnabled: boolean;
    retentionMode: string;
    retentionPeriod: number;
    retentionPeriodFrequencyChoice: string;
    isAsyncNotification: boolean;
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
      locations &&
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

  const matchVersioning = (checked: boolean) => {
    if (checked) {
      setValue('isVersioning', true);
    }
  };

  return (
    <FormProvider {...useFormMethods}>
      <Form
        layout={{
          kind: 'page',
          title: 'Create a New Bucket',
          subTitle: `in Account: ${accountName}`,
        }}
        requireMode="partial"
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        rightActions={
          <Stack gap="r16">
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
          </Stack>
        }
        banner={
          errorMessage && (
            <Banner
              variant="danger"
              icon={<Icon name="Exclamation-triangle" />}
              title={'Error'}
            >
              {errorMessage}
            </Banner>
          )
        }
      >
        <FormSection forceLabelWidth={convertRemToPixels(17.5)}>
          <FormGroup
            id="name"
            label="Bucket Name"
            required
            direction="horizontal"
            content={
              <Input
                id="name"
                autoFocus
                {...register('name', { onChange: clearServerError })}
              ></Input>
            }
            labelHelpTooltip={
              <ul>
                <li>Must be unique</li>
                <li>Cannot be modified after creation</li>
                <li>{bucketErrorMessage}</li>
              </ul>
            }
            helpErrorPosition="bottom"
            error={
              errors.name
                ? errors.name?.type === 'string.pattern.base'
                  ? bucketErrorMessage
                  : errors.name?.message
                : undefined
            }
          ></FormGroup>
          <FormGroup
            id="locationName"
            label="Selected Storage Service Location"
            required
            direction="horizontal"
            labelHelpTooltip="Cannot be modified after creation"
            helpErrorPosition="bottom"
            content={
              <Controller
                control={control}
                name="locationName"
                render={({ field: { onChange, value: locationName } }) => {
                  return (
                    <Select
                      id="locationName"
                      onChange={(value) => {
                        onChange(value);
                        // Note: when changing location we make sure
                        // to reset isAsyncNotification toggle to false.
                        setValue('isAsyncNotification', false);
                      }}
                      placeholder="Location Name"
                      value={locationName}
                      size="1"
                    >
                      {locations &&
                        Object.values(locations).map((location, i) => (
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
          ></FormGroup>
          {features.includes(XDM_FEATURE) ? (
            <FormGroup
              id="isAsyncNotification"
              label="Async Metadata updates"
              help={
                watchLocationName &&
                isAsyncNotificationReady &&
                isAsyncNotification
                  ? helpAsyncNotification
                  : watchLocationName && !isAsyncNotificationReady
                  ? helpNonAsyncLocation
                  : ''
              }
              helpErrorPosition="bottom"
              disabled={!isAsyncNotificationReady}
              labelHelpTooltip={
                'Enabling Async Metadata updates automatically activates Versioning for the bucket, and you won’t be able to suspend Versioning.'
              }
              content={
                <Controller
                  control={control}
                  name="isAsyncNotification"
                  render={({
                    field: { onChange, value: isAsyncNotification },
                  }) => {
                    return (
                      <>
                        <Toggle
                          disabled={!isAsyncNotificationReady}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            onChange(e.target.checked);
                            matchVersioning(e.target.checked);
                          }}
                          label={isAsyncNotification ? 'Enabled' : 'Disabled'}
                          toggle={isAsyncNotification}
                          placeholder="isAsyncNotification"
                        />
                      </>
                    );
                  }}
                />
              }
            ></FormGroup>
          ) : (
            <></>
          )}
          <FormGroup
            id="isVersioning"
            label="Versioning"
            labelHelpTooltip={
              <ul>
                <li>
                  Versioning keeps multiple versions of each objects in your
                  bucket. You can restore deleted or overwritten objects as a
                  result of unintended user actions or application failures.
                </li>
                <li>
                  It's possible to enable and suspend versioning at the bucket
                  level after the bucket creation.
                </li>
              </ul>
            }
            content={
              <Controller
                control={control}
                name="isVersioning"
                render={({ field: { onChange, value: isVersioning } }) => {
                  return (
                    <Toggle
                      disabled={isObjectLockEnabled || isAsyncNotification}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onChange(e.target.checked)
                      }
                      placeholder="Versioning"
                      label={isVersioning ? 'Active' : 'Inactive'}
                      toggle={isVersioning}
                    />
                  );
                }}
              />
            }
            disabled={isObjectLockEnabled || isAsyncNotification}
            helpErrorPosition="bottom"
            help={
              isObjectLockEnabled || isAsyncNotification
                ? `Automatically activated when
            ${isObjectLockEnabled ? 'Object-lock' : ''}
            ${isObjectLockEnabled && isAsyncNotification ? 'or' : ''}
            ${isAsyncNotification ? 'Async Metadata updates' : ''}
            is Enabled`
                : 'Automatically activated when Object-lock is Active.'
            }
          ></FormGroup>
        </FormSection>
        <ObjectLockRetentionSettings />
      </Form>
    </FormProvider>
  );
}

export default BucketCreate;
