import { useMemo, useRef, useState } from 'react';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
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
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import { FormProvider, useForm, Controller } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { ISVConfig } from '../types';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { ISVStepsIndexes, useISVStepper } from './ISVSteps';
import {
  VeeamCapacityFormWithXcore,
  VeeamCapacityFormSection,
} from '../../ui-elements/Veeam/VeeamCapacityFormSection';

import {
  VEEAM_BACKUP_REPLICATION_XML_VALUE,
  VEEAM_BACKUP_REPLICATION,
  VEEAM_OFFICE_365,
  VEEAM_OFFICE_365_V8,
} from '../../ui-elements/Veeam/VeeamConstants';
import {
  useXCoreLibrary,
  XCORE_NOT_AVAILABLE,
} from '../../next-architecture/ui/XCoreLibraryProvider';
import { getCapacityBytes } from '../../ui-elements/Veeam/useCapacityUnit';
import { ISVSkipModal } from './ISVSkipModal';
import { RadioGroup } from './RadioGroup';

const FORM_FIELDS = {
  ACCOUNT_NAME: 'accountName',
  ACCOUNT_NAME_TYPE: 'accountNameType',
  APPLICATION: 'application',
  BUCKET_NAME: 'bucketName',
  ENABLE_IMMUTABLE_BACKUP: 'enableImmutableBackup',
} as const;

const isImmutableBackupEnabled = (application: string) =>
  application === VEEAM_BACKUP_REPLICATION_XML_VALUE ||
  application === VEEAM_OFFICE_365_V8 ||
  application === 'COMMVAULT';

const accountTypeOptions = [
  {
    value: 'create',
    label: 'Create a new account',
  },
  {
    value: 'existing',
    label: 'Use an existing Account',
  },
];

const AccountNameField = ({
  register,
  control,
  errors,
  isAccountExist,
  status,
  accounts,
  platform,
  accountNameType,
}) => (
  <FormGroup
    id={FORM_FIELDS.ACCOUNT_NAME}
    label="Account"
    required
    labelHelpTooltip={
      platform.fieldOverrides.find(
        (field) => field.name === FORM_FIELDS.ACCOUNT_NAME,
      ).tooltip
    }
    helpErrorPosition="bottom"
    error={
      isAccountExist && accountNameType === 'create'
        ? 'Account name already exists'
        : errors.accountName?.message ?? ''
    }
    content={
      <>
        <Controller
          name={FORM_FIELDS.ACCOUNT_NAME_TYPE}
          control={control}
          defaultValue={accountNameType}
          render={({ field: { onChange, value } }) => (
            <RadioGroup
              options={accountTypeOptions}
              value={value}
              onChange={onChange}
              direction="vertical"
            />
          )}
        />

        {accountNameType === 'create' ? (
          <Input
            id={FORM_FIELDS.ACCOUNT_NAME}
            type="text"
            autoComplete="off"
            placeholder={
              status === 'success' && accounts.length !== 0
                ? `${platform.id}-backup`
                : undefined
            }
            {...register(FORM_FIELDS.ACCOUNT_NAME)}
          />
        ) : (
          <Controller
            name={FORM_FIELDS.ACCOUNT_NAME}
            control={control}
            render={({ field: { onChange, value } }) => (
              <Select
                id={FORM_FIELDS.ACCOUNT_NAME}
                onChange={onChange}
                value={value}
                placeholder="Select existing account"
              >
                {accounts.map((account) => (
                  <Select.Option key={account.name} value={account.name}>
                    {account.name}
                  </Select.Option>
                ))}
              </Select>
            )}
          />
        )}
      </>
    }
  />
);

export const ISVConfiguration = () => {
  const { platform, config, setConfig } = useISVStepper();
  const { next } = useStepper(ISVStepsIndexes.Configuration);

  if (!platform.id) {
    return null;
  }

  const methods = useForm<ISVConfig>({
    mode: 'all',
    defaultValues: {
      ...config,
      accountNameType: 'create',
    },
    resolver: joiResolver(platform.validator),
  });

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    register,
  } = methods;

  const navigate = useBasenameRelativeNavigate();
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints, status } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter,
    });

  const accounts =
    accountsLocationsAndEndpoints?.accounts.filter(
      (account) => account.name !== 'scality-internal-services',
    ) ?? [];

  const accountName = watch('accountName');
  const accountNameType = watch('accountNameType');
  const application = watch('application');
  const isAccountExist = useMemo(() => {
    const exists =
      status === 'success' &&
      accounts.some((account) => account.name === accountName);
    return exists;
  }, [accountName, status, accounts]);

  const onSubmit = (data: ISVConfig) => {
    console.log('Form submitted with data:', data);
    setConfig(data);
    next({
      ...data,
      capacityBytes: getCapacityBytes(
        data.buckets[0].capacity,
        data.buckets[0].capacityUnit,
      ),
      enableImmutableBackup:
        application === VEEAM_BACKUP_REPLICATION_XML_VALUE ||
        application === VEEAM_OFFICE_365_V8
          ? data.enableImmutableBackup
          : false,
    });
  };

  const formRef = useRef(null);
  const xCoreLibrary = useXCoreLibrary();
  const { useClusterCapacity } =
    xCoreLibrary === XCORE_NOT_AVAILABLE ? () => ({}) : xCoreLibrary;
  const [skip, setSkip] = useState<boolean>(false);

  const renderVeeamApplication = () => (
    <FormGroup
      id={FORM_FIELDS.APPLICATION}
      label={
        platform.fieldOverrides.find(
          (field) => field.name === FORM_FIELDS.APPLICATION,
        ).label
      }
      labelHelpTooltip={
        platform.fieldOverrides.find(
          (field) => field.name === FORM_FIELDS.APPLICATION,
        ).tooltip
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
                  key: VEEAM_BACKUP_REPLICATION_XML_VALUE,
                  value: VEEAM_BACKUP_REPLICATION_XML_VALUE,
                  label: VEEAM_BACKUP_REPLICATION,
                },
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

  const renderCapacitySection = () => {
    if (application !== VEEAM_BACKUP_REPLICATION_XML_VALUE) {
      return null;
    }

    return useClusterCapacity ? (
      <VeeamCapacityFormWithXcore useClusterCapacity={useClusterCapacity} />
    ) : (
      <VeeamCapacityFormSection />
    );
  };

  return (
    <FormProvider {...methods}>
      <ISVSkipModal
        isOpen={skip}
        close={() => setSkip(false)}
        exitAction={() => navigate('/accounts')}
        title={`Exit ${platform.name} assistant?`}
        modalContent={platform.skipModalContent}
      />
      <Form
        onSubmit={handleSubmit(onSubmit)}
        ref={formRef}
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
                setSkip(true);
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
        <FormSection forceLabelWidth={300}>
          <Stack style={{ paddingBottom: '1rem' }}>
            <Text variant="Large">{platform.description}</Text> {platform.logo}
          </Stack>

          <AccountNameField
            register={register}
            control={control}
            errors={errors}
            isAccountExist={isAccountExist}
            status={status}
            accounts={accounts}
            platform={platform}
            accountNameType={accountNameType}
          />

          {platform.id === 'veeam' && renderVeeamApplication()}

          {/* <FormGroup
            id={FORM_FIELDS.BUCKET_NAME}
            label="Bucket name"
            required
            labelHelpTooltip={
              platform.fieldOverrides.find(
                (field) => field.name === FORM_FIELDS.BUCKET_NAME,
              ).tooltip
            }
            error={errors[FORM_FIELDS.BUCKET_NAME]?.message ?? ''}
            helpErrorPosition="bottom"
            content={
              <Input
                id={FORM_FIELDS.BUCKET_NAME}
                type="text"
                autoComplete="off"
                placeholder={`${platform.id}-bucket-name`}
                {...register(FORM_FIELDS.BUCKET_NAME)}
              />
            }
          /> */}

          {isImmutableBackupEnabled(application) && (
            <FormGroup
              id={FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP}
              label="Immutable backup"
              help="It enables object-lock on the bucket which means backups will be permanent and unchangeable."
              helpErrorPosition="bottom"
              labelHelpTooltip={
                platform.fieldOverrides.find(
                  (field) => field.name === FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP,
                ).tooltip
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

          {renderCapacitySection()}
        </FormSection>
      </Form>
    </FormProvider>
  );
};
