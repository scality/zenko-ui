import { joiResolver } from '@hookform/resolvers/joi';
import { Form, FormSection, Icon, Stack } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { Fragment, useState } from 'react';
import { FormProvider, type UseFormReturn, useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { DEFAULT_IMMUTABLE_PERIOD_DAYS, VEEAM_OFFICE_365 } from '../constants';
import { FormData, ISVPlatform } from '../engine/types';
import { getCapacityBytes } from '../hooks/useCapacityUnit';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';
import { FormRenderer } from './FormRenderer';
import { ISVFormProvider, useISVFormContext } from './ISVFormContext';
import { ISVSkipModal } from './ISVSkipModal';
import { useISVStepper } from './ISVStepperContext';
import { ISVStepsIndexes } from './ISVSteps';

type ISVConfigurationInnerProps = {
  formMethods: UseFormReturn<FormData>;
};

const ISVConfigurationInner = ({ formMethods }: ISVConfigurationInnerProps) => {
  const { platform } = useISVStepper();
  const { next } = useStepper(ISVStepsIndexes.Configuration);
  const navigate = useBasenameRelativeNavigate();

  const { selectedAccount, paramsAccountName, accessKeys, isDuplicateAccountName, isDuplicateIAMUserName } = useISVFormContext();

  const {
    handleSubmit,
    formState: { isValid },
  } = formMethods;

  const hasDuplicateError = isDuplicateAccountName || isDuplicateIAMUserName;

  const onSubmit = async (data: FormData) => {
    if (data.application === VEEAM_OFFICE_365) {
      data.enableImmutableBackup = false;
    }
    next({
      ...data,
      platform,
      buckets: data.buckets.map((bucket) => ({
        ...bucket,
        capacityBytes: getCapacityBytes(bucket.capacity?.toString() || '0', bucket.capacityUnit || 'TiB'),
      })),
      enableImmutableBackup: !!data.enableImmutableBackup,
      account: selectedAccount,
      accessKeys,
    });
  };

  const [skipConfirmationModalIsDisplayed, setSkipConfirmationModalIsDisplayed] = useState<boolean>(false);

  return (
    <FormProvider {...formMethods}>
      <ISVSkipModal
        isOpen={skipConfirmationModalIsDisplayed}
        close={() => setSkipConfirmationModalIsDisplayed(false)}
        exitAction={() => navigate(`${paramsAccountName ? '/buckets' : '/accounts'}`)}
        title={`Exit ${platform.name} assistant?`}
        modalContent={<>{platform.skipModalContent}</>}
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
              disabled={!isValid || hasDuplicateError}
              icon={<Icon name="Arrow-right" />}
            />
          </Stack>
        }
      >
        <FormSection forceLabelWidth={280}>
          {platform.description && <Box style={{ paddingBottom: '1rem' }}>{platform.description}</Box>}

          <FormRenderer fields={platform.fields} formMethods={formMethods} context={{ platform: platform.id }} />
        </FormSection>
      </Form>
    </FormProvider>
  );
};

const getDefaultFormValues = (
  platform: ISVPlatform,
  paramsAccountName: string | null,
  isVeeamVBROnly: boolean,
): Partial<FormData> => {
  const hasImmutableField = platform.fields.some((f) => f.name === 'enableImmutableBackup');
  const baseDefaults: Partial<FormData> = {
    accountName: paramsAccountName || '',
    accountNameType: paramsAccountName ? 'existing' : 'create',
    ...(hasImmutableField ? { enableImmutableBackup: true } : {}),
    buckets: [
      {
        name: '',
        capacity: 0,
        capacityUnit: 'TiB',
      },
    ],
  };

  const fieldDefaults = platform.fields.reduce<Record<string, unknown>>((acc, field) => {
    if ('defaultValue' in field && field.defaultValue !== undefined) {
      acc[field.name] = field.defaultValue;
    }
    return acc;
  }, {});

  const defaults = { ...fieldDefaults, ...baseDefaults };

  if (isVeeamVBROnly) {
    return {
      ...defaults,
      autoCreateRepository: true,
      immutablePeriodDays: DEFAULT_IMMUTABLE_PERIOD_DAYS,
    };
  }

  return defaults;
};

export const ISVConfiguration = () => {
  const { platform } = useISVStepper();
  const [searchParams] = useSearchParams();
  const paramsAccountName = searchParams.get('account');
  const isVeeamVBROnly = useIsVeeamVBROnly();

  const formMethods = useForm<FormData>({
    mode: 'all',
    defaultValues: getDefaultFormValues(platform, paramsAccountName, isVeeamVBROnly),
    resolver: joiResolver(platform.validator),
    shouldUnregister: false,
  });

  const ContextProvider = platform.contextProvider ?? Fragment;

  return (
    <ContextProvider>
      <ISVFormProvider platform={platform} formMethods={formMethods}>
        <ISVConfigurationInner formMethods={formMethods} />
      </ISVFormProvider>
    </ContextProvider>
  );
};
