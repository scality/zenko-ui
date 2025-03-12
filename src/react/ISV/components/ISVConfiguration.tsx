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
import { Accordion, Button } from '@scality/core-ui/dist/next';
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
import { unitChoices } from '../constants';
import { getCapacityBytes } from '../hooks/useCapacityUnit';
import { Account } from '../../next-architecture/domain/entities/account';
import { CreateOrSelectNameField } from './CreateOrSelectNameField';
import { Checkbox } from '../../ui-elements/FormLayout';

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

export const ISVConfiguration = () => {
  const { platform } = useISVStepper();
  const { next } = useStepper(ISVStepsIndexes.Configuration);
  const [account, setAccount] = useState<Account | null>(null);

  const formMethods = useForm<ISVConfig>({
    mode: 'all',
    defaultValues: {
      accountName: '',
      accountNameType: 'create',
      enableImmutableBackup: true,
      buckets: [
        {
          name: '',
          tag: platform.bucketTag,
          capacity: '0',
          capacityUnit: unitChoices.TiB.toString(),
        },
      ],
    },
    resolver: joiResolver(platform.validator),
    shouldUnregister: false,
  });

  const {
    handleSubmit,
    control,
    formState: { isValid },
    watch,
    setValue,
  } = formMethods;
  const formValues = watch();
  const isObjectLockEnabled = platform.isObjectLockEnabled
    ? platform.isObjectLockEnabled(formValues)
    : true;

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

  const {
    isIAMUserExist,
    IAMUsers,
    getIAMUsersMutation,
    accessKeys,
    accessKeysStatus,
  } = useIAMUser({
    IAMUserName,
    onShouldGenerateKey: (shouldGenerateKey) => {
      setValue(FORM_FIELDS.GENERATE_KEY, shouldGenerateKey);
    },
  });

  const onSubmit = async (data: ISVConfig) => {
    next({
      ...data,
      platform,
      buckets: data.buckets.map((bucket) => ({
        ...bucket,
        capacityBytes: getCapacityBytes(bucket.capacity, bucket.capacityUnit),
      })),
      enableImmutableBackup: !!data.enableImmutableBackup,
      account,
      accessKeys,
    });
  };

  const reset = () => {
    setValue(FORM_FIELDS.IAM_USER_NAME, '');
    setValue(FORM_FIELDS.IAM_USER_NAME_TYPE, 'create');
    setAccount(null);
  };

  const [
    skipConfirmationModalIsDisplayed,
    setSkipConfirmationModalIsDisplayed,
  ] = useState<boolean>(false);

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

          <CreateOrSelectNameField
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
            onOptionChange={() => {
              reset();
            }}
            onFieldNameChange={(value) => {
              if (getIAMUsersMutation) {
                const roleArn = _accounts.find(
                  (option) => option.name === value,
                ).preferredAssumableRoleArn;
                getIAMUsersMutation.mutate(roleArn, {
                  onSuccess: (data) => {
                    if (data.Users.length > 0) {
                      setValue(FORM_FIELDS.IAM_USER_NAME_TYPE, 'existing');
                      setValue(
                        FORM_FIELDS.IAM_USER_NAME,
                        data.Users[0].UserName,
                      );
                    } else {
                      setValue(FORM_FIELDS.IAM_USER_NAME_TYPE, 'create');
                      console.log('IAM User not found', accountName, value);
                      setValue(FORM_FIELDS.IAM_USER_NAME, value);
                    }
                  },
                });
              }
              const account = _accounts.find((option) => option.name === value);
              setAccount(account);
            }}
          />

          {accountNameType === 'existing' && accountName && (
            <Accordion title="Advanced settings" id="advanced-settings">
              <CreateOrSelectNameField
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
              >
                {IAMUserNameType === 'existing' && (
                  <Controller
                    name={FORM_FIELDS.GENERATE_KEY}
                    control={control}
                    render={({ field: { onChange, value } }) => {
                      return (
                        <Checkbox
                          id={FORM_FIELDS.GENERATE_KEY}
                          label={`${
                            accessKeysStatus === 'loading'
                              ? 'Loading...'
                              : 'Generate a new set of AK/SK'
                          }`}
                          onChange={onChange}
                          disabled={accessKeysStatus === 'loading'}
                          checked={value}
                        />
                      );
                    }}
                  />
                )}
              </CreateOrSelectNameField>
            </Accordion>
          )}

          {platform.additionalFields && (
            <FormSection forceLabelWidth={280}>
              {platform.additionalFields.map((field, index) => {
                return <div key={index}>{field}</div>;
              })}
            </FormSection>
          )}

          <BucketField
            platform={platform.id}
            bucketNameTooltip={
              platform.fieldOverrides.find(
                (field) => field.name === FORM_FIELDS.BUCKET_NAME,
              )?.tooltip
            }
          />

          {isObjectLockEnabled && (
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
