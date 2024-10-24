import {
  Banner,
  Checkbox,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
} from '@scality/core-ui';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { ChangeEvent, useMemo, useRef } from 'react';
import { clearError } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { isIngestLocation } from '../../utils/storageOptions';
import { useOutsideClick } from '../../utils/hooks';
import ObjectLockRetentionSettings, {
  objectLockRetentionSettingsValidationRules,
} from './ObjectLockRetentionSettings';
import { XDM_FEATURE } from '../../../js/config';
import { renderLocation } from '../../locations/utils';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { useHistory, useParams } from 'react-router-dom';
import {
  useChangeBucketDefaultRetention,
  useChangeBucketVersionning,
  useCreateBucket,
} from '../../next-architecture/domain/business/buckets';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';

const helpNonAsyncLocation =
  'Selected Storage Location does not support Async Metadata updates.';
const helpAsyncNotification =
  'Pause/resume Async Metadata updates is handled at the location level.';

export const bucketNameValidationSchema = Joi.string()
  .label('Bucket Name')
  .required()
  .min(3)
  .pattern(/^[a-z0-9.-]+$/)
  .max(63);

export const bucketErrorMessage =
  'Bucket names can include only lowercase letters, numbers, dots (.), and hyphens (-)';
const schema = Joi.object({
  name: bucketNameValidationSchema,
  locationName: Joi.string().required(),
  isVersioning: Joi.boolean(),
  isAsyncNotification: Joi.boolean(),
  ...objectLockRetentionSettingsValidationRules,
});

function BucketCreate() {
  // TODO: redirect to list buckets if no account
  const history = useHistory();
  const { accountName } = useParams<{ accountName: string }>();

  const useFormMethods = useForm({
    mode: 'all',
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
  const isVersioning = watch('isVersioning');
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
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const {
    accountsLocationsAndEndpoints,
    status: accountsLocationsAndEndpointsStatus,
  } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter,
  });

  const capabilities = useSelector(
    (state: AppState) => state.instanceStatus.latest.state.capabilities,
  );
  const { features } = useConfig();
  const watchedLocation = accountsLocationsAndEndpoints?.locations.find(
    (l) => l.name === watchLocationName,
  );
  const isAsyncNotificationReady = useMemo(
    () =>
      !!watchLocationName &&
      !!watchedLocation &&
      isIngestLocation(watchedLocation, capabilities),
    [watchLocationName, accountsLocationsAndEndpoints?.locations, capabilities],
  );

  const isLocationAzureOrGcpSelected = (locationName: string) => {
    const location = accountsLocationsAndEndpoints?.locations.find(
      (l) => l.name === locationName,
    );
    return (
      //@ts-expect-error fix this when you are working on it
      location?.type === 'location-azure-v1' ||
      //@ts-expect-error fix this when you are working on it
      location?.type === 'location-gcp-v1'
    );
  };

  const isWatchedLocationAzureOrGCPSelected =
    isLocationAzureOrGcpSelected(watchLocationName);

  const clearServerError = () => {
    if (hasError) {
      dispatch(clearError());
    }
  };

  // clear server errors if clicked on outside of element.
  const formRef = useRef(null);
  useOutsideClick(formRef, clearServerError);

  const { mutate: createBucket, error } = useCreateBucket();
  const { mutate: changeBucketVersionning } = useChangeBucketVersionning();
  const { mutate: changeBucketDefaultRetention } =
    useChangeBucketDefaultRetention();

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
    let lName = locationName;
    const location = accountsLocationsAndEndpoints?.locations.find(
      (location) => location.name === locationName,
    );
    if (
      isAsyncNotification &&
      location &&
      isIngestLocation(location, capabilities)
    ) {
      lName = `${locationName}:ingest`;
    }

    createBucket(
      {
        Bucket: name,
        CreateBucketConfiguration: {
          LocationConstraint: lName,
        },
        ObjectLockEnabledForBucket: isObjectLockEnabled,
      },
      {
        onSuccess: () => {
          if (isVersioning) {
            changeBucketVersionning({
              Bucket: name,
              VersioningConfiguration: {
                Status: 'Enabled',
              },
            });
          }

          if (isDefaultRetentionEnabled) {
            const retentionPeriodToSubmit =
              retentionPeriodFrequencyChoice === 'DAYS'
                ? {
                    Days: retentionPeriod,
                  }
                : {
                    Years: retentionPeriod,
                  };
            changeBucketDefaultRetention({
              Bucket: name,
              ObjectLockConfiguration: {
                ObjectLockEnabled: 'Enabled',
                Rule: {
                  DefaultRetention: {
                    Mode: retentionMode,
                    ...retentionPeriodToSubmit,
                  },
                },
              },
            });
          }
          history.push(`/accounts/${accountName}/buckets/${name}`);
        },
      },
    );
  };

  const handleCancel = () => {
    clearServerError();
    history.push('/buckets');
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
          (errorMessage || error) && (
            <Banner
              variant="danger"
              icon={<Icon name="Exclamation-triangle" />}
              title={'Error'}
            >
              {errorMessage ||
                (error &&
                  typeof error === 'object' &&
                  'message' in error &&
                  error?.message) ||
                'An unexpected error occurred.'}
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
          />
          <FormGroup
            id="locationName"
            label="Storage Service Location"
            required
            direction="horizontal"
            labelHelpTooltip="Cannot be modified after creation"
            helpErrorPosition="bottom"
            content={
              <Controller
                control={control}
                name="locationName"
                render={({ field: { onChange, value: locationName } }) => {
                  if (accountsLocationsAndEndpointsStatus === 'loading') {
                    return <>Loading locations...</>;
                  }
                  return (
                    <Select
                      id="locationName"
                      onChange={(value) => {
                        onChange(value);
                        // Note: when changing location we make sure
                        // to reset isAsyncNotification toggle to false.
                        setValue('isAsyncNotification', false);
                        if (isLocationAzureOrGcpSelected(value)) {
                          setValue('isVersioning', false);
                        } else if (isObjectLockEnabled) {
                          setValue('isVersioning', true);
                        }
                      }}
                      placeholder="Location Name"
                      value={locationName}
                      size="1"
                    >
                      {accountsLocationsAndEndpoints?.locations &&
                        accountsLocationsAndEndpoints?.locations.map(
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
            }
          />
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
                <Checkbox
                  id="isAsyncNotification"
                  disabled={!isAsyncNotificationReady}
                  label={isAsyncNotification ? 'Enabled' : 'Disabled'}
                  {...register('isAsyncNotification', {
                    onChange(e: ChangeEvent<HTMLInputElement>) {
                      matchVersioning(e.target.checked);
                    },
                  })}
                />
              }
            />
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
              <Checkbox
                id="isVersioning"
                disabled={
                  isObjectLockEnabled ||
                  isAsyncNotification ||
                  isWatchedLocationAzureOrGCPSelected
                }
                label={isVersioning ? 'Active' : 'Inactive'}
                {...register('isVersioning')}
              />
            }
            disabled={
              isObjectLockEnabled ||
              isAsyncNotification ||
              isWatchedLocationAzureOrGCPSelected
            }
            helpErrorPosition="bottom"
            help={
              isWatchedLocationAzureOrGCPSelected
                ? 'Selected Storage Location does not support versioning.'
                : isObjectLockEnabled || isAsyncNotification
                ? `Automatically activated when
            ${isObjectLockEnabled ? 'Object-lock' : ''}
            ${isObjectLockEnabled && isAsyncNotification ? 'or' : ''}
            ${isAsyncNotification ? 'Async Metadata updates' : ''}
            is Enabled`
                : ''
            }
          />
        </FormSection>
        <ObjectLockRetentionSettings
          isLocationAzureOrGcpSelected={isWatchedLocationAzureOrGCPSelected}
        />
      </Form>
    </FormProvider>
  );
}

export default BucketCreate;
