// @flow
import { Banner, Input, Toggle } from '@scality/core-ui';
import { SmallerText } from '@scality/core-ui/dist/components/text/Text.component';
import SpacedBox from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { Controller, useForm } from 'react-hook-form';
import FormContainer, * as F from '../../ui-elements/FormLayout';
import React, { useMemo, useRef } from 'react';
import { clearError, createBucket } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers';
import { locationWithIngestion } from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { storageOptions } from '../../backend/location/LocationDetails';
import { useOutsideClick } from '../../utils/hooks';
import { spacing } from '@scality/core-ui/dist/style/theme';

const schema = Joi.object({
  name: Joi.string()
    .label('Name')
    .required()
    .min(3)
    .max(63),
  locationConstraint: Joi.object(),
  isVersioning: Joi.boolean(),
  isObjectLockEnabled: Joi.boolean(),
  isDefaultRetentionEnabled: Joi.boolean(),
  retentionMode: Joi.string().required(),
  retentionPeriod: Joi.number().required(),
  retentionPeriodFrequencyChoice: Joi.string().required(),
});

function BucketCreate() {
  // TODO: redirect to list buckets if no account
  const {
    register,
    handleSubmit,
    errors,
    control,
    watch,
    setValue,
    formState,
  } = useForm({
    resolver: joiResolver(schema),
    defaultValues: {
      retentionMode: 'GOVERNANCE',
      retentionPeriod: 1,
    },
  });

  const { dirtyFields } = formState;

  const isObjectLockEnabled = watch('isObjectLockEnabled');
  const isDefaultRetentionEnabled = watch('isDefaultRetentionEnabled');

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

  const onSubmit = ({
    name,
    locationConstraint,
    isVersioning,
    isObjectLockEnabled,
    isDefaultRetentionEnabled,
    retentionMode,
    retentionPeriod,
    retentionPeriodFrequencyChoice,
  }) => {
    clearServerError();
    const retentionPeriodToSubmit =
      retentionPeriodFrequencyChoice === 'YEARS'
        ? { years: retentionPeriod }
        : { days: retentionPeriod };
    dispatch(
      createBucket(
        {
          name,
          locationConstraint: locationConstraint?.value,
          isObjectLockEnabled,
        },
        { isVersioning },
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

  return (
    <FormContainer>
      <F.Form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <F.Title> Create a New Bucket </F.Title>
        <F.Fieldset>
          <F.Label
            tooltipMessages={[
              'Must be unique',
              'Cannot be modified after creation',
            ]}
            tooltipWidth="15rem"
          >
            Bucket Name
          </F.Label>
          <F.Input
            type="text"
            id="name"
            name="name"
            ref={register}
            autoFocus={true}
            onChange={clearServerError}
            autoComplete="off"
          />
          <F.ErrorInput id="error-name" hasError={errors.name}>
            {' '}
            {errors.name?.message}{' '}
          </F.ErrorInput>
        </F.Fieldset>
        <F.Fieldset>
          <F.Label
            tooltipMessages={['Cannot be modified after creation']}
            tooltipWidth="13rem"
          >
            Select Storage Location
          </F.Label>
          <Controller
            control={control}
            id="locationConstraint"
            name="locationConstraint"
            defaultValue={{ value: 'us-east-1' }}
            render={({ onChange, value: locationConstraintObj }) => {
              return (
                <F.Select
                  onChange={onChange}
                  placeholder="Location Name"
                  value={locationConstraintObj.value}
                >
                  {selectLocations.map((opt, i) => (
                    <F.Select.Option key={i} value={opt.value}>
                      {renderLocation(opt)}
                    </F.Select.Option>
                  ))}
                </F.Select>
              );
            }}
          />
        </F.Fieldset>
        <F.Fieldset direction={'row'}>
          <F.Label style={{ width: '25%' }}>Versioning</F.Label>
          <Controller
            control={control}
            id="isVersioning"
            name="isVersioning"
            defaultValue={false}
            render={({ onChange, value: isVersioning }) => {
              return (
                <Toggle
                  disabled={isObjectLockEnabled}
                  onChange={e => onChange(e.target.checked)}
                  placeholder="Versioning"
                  label={isVersioning ? 'Active' : 'Inactive'}
                  toggle={isVersioning}
                />
              );
            }}
          />
          {isObjectLockEnabled && (
            <SpacedBox ml={16}>
              Automatically activated when Object-lock is Active
            </SpacedBox>
          )}
        </F.Fieldset>
        <F.SessionSeperation />
        <F.SubTitle>Object-lock option</F.SubTitle>
        <F.Fieldset direction={'row'}>
          <F.Label style={{ width: '25%' }}>Object-lock</F.Label>
          <Controller
            control={control}
            id="isObjectLockEnabled"
            name="isObjectLockEnabled"
            defaultValue={false}
            render={({ onChange, value: isObjectLockEnabled }) => {
              return (
                <Toggle
                  onChange={e => {
                    onChange(e.target.checked);
                    if (e.target.checked) {
                      setValue('isVersioning', true, { shouldDirty: false });
                    } else if (
                      !Object.keys(dirtyFields).includes('isVersioning') &&
                      !e.target.checked
                    ) {
                      setValue('isVersioning', false, { shouldDirty: false });
                    }
                  }}
                  placeholder="isObjectLockEnabled"
                  label={isObjectLockEnabled ? 'Active' : 'Inactive'}
                  toggle={isObjectLockEnabled}
                />
              );
            }}
          />
        </F.Fieldset>
        <SpacedBox md={2}>
          <SmallerText>
            Permanently allows objects in this bucket to be locked.
            <br />
            Object-lock option cannot be removed after bucket creation, but
            you'll be able to disable the retention itself on edition.
            <br />
            Once the bucket is created, you might be blocked from deleting the
            objects and the bucket.
            <br />
            Enabling Object-lock automatically activates Versioning for the
            bucket, and you won’t be able to suspend Versioning.
          </SmallerText>
        </SpacedBox>
        {isObjectLockEnabled ? (
          <>
            <F.Fieldset direction={'row'}>
              <F.Label style={{ width: '25%' }}>Default Retention</F.Label>
              <Controller
                control={control}
                id="isDefaultRetentionEnabled"
                name="isDefaultRetentionEnabled"
                defaultValue={false}
                render={({ onChange, value: isDefaultRetentionEnabled }) => {
                  return (
                    <Toggle
                      onChange={e => onChange(e.target.checked)}
                      placeholder="isDefaultRetentionEnabled"
                      label={isDefaultRetentionEnabled ? 'Active' : 'Inactive'}
                      toggle={isDefaultRetentionEnabled}
                    />
                  );
                }}
              />
            </F.Fieldset>
            <SpacedBox md={2}>
              <SmallerText>
                Automatically protect objects put into this bucket from being
                deleted or overwritten.
                <br />
                These settings apply only to new objects placed into the bucket
                without any specific specific object-lock parameters.
                <br />
                You can activate this option after the bucket creation.
              </SmallerText>
            </SpacedBox>
            <SpacedBox mt={2}>
              <Banner
                variant="infoPrimary"
                icon={<i className="fas fa-exclamation-circle" />}
              >
                {
                  'If objects are uploaded into the bucket with their own Retention settings, these will override the Default Retention setting placed on the bucket'
                }
              </Banner>
            </SpacedBox>
            {isObjectLockEnabled ? (
              <>
                <F.Fieldset>
                  <F.Label>Retention mode</F.Label>
                  <F.Fieldset direction="row">
                    <F.Label for="GOVERNANCE">
                      <F.Input
                        type="radio"
                        id="GOVERNANCE"
                        value="GOVERNANCE"
                        name="retentionMode"
                        ref={register}
                        disabled={!isDefaultRetentionEnabled}
                      />
                      <SpacedBox ml={8}>Governance</SpacedBox>
                    </F.Label>
                  </F.Fieldset>
                  <SmallerText>
                    An user with a specific IAM permissions can overwrite/delete
                    protected object versions during the retention period.
                  </SmallerText>
                  <F.Fieldset direction="row" alignItems={'center'}>
                    <F.Label for="COMPLIANCE">
                      <F.Input
                        type="radio"
                        id="COMPLIANCE"
                        value="COMPLIANCE"
                        name="retentionMode"
                        ref={register}
                        disabled={!isDefaultRetentionEnabled}
                      />
                      <SpacedBox ml={8}>Compliance</SpacedBox>
                    </F.Label>
                  </F.Fieldset>
                  <SmallerText>
                    No one can overwrite protected object versions during the
                    retention period.
                  </SmallerText>
                </F.Fieldset>
                <F.Fieldset direction="row" alignItems="baseline">
                  <F.Label style={{ width: '25%' }}>Retention period</F.Label>

                  <div>
                    <Controller
                      control={control}
                      id="retentionPeriod"
                      name="retentionPeriod"
                      render={({ onChange, value: retentionPeriod }) => {
                        return (
                          <Input
                            name="retentionPeriod"
                            value={retentionPeriod}
                            onChange={e => onChange(e.target.value)}
                            type="number"
                            style={{ width: spacing.sp40 }}
                            min={1}
                            disabled={!isDefaultRetentionEnabled}
                          />
                        );
                      }}
                    />
                  </div>

                  <SpacedBox style={{ width: '25%' }} ml={8}>
                    <Controller
                      control={control}
                      id="retentionPeriodFrequencyChoice"
                      name="retentionPeriodFrequencyChoice"
                      defaultValue={'YEARS'}
                      render={({
                        onChange,
                        value: retentionPeriodFrequencyChoice,
                      }) => {
                        return (
                          <>
                            <F.Select
                              onChange={onChange}
                              placeholder="retentionPeriodFrequencyChoice"
                              value={retentionPeriodFrequencyChoice}
                              disabled={!isDefaultRetentionEnabled}
                            >
                              <F.Select.Option value={'YEARS'}>
                                Years
                              </F.Select.Option>
                              <F.Select.Option value={'DAYS'}>
                                Days
                              </F.Select.Option>
                            </F.Select>
                          </>
                        );
                      }}
                    />
                  </SpacedBox>

                  <F.ErrorInput
                    id="error-retentionPeriod"
                    hasError={errors.retentionPeriod}
                  >
                    {' '}
                    {errors.retentionPeriod?.message}{' '}
                  </F.ErrorInput>
                </F.Fieldset>
              </>
            ) : null}
          </>
        ) : null}

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
              disabled={loading}
              id="create-account-btn"
              type="submit"
              variant="primary"
              label="Create"
            />
          </F.FooterButtons>
        </F.Footer>
      </F.Form>
    </FormContainer>
  );
}

export default BucketCreate;
