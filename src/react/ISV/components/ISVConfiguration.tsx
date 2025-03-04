import { useMemo, useState } from 'react';
import { useListAccounts } from '../../next-architecture/domain/business/accounts';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import {
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
  Text,
  Toggle,
} from '@scality/core-ui';
import { Accordion, Button, Select } from '@scality/core-ui/dist/next';
import { FormProvider, useForm, Controller } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { ISVConfig } from '../types';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { ISVStepsIndexes, useISVStepper } from './ISVSteps';
import { ISVSkipModal } from './ISVSkipModal';
import BucketField from './BucketField';
import { useIAMUser } from '../hooks/useIAMUser';
import { useAccessibleAccountsAdapter } from '../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { NoOpMetricsAdapter } from '../../ui-elements/SelectAccountIAMRole';
import {
  VEEAM_BACKUP_REPLICATION_XML_VALUE,
  VEEAM_OFFICE_365,
  VEEAM_OFFICE_365_V8,
} from '../constants';
import { getCapacityBytes } from '../hooks/useCapacityUnit';
import { Account } from '../../next-architecture/domain/entities/account';
import { NameField } from './NameField';
const FORM_FIELDS = {
  ACCOUNT_NAME: 'accountName',
  ACCOUNT_NAME_TYPE: 'accountNameType',
  IAM_USER_NAME: 'IAMUserName',
  IAM_USER_NAME_TYPE: 'IAMUserNameType',
  APPLICATION: 'application',
  BUCKET_NAME: 'bucketName',
  ENABLE_IMMUTABLE_BACKUP: 'enableImmutableBackup',
  GENERATE_KEY: 'generateKey',
} as const;

const isImmutableBackupEnabled = (application: string) =>
  application === undefined || application === VEEAM_OFFICE_365_V8;

const getApplication = (id: string) => {
  switch (id) {
    case 'veeam':
      return VEEAM_BACKUP_REPLICATION_XML_VALUE;
    case 'veeam-vbo':
      return VEEAM_OFFICE_365;
    case 'commvault':
      return 'COMMVAULT';
    default:
      return '';
  }
};

export const ISVConfiguration = () => {
  const { platform } = useISVStepper();
  const { next } = useStepper(ISVStepsIndexes.Configuration);
  const [account, setAccount] = useState<Account | null>(null);
  const _application = getApplication(platform.id);

  if (!platform.id) {
    return null;
  }

  const formMethods = useForm<ISVConfig>({
    mode: 'all',
    defaultValues: {
      accountName: '',
      enableImmutableBackup: true,
      buckets: [],
      application: _application,
      accountNameType: 'create',
    },
    resolver: joiResolver(platform.validator),
    shouldUnregister: true,
  });

  const {
    handleSubmit,
    control,
    formState: { isValid },
    watch,
  } = formMethods;
  const navigate = useBasenameRelativeNavigate();
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = new NoOpMetricsAdapter();
  const { accounts } = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });

  const accountName = watch(FORM_FIELDS.ACCOUNT_NAME);
  const accountNameType = watch(FORM_FIELDS.ACCOUNT_NAME_TYPE);
  const IAMUserName = watch(FORM_FIELDS.IAM_USER_NAME);
  const IAMUserNameType = watch(FORM_FIELDS.IAM_USER_NAME_TYPE);
  const application = watch(FORM_FIELDS.APPLICATION);

  const _accounts = useMemo(() => {
    if (accounts.status === 'success') {
      return accounts.value.filter(
        (account) => account.name !== 'scality-internal-services',
      );
    }
    return [];
  }, [accounts]);

  const isAccountExist = useMemo(() => {
    return _accounts.some((account) => account.name === accountName);
  }, [_accounts, accountName]);

  const { isIAMUserExist, IAMUsers, getIAMUsersMutation, accessKeys } =
    useIAMUser({
      IAMUserName,
      IAMUserNameType,
      onIAMUsersLoaded: (users) => {
        if (users.length > 0) {
          formMethods.setValue(FORM_FIELDS.IAM_USER_NAME_TYPE, 'existing');
          formMethods.setValue(FORM_FIELDS.IAM_USER_NAME, users[0].name);
        }
      },
      onShouldGenerateKey: (shouldGenerateKey) => {
        formMethods.setValue(FORM_FIELDS.GENERATE_KEY, shouldGenerateKey);
      },
    });

  const onSubmit = async (data: ISVConfig) => {
    next({
      ...data,
      platform,
      application: _application,
      buckets: data.buckets.map((bucket) => ({
        ...bucket,
        capacityBytes: getCapacityBytes(bucket.capacity, bucket.capacityUnit),
      })),
      enableImmutableBackup: isImmutableBackupEnabled(data.application)
        ? data.enableImmutableBackup
        : false,
      account,
      accessKeys,
    });
  };

  const [
    skipConfirmationModalIsDisplayed,
    setSkipConfirmationModalIsDisplayed,
  ] = useState<boolean>(false);

  const renderVeeamApplication = () => (
    <FormGroup
      id={FORM_FIELDS.APPLICATION}
      label={
        platform.fieldOverrides.find(
          (field) => field.name === FORM_FIELDS.APPLICATION,
        )?.label
      }
      labelHelpTooltip={
        platform.fieldOverrides.find(
          (field) => field.name === FORM_FIELDS.APPLICATION,
        )?.tooltip
      }
      helpErrorPosition="bottom"
      content={
        <Controller
          name={FORM_FIELDS.APPLICATION}
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              id={FORM_FIELDS.APPLICATION}
              onChange={onChange}
              value={value}
            >
              {[
                {
                  key: VEEAM_OFFICE_365,
                  value: VEEAM_OFFICE_365,
                  label: VEEAM_OFFICE_365,
                },
                {
                  key: VEEAM_OFFICE_365_V8,
                  value: VEEAM_OFFICE_365_V8,
                  label: VEEAM_OFFICE_365_V8,
                },
              ].map(({ key, value, label }) => (
                <Select.Option key={key} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          )}
        />
      }
    />
  );

  return (
    <FormProvider {...formMethods}>
      <ISVSkipModal
        isOpen={skipConfirmationModalIsDisplayed}
        close={() => setSkipConfirmationModalIsDisplayed(false)}
        exitAction={() => navigate('/accounts')}
        title={`Exit ${platform.name} assistant?`}
        modalContent={platform.skipModalContent}
      />
      <Form
        onSubmit={handleSubmit(onSubmit)}
        requireMode="partial"
        layout={{
          title: 'Configure ARTESCA for your Use case',
          kind: 'page',
        }}
        rightActions={
          <Stack gap="r16">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSkipConfirmationModalIsDisplayed(true);
              }}
              label="Skip Use case configuration"
            />
            <Button
              type="submit"
              variant="primary"
              label="Continue"
              disabled={!isValid}
              icon={<Icon name="Arrow-right" />}
            />
          </Stack>
        }
      >
        <FormSection forceLabelWidth={280}>
          <Stack style={{ paddingBottom: '1rem' }}>
            <Text variant="Large">{platform.description}</Text> {platform.logo}
          </Stack>

          <NameField
            isExist={isAccountExist}
            status={accounts.status}
            options={_accounts}
            platform={platform.id}
            type={accountNameType}
            fieldName={FORM_FIELDS.ACCOUNT_NAME}
            label="Account"
            tooltip={
              platform.fieldOverrides.find(
                (field) => field.name === FORM_FIELDS.ACCOUNT_NAME,
              )?.tooltip
            }
            onFieldNameChange={{ getIAMUsersMutation, setAccount }}
          />

          {accountNameType === 'existing' && accountName && (
            <Accordion title="Advanced settings" id="advanced-settings">
              <NameField
                isExist={isIAMUserExist}
                status={getIAMUsersMutation.status}
                options={IAMUsers}
                type={IAMUserNameType}
                platform={platform.id}
                tooltip={
                  platform.fieldOverrides.find(
                    (field) => field.name === FORM_FIELDS.IAM_USER_NAME,
                  )?.tooltip
                }
                fieldName={FORM_FIELDS.IAM_USER_NAME}
                label="IAM User Management"
              />
            </Accordion>
          )}

          {platform.id === 'veeam-vbo' && renderVeeamApplication()}

          <BucketField
            platform={platform.id}
            bucketNameTooltip={
              platform.fieldOverrides.find(
                (field) => field.name === FORM_FIELDS.BUCKET_NAME,
              )?.tooltip
            }
          />

          {isImmutableBackupEnabled(application) && (
            <FormGroup
              id={FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP}
              label={
                platform.fieldOverrides.find(
                  (field) => field.name === FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP,
                )?.label
              }
              help="It enables object-lock on the bucket which means backups will be permanent and unchangeable."
              helpErrorPosition="bottom"
              labelHelpTooltip={
                platform.fieldOverrides.find(
                  (field) => field.name === FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP,
                )?.tooltip
              }
              content={
                <Controller
                  name={FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP}
                  control={control}
                  render={({ field: { value, onChange } }) => {
                    return (
                      <Toggle
                        id={FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP}
                        aria-label={FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP}
                        name={FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP}
                        toggle={value}
                        label={value ? 'Enabled' : 'Disabled'}
                        onChange={onChange}
                      />
                    );
                  }}
                />
              }
            />
          )}
        </FormSection>
      </Form>
    </FormProvider>
  );
};
