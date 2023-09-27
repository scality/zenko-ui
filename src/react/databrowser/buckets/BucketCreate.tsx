import {
  Checkbox,
  Form,
  FormGroup,
  FormSection,
  Stack,
  useMutationsHandler,
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
import { MutationConfig } from '../../ToastProvider';
import {
  useChangeBucketDefaultRetention,
  useChangeBucketVersionning,
  useCreateBucket,
} from '../../next-architecture/domain/business/buckets';
import { PromiseResult } from 'aws-sdk/lib/request';
import { AWSError, S3 } from 'aws-sdk';

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

  const isLocationAzureOrGcpSelected = (locationName: string) =>
    locations?.[locationName]?.locationType === 'location-azure-v1' ||
    locations?.[locationName]?.locationType === 'location-gcp-v1';

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

  const createBucketMutation = useCreateBucket();
  const changeBucketVersionningMutation = useChangeBucketVersionning();
  const changeBucketDefaultRetentionMutation =
    useChangeBucketDefaultRetention();

  const { mutate: createBucket, error } = createBucketMutation;
  const { mutate: changeBucketVersionning } = changeBucketVersionningMutation;
  const { mutate: changeBucketDefaultRetention } =
    changeBucketDefaultRetentionMutation;

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

    if (
      isAsyncNotification &&
      locations &&
      isIngestLocation(locations[locationName], capabilities)
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

  const mainMutation = {
    mutation: createBucketMutation,
    name: 'createBucket',
  } as MutationConfig<PromiseResult<S3.CreateBucketOutput, AWSError>, unknown>;

  const dependantMutations = [
    {
      mutation: changeBucketVersionningMutation,
      name: 'changeBucketVersionning',
    },
    {
      mutation: changeBucketDefaultRetentionMutation,
      name: 'changeBucketDefaultRetention',
    },
  ] as MutationConfig<unknown, unknown>[];

  const messageDescriptionBuilder = (
    successMutations: {
      data?: unknown;
      error?: unknown;
      name: string;
    }[],
    errorMutations: {
      data?: unknown;
      error?: unknown;
      name: string;
    }[],
  ) => {
    const bucketCreateMessage = 'Bucket successfully created.';
    const bucketVersionningMessage = 'Bucket version enabled.';
    const retentionMessage = 'Default retention enabled.';

    if (errorMutations.length) {
      return (
        <>
          {errorMessage ||
            (error &&
              typeof error === 'object' &&
              'message' in error &&
              error?.message) ||
            'An unexpected error occurred.'}
        </>
      );
    } else if (successMutations.length) {
      const isBucketCreated = successMutations.find(
        ({ name }) => name === 'createBucket',
      );
      const isBucketVersionning = successMutations.find(
        ({ name }) => name === 'changeBucketVersionning',
      );
      const isBucketDefaultRetention = successMutations.find(
        ({ name }) => name === 'changeBucketDefaultRetention',
      );

      return (
        <>
          {isBucketCreated && <>{bucketCreateMessage}</>}
          {isBucketVersionning && (
            <>
              <br />
              {bucketVersionningMessage}
            </>
          )}
          {isBucketDefaultRetention && (
            <>
              <br />
              {retentionMessage}
            </>
          )}
        </>
      );
    }
  };

  useMutationsHandler({
    mainMutation,
    dependantMutations,
    messageDescriptionBuilder,
    onMainMutationSuccess: () =>
      history.push(`/accounts/${accountName}/buckets/${name}`),
  });

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
