import { joiResolver } from '@hookform/resolvers/joi';
import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  spacing,
  Stack,
  Toggle,
} from '@scality/core-ui';
import { SelectRef } from '@scality/core-ui/dist/components/selectv2/Selectv2.component';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Accordion, Box, Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { useListAccounts } from '../../next-architecture/domain/business/accounts';
import { Account } from '../../next-architecture/domain/entities/account';
import { useAccessibleAccountsAdapter } from '../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { Checkbox } from '../../ui-elements/FormLayout';
import { NoOpMetricsAdapter } from '../../ui-elements/SelectAccountIAMRole';
import {
  DEFAULT_IMMUTABLE_PERIOD_DAYS,
  unitChoices,
  VEEAM_OFFICE_365,
} from '../constants';
import { getCapacityBytes } from '../hooks/useCapacityUnit';
import { useIAMUser } from '../hooks/useIAMUser';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';
import { ISVConfig } from '../types';
import BucketField from './BucketField';
import { CreateOrSelectNameField, Option } from './CreateOrSelectNameField';
import { ISVSkipModal } from './ISVSkipModal';
import { ISVStepsIndexes, useISVStepper } from './ISVSteps';
import { VeeamRepositoryFields } from './VeeamRepositoryFields';

const FORM_FIELDS = {
  ACCOUNT_NAME: 'accountName',
  ACCOUNT_NAME_TYPE: 'accountNameType',
  IAM_USER_NAME: 'IAMUserName',
  IAM_USER_NAME_TYPE: 'IAMUserNameType',
  BUCKET_NAME: 'bucketName',
  ENABLE_IMMUTABLE_BACKUP: 'enableImmutableBackup',
  GENERATE_KEY: 'generateKey',
} as const;

export const ISVConfiguration = () => {
  const { platform } = useISVStepper();
  const { next } = useStepper(ISVStepsIndexes.Configuration);
  const [account, setAccount] = useState<Account | null>(null);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);
  const selectRef = useRef<SelectRef<Option, false, null>>(null);
  const [searchParams] = useSearchParams();
  const paramsAccountName = searchParams.get('account');
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = new NoOpMetricsAdapter();
  const isVeeamVBROnly = useIsVeeamVBROnly();

  const { accounts } = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });

  // Conditional default values based on feature flag and platform
  const getDefaultValues = (): Partial<ISVConfig> => {
    const baseDefaults: Partial<ISVConfig> = {
      accountName: paramsAccountName || '',
      accountNameType: (paramsAccountName ? 'existing' : 'create') as
        | 'existing'
        | 'create',
      enableImmutableBackup: true,
      buckets: [
        {
          name: '',
          tag: platform.bucketTag,
          capacity: '0',
          capacityUnit: unitChoices.TiB.toString(),
        },
      ],
    };

    // Only add Veeam repository fields when in VeeamVBR-only context
    if (isVeeamVBROnly && platform.id === 'veeam-vbr') {
      return {
        ...baseDefaults,
        autoCreateRepository: true,
        immutablePeriodDays: DEFAULT_IMMUTABLE_PERIOD_DAYS,
      };
    }

    return baseDefaults;
  };

  const formMethods = useForm<ISVConfig>({
    mode: 'all',
    defaultValues: getDefaultValues(),
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

  const iamRequestSentRef = useRef(false);
  useEffect(() => {
    if (
      iamRequestSentRef.current ||
      !paramsAccountName ||
      accountNameType !== 'existing' ||
      _accounts.length === 0 ||
      getIAMUsersMutation.status === 'loading'
    ) {
      return;
    }

    onFieldNameChange(paramsAccountName);
    iamRequestSentRef.current = true;
  }, [paramsAccountName, _accounts, accountNameType, getIAMUsersMutation]);

  useEffect(() => {
    if (isAccordionExpanded) {
      selectRef.current?.focus();
    }
  }, [isAccordionExpanded]);

  const onSubmit = async (data: ISVConfig) => {
    if (data.application === VEEAM_OFFICE_365) {
      data.enableImmutableBackup = false;
    }

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
  const disabledMessage = platform.getDisabledMessage?.();

  const onFieldNameChange = (value: string) => {
    setIsAccordionExpanded(false);
    if (getIAMUsersMutation) {
      const roleArn = _accounts.find(
        (option) => option.name === value,
      )?.preferredAssumableRoleArn;
      getIAMUsersMutation.mutate(roleArn, {
        onSuccess: (data) => {
          if (data.Users.length > 0) {
            setValue(FORM_FIELDS.IAM_USER_NAME_TYPE, 'existing');
            const user = data.Users.find((user) => user.UserName === value);
            if (user) {
              setValue(FORM_FIELDS.IAM_USER_NAME, user.UserName);
            } else {
              setIsAccordionExpanded(true);
            }
          } else {
            setValue(FORM_FIELDS.IAM_USER_NAME_TYPE, 'create');
            setValue(FORM_FIELDS.IAM_USER_NAME, value);
          }
        },
      });
    }
    const account = _accounts.find((option) => option.name === value);
    setAccount(account);
  };

  return (
    <FormProvider {...formMethods}>
      <ISVSkipModal
        isOpen={skipConfirmationModalIsDisplayed}
        close={() => setSkipConfirmationModalIsDisplayed(false)}
        exitAction={() =>
          navigate(`${paramsAccountName ? '/buckets' : '/accounts'}`)
        }
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
        banner={
          disabledMessage && (
            <Banner
              variant="danger"
              icon={<Icon name="Exclamation-circle" color="statusCritical" />}
            >
              {disabledMessage}
            </Banner>
          )
        }
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
              disabled={!isValid || !!disabledMessage}
              icon={<Icon name="Arrow-right" />}
            />
          </Stack>
        }
      >
        <FormSection forceLabelWidth={280}>
          <Box style={{ paddingBottom: '1rem' }}>{platform.description}</Box>

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
            onFieldNameChange={onFieldNameChange}
          />

          {accountNameType === 'existing' && accountName && (
            <div style={{ position: 'relative', bottom: spacing.f8 }}>
              <Accordion
                title="Advanced settings"
                id="advanced-settings"
                open={isAccordionExpanded}
                isEmphazed={false}
              >
                <FormSection forceLabelWidth={264}>
                  <CreateOrSelectNameField
                    isExist={isIAMUserExist}
                    status={getIAMUsersMutation.status}
                    options={IAMUsers}
                    selectRef={selectRef}
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
                </FormSection>
              </Accordion>
            </div>
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

          <br />
          <FormSection forceLabelWidth={280}>
            <VeeamRepositoryFields />
          </FormSection>
        </FormSection>
      </Form>
    </FormProvider>
  );
};
