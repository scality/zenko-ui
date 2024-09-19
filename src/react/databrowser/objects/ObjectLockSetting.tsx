import { ChangeEvent, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FormProvider, useForm, Controller } from 'react-hook-form';
import { DateTime } from 'luxon';
import * as JoiImport from '@hapi/joi';
import DateExtension from '@hapi/joi-date';
import { joiResolver } from '@hookform/resolvers/joi';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
  Toggle,
} from '@scality/core-ui';
import { Text } from '@scality/core-ui/dist/components/text/Text.component';
import {
  clearError,
  getObjectMetadata,
  putObjectRetention,
} from '../../actions';
import { useQueryParams } from '../../utils/hooks';
import {
  getDefaultMinRetainUntilDate,
  getDefaultRetention,
  getRetainUntilDateHint,
} from './utils';
import type { AppState } from '../../../types/state';
import { useCurrentAccount } from '../../DataServiceRoleProvider';

const Joi = JoiImport.extend(DateExtension);
const objectLockRetentionSettingsValidationRules = {
  isRetentionEnabled: Joi.boolean().default(false),
  retentionMode: Joi.when('isRetentionEnabled', {
    is: Joi.equal(true),
    then: Joi.string().required(),
    otherwise: Joi.valid(),
  }),
  retentionUntilDate: Joi.date().format('YYYY-MM-DD').raw(),
};
const schema = Joi.object(objectLockRetentionSettingsValidationRules);

/* Since IAM role permission hasn't been implemented, we only provide the minimum ability to edit the retention from the UI
 and limit the following actions:
 1. Not allowed to disable the retention.
 2. The default retention mode is COMPLIANCE, it's not allowed to switch to the GOVERNANCE mode. */

export default function ObjectLockSetting() {
  const dispatch = useDispatch();
  const history = useHistory();
  const query = useQueryParams();
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
  const { bucketName: bucketNameParam } = useParams<{ bucketName: string }>();
  const { account } = useCurrentAccount();
  const objectKey = query.get('prefix') || '';
  const versionId = query.get('versionId') || '';
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
    history.push(
      `/accounts/${account?.Name}/buckets/${bucketNameParam}/objects?prefix=${objectKey}&versionId=${versionId}`,
    );
  };

  const {
    handleSubmit,
    formState: { isValid, errors },
    setValue,
    watch,
    register,
    control,
  } = useFormMethods;
  const isRetentionEnabled = watch('isRetentionEnabled');
  const retentionUntilDate = watch('retentionUntilDate');
  const onSubmit = ({
    retentionMode,
    retentionUntilDate,
  }: {
    retentionMode: string;
    retentionUntilDate: string;
  }) => {
    clearServerError();
    dispatch(
      putObjectRetention(
        bucketNameParam,
        objectKey,
        versionId,
        //@ts-expect-error fix this when you are working on it
        retentionMode,
        DateTime.fromISO(retentionUntilDate).toSeconds(),
        account?.Name,
        history,
      ),
    );
  };

  useEffect(() => {
    setValue('isRetentionEnabled', isDefaultRetentionEnabled);
    setValue('retentionMode', defaultRetentionMode);
    setValue(
      'retentionUntilDate',
      DateTime.fromJSDate(defaultRetentionUntilDate).toFormat('yyyy-LL-dd'),
    );
  }, [
    setValue,
    isDefaultRetentionEnabled,
    defaultRetentionMode,
    defaultRetentionUntilDate,
  ]);
  return (
    <FormProvider {...useFormMethods}>
      <Form
        onSubmit={handleSubmit(onSubmit)}
        layout={{ kind: 'page', title: 'Object-lock settings' }}
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
              disabled={!isValid}
              id="edit-retention-setting-btn"
              type="submit"
              variant="primary"
              label="Save"
              icon={<Icon name="Save" />}
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
        <FormSection>
          <FormGroup
            id="isRetentionEnabled"
            label="Retention"
            disabled={isDefaultRetentionEnabled}
            content={
              <Controller
                control={control}
                name="isRetentionEnabled"
                render={({
                  field: { onChange, value: isRetentionEnabled },
                }) => {
                  return (
                    <Toggle
                      id="isRetentionEnabled"
                      disabled={isDefaultRetentionEnabled}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onChange(e.target.checked)
                      }
                      placeholder="isRetentionEnabled"
                      label={isRetentionEnabled ? 'Active' : 'Inactive'}
                      toggle={isRetentionEnabled}
                    />
                  );
                }}
              />
            }
          ></FormGroup>
          <FormGroup
            id="objectlockMode"
            label="Retention mode"
            direction="vertical"
            disabled={!isRetentionEnabled}
            helpErrorPosition="bottom"
            content={
              <div
                style={{
                  opacity:
                    (isDefaultRetentionEnabled || isRetentionEnabled) &&
                    defaultRetentionMode !== 'COMPLIANCE'
                      ? 1
                      : 0.5,
                }}
              >
                <Stack direction="vertical">
                  <Stack direction="vertical">
                    <Stack>
                      <input
                        id="locktype-governance"
                        type="radio"
                        value="GOVERNANCE"
                        disabled={defaultRetentionMode === 'COMPLIANCE'}
                        {...register('retentionMode')}
                      />
                      <label htmlFor="locktype-governance">Governance</label>
                    </Stack>
                    <Text color="textSecondary" isEmphazed variant="Smaller">
                      An user with a specific IAM permissions can
                      overwrite/delete protected object versions during the
                      retention period.
                    </Text>
                  </Stack>
                  <Stack>
                    <input
                      id="locktype-compliance"
                      type="radio"
                      value="COMPLIANCE"
                      disabled={!isRetentionEnabled}
                      {...register('retentionMode')}
                    />
                    <label htmlFor="locktype-compliance">Compliance</label>
                  </Stack>
                  <Text color="textSecondary" isEmphazed variant="Smaller">
                    No one can overwrite protected object versions during the
                    retention period.
                  </Text>
                </Stack>
              </div>
            }
          ></FormGroup>

          <FormGroup
            id="retentionUntilDate"
            label="Retention until date"
            helpErrorPosition="right"
            labelHelpTooltip="After the retain until date, objects are no longer protected by the chosen retention mode."
            error={errors.retentionUntilDate?.message}
            help={
              retentionUntilDate >= minRetainUtilDate
                ? getRetainUntilDateHint(retentionUntilDate)
                : 'Format: DD/MM/YYYY'
            }
            content={
              <Controller
                control={control}
                name="retentionUntilDate"
                render={({
                  field: { onChange, value: retentionUntilDate },
                }) => {
                  return (
                    <input
                      id="retentionUntilDate"
                      type="date"
                      name="retention-until-date"
                      disabled={!isRetentionEnabled}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        onChange(e.target.value);
                      }}
                      value={retentionUntilDate}
                      min={minRetainUtilDate}
                    />
                  );
                }}
              />
            }
          ></FormGroup>
        </FormSection>
      </Form>
    </FormProvider>
  );
}
