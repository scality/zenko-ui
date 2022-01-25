//@flow
import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm, Controller } from 'react-hook-form';
import { push } from 'connected-react-router';
import { DateTime } from 'luxon';
import * as JoiImport from '@hapi/joi';
import DateExtension from '@hapi/joi-date';
import { joiResolver } from '@hookform/resolvers';
import { Button } from '@scality/core-ui/dist/next';
import { Banner, Toggle } from '@scality/core-ui';
import { SmallerText } from '@scality/core-ui/dist/components/text/Text.component';
import SpacedBox from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import FormContainer, * as F from '../../ui-elements/FormLayout';
import {
  clearError,
  getObjectMetadata,
  putObjectRetention,
} from '../../actions';
import { useQuery } from '../../utils/hooks';
import {
  getDefaultMinRetainUntilDate,
  getDefaultRetention,
  getRetainUntilDateHint,
} from './utils';
import type { AppState } from '../../../types/state';

const Joi = JoiImport.extend(DateExtension);

const objectLockRetentionSettingsValidationRules = {
  isRetentionEnabled: Joi.boolean().default(false),
  retentionMode: Joi.when('isRetentionEnabled', {
    is: Joi.equal(true),
    then: Joi.string().required(),
    otherwise: Joi.valid(),
  }),
  retentionUntilDate: Joi.date()
    .format('YYYY-MM-DD')
    .raw(),
};

const schema = Joi.object(objectLockRetentionSettingsValidationRules);

// Since IAM role permission hasn't been implemented, we only provide the minimum ability to edit the retention from the UI
// and limit the following actions:
// 1. When the retention is disabled by default, it's not allowed to enable it.
// 2. The default retention mode is COMPLIANCE, it's not allowed to switch to the GOVERNANCE mode.
export default function ObjectLockSetting() {
  const dispatch = useDispatch();
  const query = useQuery();
  const hasError = useSelector(
    (state: AppState) =>
      !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
  );
  const errorMessage = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );
  const objectMetadata = useSelector(
    (state: AppState) => state.s3.objectMetadata,
  );
  const { bucketName: bucketNameParam } = useParams();
  const objectKey = query.get('prefix');
  const versionId = query.get('versionId');
  const {
    isDefaultRetentionEnabled,
    defaultRetentionMode,
    defaultRetentionUntilDate,
  } = getDefaultRetention(objectMetadata);

  useEffect(() => {
    dispatch(getObjectMetadata(bucketNameParam, objectKey, versionId));
  }, [dispatch, bucketNameParam, objectKey, versionId]);
  const minRetainUtilDate = getDefaultMinRetainUntilDate(
    defaultRetentionUntilDate,
    defaultRetentionMode,
  );
  const useFormMethods = useForm({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: {
      isRetentionEnabled: isDefaultRetentionEnabled,
      retentionMode: defaultRetentionMode,
      retentionUntilDate: minRetainUtilDate,
    },
  });

  const clearServerError = () => {
    if (hasError) {
      dispatch(clearError());
    }
  };
  const handleCancel = () => {
    clearServerError();
    dispatch(
      push(
        `/buckets/${bucketNameParam}/objects?prefix=${objectKey}&versionId=${versionId}`,
      ),
    );
  };

  const {
    handleSubmit,
    formState: { isValid },
    setValue,
    watch,
    errors,
    register,
    control,
  } = useFormMethods;
  const isRetentionEnabled = watch('isRetentionEnabled');

  const onSubmit = ({ retentionMode, retentionUntilDate }) => {
    clearServerError();
    dispatch(
      putObjectRetention(
        bucketNameParam,
        objectKey,
        versionId,
        retentionMode,
        DateTime.fromISO(retentionUntilDate).toSeconds(),
      ),
    );
  };

  useEffect(() => {
    setValue('isRetentionEnabled', isDefaultRetentionEnabled);
    setValue('retentionMode', defaultRetentionMode);
    setValue('retentionUntilDate', defaultRetentionUntilDate);
  }, [
    setValue,
    isDefaultRetentionEnabled,
    defaultRetentionMode,
    defaultRetentionUntilDate,
  ]);

  return (
    <FormProvider {...useFormMethods}>
      <FormContainer>
        <F.Form onSubmit={handleSubmit(onSubmit)}>
          <F.Title> Object-lock settings </F.Title>
          <>
            <div
              style={{
                opacity: isDefaultRetentionEnabled ? 0.5 : 1,
              }}
            >
              <F.Fieldset direction={'row'}>
                <F.Label>Retention</F.Label>
                <Controller
                  control={control}
                  id="isRetentionEnabled"
                  name="isRetentionEnabled"
                  render={({ onChange, value: isRetentionEnabled }) => {
                    return (
                      <Toggle
                        id="edit-retention"
                        disabled={isDefaultRetentionEnabled}
                        onChange={e => onChange(e.target.checked)}
                        placeholder="isRetentionEnabled"
                        label={isRetentionEnabled ? 'Active' : 'Inactive'}
                        toggle={isRetentionEnabled}
                      />
                    );
                  }}
                />
              </F.Fieldset>
            </div>
            <div
              style={{
                opacity:
                  (isDefaultRetentionEnabled || isRetentionEnabled) &&
                  defaultRetentionMode !== 'COMPLIANCE'
                    ? 1
                    : 0.5,
              }}
            >
              <F.Fieldset>
                <F.Label>Retention mode</F.Label>
                <F.Fieldset direction="row">
                  <F.Label for="GOVERNANCE" style={{ alignItems: 'baseline' }}>
                    <F.Input
                      type="radio"
                      id="GOVERNANCE"
                      value="GOVERNANCE"
                      name="retentionMode"
                      ref={register}
                      disabled={defaultRetentionMode === 'COMPLIANCE'}
                    />
                    <SpacedBox ml={8}>Governance</SpacedBox>
                  </F.Label>
                </F.Fieldset>
                <SmallerText>
                  An user with a specific IAM permissions can overwrite/delete
                  protected object versions during the retention period.
                </SmallerText>
                <F.Fieldset direction="row">
                  <F.Label for="COMPLIANCE" style={{ alignItems: 'baseline' }}>
                    <F.Input
                      type="radio"
                      id="COMPLIANCE"
                      value="COMPLIANCE"
                      name="retentionMode"
                      ref={register}
                      disabled={!isRetentionEnabled}
                    />
                    <SpacedBox ml={8}>Compliance</SpacedBox>
                  </F.Label>
                </F.Fieldset>
                <SmallerText>
                  No one can overwrite protected object versions during the
                  retention period.
                </SmallerText>
              </F.Fieldset>
            </div>
            <div
              style={{
                opacity: isRetentionEnabled ? 1 : 0.5,
              }}
            >
              <F.Fieldset alignItems="baseline">
                <F.Label
                  tooltipMessages={[
                    'After the retain until date, objects are no longer protected by the chosen retention mode.',
                  ]}
                  tooltipWidth="28rem"
                >
                  Retention until date
                </F.Label>

                <SpacedBox mt={8}>
                  <Controller
                    control={control}
                    id="retentionUntilDate"
                    name="retentionUntilDate"
                    render={({ onChange, value: retentionUntilDate }) => {
                      return (
                        <>
                          <input
                            type="date"
                            name="retention-until-date"
                            disabled={!isRetentionEnabled}
                            onChange={e => onChange(e.target.value)}
                            value={retentionUntilDate}
                            min={minRetainUtilDate}
                          />
                          {retentionUntilDate >= minRetainUtilDate && (
                            <span style={{ paddingLeft: '1rem' }}>
                              {getRetainUntilDateHint(retentionUntilDate)}
                            </span>
                          )}
                        </>
                      );
                    }}
                  />
                </SpacedBox>

                <F.ErrorInput
                  id="error-retentionUntilDate"
                  hasError={errors.retentionUntilDate}
                >
                  {' '}
                  {errors.retentionUntilDate?.message}{' '}
                </F.ErrorInput>
              </F.Fieldset>
            </div>
          </>
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
                id="cancel-btn"
                variant="outline"
                onClick={handleCancel}
                type="button"
                label="Cancel"
              />
              <Button
                disabled={!isValid}
                id="edit-retention-setting-btn"
                type="submit"
                variant="primary"
                label="Save"
                icon={<i className="fas fa-save"></i>}
              />
            </F.FooterButtons>
          </F.Footer>
        </F.Form>
      </FormContainer>
    </FormProvider>
  );
}
