import { useMemo, useRef, useState, useEffect } from 'react';
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
import { useIAMClient } from '../../IAMProvider';

const FORM_FIELDS = {
  ACCOUNT_NAME: 'accountName',
  ACCOUNT_NAME_TYPE: 'accountNameType',
  IAM_USER_NAME: 'IAMUserName',
  IAM_USER_NAME_TYPE: 'IAMUserNameType',
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
    <FormGroup
      id={fieldName}
      label={isAccount ? 'Account' : 'IAM User Management'}
      required
      labelHelpTooltip={
        platform.fieldOverrides.find(
          (field) => field.name === FORM_FIELDS.ACCOUNT_NAME,
        ).tooltip
      }
      helpErrorPosition="bottom"
      error={
        isExist && type === 'create'
          ? `${isAccount ? 'Account' : 'IAM User'} name already exists`
          : errors[fieldName]?.message ?? ''
      }
      content={
        <>
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
              render={({ field: { onChange, value } }) => (
                <Select
                  id={fieldName}
                  onChange={onChange}
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
        </>
      }
    />
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
    defaultValues: {
      ...config,
      accountNameType: 'create',
      IAMUserNameType: 'create',
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
  const IAMUserName = watch('IAMUserName');
  const IAMUserNameType = watch('IAMUserNameType');
  const application = watch('application');

  const isAccountExist = useMemo(() => {
    const exists =
      status === 'success' &&
      accounts.some((account) => account.name === accountName);
    return exists;
  }, [accountName, status, accounts]);
  const isIAMUserExist = useMemo(() => {
    const exists =
      status === 'success' &&
      accounts.some((account) => account.name === IAMUserName);
    return exists;
  }, [IAMUserName, status, accounts]);

  const IAMClient = useIAMClient();
  const [IAMUsers, setIAMUsers] = useState([]);
  const [IAMUsersStatus, setIAMUsersStatus] = useState('loading');

  useEffect(() => {
    const fetchIAMUsers = async () => {
      try {
        const response = await IAMClient.listUsers();
        setIAMUsers(
          response.Users.map((user) => ({
            id: user.UserId,
            name: user.UserName,
          })),
        );
        setIAMUsersStatus('success');
      } catch (error) {
        console.error('Failed to fetch IAM users:', error);
        setIAMUsersStatus('error');
      }
    };

    fetchIAMUsers();
  }, [IAMClient]);

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
    <>
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
    </>
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

          <NameField
            register={register}
            control={control}
            errors={errors}
            isExist={isAccountExist}
            status={status}
            options={accounts}
            platform={platform}
            type={accountNameType}
            fieldType="account"
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
