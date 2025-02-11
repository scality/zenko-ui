import { useMemo, useRef, useState } from 'react';
import { useListAccounts } from '../../next-architecture/domain/business/accounts';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import {
  Checkbox,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
  Text,
  Toggle,
} from '@scality/core-ui';
import { Accordion, Button, Input, Select } from '@scality/core-ui/dist/next';
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
  useXCoreLibrary,
  XCORE_NOT_AVAILABLE,
} from '../../next-architecture/ui/XCoreLibraryProvider';
import { getCapacityBytes } from '../../ui-elements/Veeam/useCapacityUnit';
import { ISVSkipModal } from './ISVSkipModal';
import { RadioGroup } from './RadioGroup';
import BucketField from '../../ui-elements/PartnerApp/BucketField';
import { useIAMUser } from '../hooks/useIAMUser';
import { useAccessibleAccountsAdapter } from '../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { NoOpMetricsAdapter } from '../../ui-elements/SelectAccountIAMRole';
import {
  VEEAM_BACKUP_REPLICATION_XML_VALUE,
  VEEAM_OFFICE_365,
  VEEAM_OFFICE_365_V8,
} from '../constants';

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

const IAMUserTypeOptions = [
  {
    value: 'create',
    label: 'Create a new IAM User',
  },
  {
    value: 'existing',
    label: 'Use an existing IAM User',
  },
];

const NameField = ({
  register,
  control,
  errors,
  isExist,
  status,
  options,
  platform,
  type,
  fieldType,
  getIAMUsersMutation = null,
}) => {
  const isAccount = fieldType === 'account';
  const fieldName = isAccount
    ? FORM_FIELDS.ACCOUNT_NAME
    : FORM_FIELDS.IAM_USER_NAME;
  const typeFieldName = isAccount
    ? FORM_FIELDS.ACCOUNT_NAME_TYPE
    : FORM_FIELDS.IAM_USER_NAME_TYPE;
  const radioOptions = isAccount ? accountTypeOptions : IAMUserTypeOptions;

  return (
    <Stack gap="r8" direction="vertical">
      <FormGroup
        id={fieldName}
        label={isAccount ? 'Account' : 'IAM User Management'}
        required
        labelHelpTooltip={
          platform.fieldOverrides.find(
            (field) => field.name === FORM_FIELDS.ACCOUNT_NAME,
          ).tooltip
        }
        content={
          <Controller
            name={typeFieldName}
            control={control}
            defaultValue={type}
            render={({ field: { onChange, value } }) => (
              <RadioGroup
                options={radioOptions}
                value={value}
                onChange={onChange}
                direction="vertical"
              />
            )}
          />
        }
      />
      {(isAccount || (!isAccount && type === 'existing')) && (
        <FormGroup
          id={fieldName}
          label={isAccount ? 'Account Name' : 'IAM User Name'}
          required
          helpErrorPosition="bottom"
          error={
            isExist && type === 'create'
              ? `${isAccount ? 'Account' : 'IAM User'} name already exists`
              : errors[fieldName]?.message ?? ''
          }
          content={
            <Stack gap="r8" direction="vertical">
              {type === 'create' ? (
                <Input
                  id={fieldName}
                  type="text"
                  autoComplete="off"
                  placeholder={
                    status === 'success' && options.length !== 0
                      ? `${platform.id}-backup`
                      : undefined
                  }
                  {...register(fieldName)}
                />
              ) : (
                <Controller
                  name={fieldName}
                  control={control}
                  defaultValue={options.length > 0 ? options[0].name : ''}
                  render={({ field: { onChange, value } }) => (
                    <Select
                      id={fieldName}
                      onChange={(value) => {
                        if (getIAMUsersMutation) {
                          const roleArn = options.find(
                            (option) => option.name === value,
                          ).preferredAssumableRoleArn;
                          getIAMUsersMutation.mutate(roleArn);
                        }
                        onChange(value);
                      }}
                      value={value}
                      placeholder={`Select existing ${
                        isAccount ? 'account' : 'user'
                      }`}
                    >
                      {options.map((item) => (
                        <Select.Option key={item.name} value={item.name}>
                          {item.name}
                        </Select.Option>
                      ))}
                    </Select>
                  )}
                />
              )}

              {!isAccount && type === 'existing' && (
                <Controller
                  name={FORM_FIELDS.GENERATE_KEY}
                  control={control}
                  render={({ field: { onChange, value } }) => {
                    return (
                      <Checkbox
                        id={FORM_FIELDS.GENERATE_KEY}
                        value={value}
                        label="Generate a new set of AK/SK"
                        onChange={onChange}
                        checked={value}
                      />
                    );
                  }}
                />
              )}
            </Stack>
          }
        />
      )}
    </Stack>
  );
};

export const ISVConfiguration = () => {
  const { platform, config, setConfig } = useISVStepper();
  const { next } = useStepper(ISVStepsIndexes.Configuration);

  if (!platform.id) {
    return null;
  }

  const methods = useForm<ISVConfig>({
    mode: 'all',
    defaultValues: config,
    resolver: joiResolver(platform.validator),
    shouldUnregister: true,
  });

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    register,
  } = methods;
  const navigate = useBasenameRelativeNavigate();
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = new NoOpMetricsAdapter();
  const { accounts } = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });

  const accountName = watch('accountName');
  const accountNameType = watch('accountNameType');
  const IAMUserName = watch('IAMUserName');
  const IAMUserNameType = watch('IAMUserNameType');
  const application = watch('application');

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

  const { isIAMUserExist, IAMUsersStatus, IAMUsers, getIAMUsersMutation } =
    useIAMUser({
      IAMUserName,
      IAMUserNameType,
      onIAMUsersLoaded: (users) => {
        if (users.length > 0) {
          methods.setValue(FORM_FIELDS.IAM_USER_NAME_TYPE, 'existing');
          methods.setValue(FORM_FIELDS.IAM_USER_NAME, users[0].name);
        }
      },
      onShouldGenerateKey: (shouldGenerateKey) => {
        methods.setValue(FORM_FIELDS.GENERATE_KEY, shouldGenerateKey);
      },
    });

  const onSubmit = (data: ISVConfig) => {
    console.log('Form submitted with data:', data);
    setConfig(data);
    next({
      ...data,
      platform,
      capacityBytes: getCapacityBytes(
        data.buckets[0].capacity,
        data.buckets[0].capacityUnit,
      ),
      enableImmutableBackup: isImmutableBackupEnabled(data.application)
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
                console.log(methods.getValues());
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

          <NameField
            register={register}
            control={control}
            errors={errors}
            isExist={isAccountExist}
            status={accounts.status}
            options={_accounts}
            platform={platform}
            type={accountNameType}
            fieldType="account"
            getIAMUsersMutation={getIAMUsersMutation}
          />

          {accountNameType === 'existing' && accountName && (
            <Accordion title="Advanced settings" id="advanced-settings">
              <NameField
                register={register}
                control={control}
                errors={errors}
                isExist={isIAMUserExist}
                status={IAMUsersStatus}
                options={IAMUsers}
                platform={platform}
                type={IAMUserNameType}
                fieldType="iamUser"
              />
            </Accordion>
          )}

          {platform.id === 'veeam-vbo' && renderVeeamApplication()}

          <BucketField
            platform={platform.id}
            bucketNameTooltip={
              platform.fieldOverrides.find(
                (field) => field.name === FORM_FIELDS.BUCKET_NAME,
              ).tooltip
            }
          />

          {isImmutableBackupEnabled(config.application) && (
            <FormGroup
              id={FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP}
              label={
                platform.fieldOverrides.find(
                  (field) => field.name === FORM_FIELDS.ENABLE_IMMUTABLE_BACKUP,
                ).label
              }
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
