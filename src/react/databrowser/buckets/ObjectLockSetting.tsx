import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Button } from '@scality/core-ui/dist/next';
import ObjectLockRetentionSettings, {
  objectLockRetentionSettingsValidationRules,
} from './ObjectLockRetentionSettings';
import { clearError, editDefaultRetention, getBucketInfo } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router';
import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { push } from 'connected-react-router';
import type { AppState } from '../../../types/state';
import { Banner, Icon, Form, Stack } from '@scality/core-ui';
import { convertToBucketInfo } from '../../backend/location/utils';
const schema = Joi.object(objectLockRetentionSettingsValidationRules);
export default function ObjectLockSetting() {
  const bucketInfo = useSelector((state: AppState) => state.s3.bucketInfo);
  const hasError = useSelector(
    (state: AppState) =>
      !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
  );
  const errorMessage = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );
  const {
    objectLockEnabled,
    isDefaultRetentionEnabled,
    retentionMode,
    retentionPeriod,
    retentionPeriodFrequencyChoice,
  } = convertToBucketInfo(bucketInfo);
  const isObjectLockEnabled = objectLockEnabled === 'Enabled';
  const useFormMethods = useForm({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: {
      isDefaultRetentionEnabled: isDefaultRetentionEnabled,
      retentionMode: retentionMode,
      retentionPeriod: retentionPeriod,
      retentionPeriodFrequencyChoice: retentionPeriodFrequencyChoice,
    },
  });

  const clearServerError = () => {
    if (hasError) {
      dispatch(clearError());
    }
  };

  const handleCancel = () => {
    clearServerError();
    dispatch(push('/buckets'));
  };

  const { bucketName } = useParams<{ bucketName: string }>();

  const onSubmit = ({
    isDefaultRetentionEnabled,
    retentionMode,
    retentionPeriod,
    retentionPeriodFrequencyChoice,
  }: {
    isDefaultRetentionEnabled: boolean;
    retentionMode: string;
    retentionPeriod: number;
    retentionPeriodFrequencyChoice: string;
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
    dispatch(
      editDefaultRetention(bucketName, {
        isDefaultRetentionEnabled,
        retentionMode,
        retentionPeriod: retentionPeriodToSubmit,
      }),
    );
  };

  const { handleSubmit, setValue, formState } = useFormMethods;
  const { isValid } = formState;
  const dispatch = useDispatch();

  useEffect(() => {
    if (bucketInfo?.name !== bucketName) dispatch(getBucketInfo(bucketName));
    else {
      setValue('isDefaultRetentionEnabled', isDefaultRetentionEnabled);
      setValue('retentionMode', retentionMode);
      setValue('retentionPeriod', retentionPeriod);
      setValue(
        'retentionPeriodFrequencyChoice',
        retentionPeriodFrequencyChoice,
      );
    }
  }, [dispatch, bucketName, bucketInfo?.name]);

  return (
    <FormProvider {...useFormMethods}>
      <Form
        onSubmit={handleSubmit(onSubmit)}
        requireMode="partial"
        layout={{
          kind: 'page',
          title: 'Object-lock settings',
        }}
        rightActions={
          <Stack gap="r16">
            <Button
              id="cancel-btn"
              variant="outline"
              onClick={handleCancel}
              type="button"
              label="Cancel"
            />
            <Button
              disabled={!isObjectLockEnabled || !isValid}
              id="edit-retention-setting-btn"
              type="submit"
              variant="primary"
              label="Save"
              icon={<i className="fas fa-save"></i>}
            />
          </Stack>
        }
        banner={
          hasError && (
            <Banner
              icon={<Icon name="Exclamation-triangle" />}
              title="Error"
              variant="danger"
            >
              {errorMessage}
            </Banner>
          )
        }
      >
        <ObjectLockRetentionSettings isEditRetentionSetting />
      </Form>
    </FormProvider>
  );
}
