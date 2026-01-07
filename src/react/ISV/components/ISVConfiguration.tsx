import { useState } from 'react';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { Form, FormSection, Icon, Stack } from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { ISVStepsIndexes, useISVStepper } from './ISVSteps';
import { ISVSkipModal } from './ISVSkipModal';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';
import { useVeeamAutoRepositoryFeature } from '../hooks/useVeeamAutoRepositoryFeature';
import { DEFAULT_IMMUTABLE_PERIOD_DAYS, VEEAM_OFFICE_365 } from '../constants';
import { getCapacityBytes } from '../hooks/useCapacityUnit';
import { FormRenderer } from './FormRenderer';
import { FormData, ISVPlatform } from '../engine/types';
import { ISVFormProvider, useISVFormContext } from './ISVFormContext';
import { useSearchParams } from 'react-router';

type ISVConfigurationInnerProps = {
  formMethods: UseFormReturn<FormData>;
};

const ISVConfigurationInner = ({ formMethods }: ISVConfigurationInnerProps) => {
  const { template } = useISVStepper();
  const { next } = useStepper(ISVStepsIndexes.Configuration);
  const navigate = useBasenameRelativeNavigate();

  const { selectedAccount, paramsAccountName, accessKeys } = useISVFormContext();

  const {
    handleSubmit,
    formState: { isValid },
  } = formMethods;

  const onSubmit = async (data: FormData) => {
    if (data.application === VEEAM_OFFICE_365) {
      data.enableImmutableBackup = false;
    }
    next({
      ...data,
      template,
      buckets: data.buckets.map((bucket) => ({
        ...bucket,
        capacityBytes: getCapacityBytes(
          bucket.capacity?.toString() || '0',
          bucket.capacityUnit || 'TiB',
        ),
      })),
      enableImmutableBackup: !!data.enableImmutableBackup,
      account: selectedAccount,
      accessKeys,
    });
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
        exitAction={() =>
          navigate(`${paramsAccountName ? '/buckets' : '/accounts'}`)
        }
        title={`Exit ${template.name} assistant?`}
        modalContent={<>{template.skipModalContent}</>}
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
          {template.description && (
            <Box style={{ paddingBottom: '1rem' }}>{template.description}</Box>
          )}

          <FormRenderer
            fields={template.fields}
            formMethods={formMethods}
            context={{ platform: template.id }}
          />
        </FormSection>
      </Form>
    </FormProvider>
  );
};

const getDefaultFormValues = (
  template: ISVPlatform,
  paramsAccountName: string | null,
  isVeeamVBROnly: boolean,
  isAutoRepoFeatureEnabled: boolean,
): Partial<FormData> => {
  const baseDefaults: Partial<FormData> = {
    accountName: paramsAccountName || '',
    accountNameType: paramsAccountName ? 'existing' : 'create',
    enableImmutableBackup: true,
    buckets: [
      {
        name: '',
        capacity: 0,
        capacityUnit: 'TiB',
      },
    ],
  };

  if (isVeeamVBROnly && isAutoRepoFeatureEnabled) {
    return {
      ...baseDefaults,
      autoCreateRepository: true,
      immutablePeriodDays: DEFAULT_IMMUTABLE_PERIOD_DAYS,
    };
  }

  return baseDefaults;
};

export const ISVConfiguration = () => {
  const { template } = useISVStepper();
  const [searchParams] = useSearchParams();
  const paramsAccountName = searchParams.get('account');
  const isVeeamVBROnly = useIsVeeamVBROnly();
  const isAutoRepoFeatureEnabled = useVeeamAutoRepositoryFeature();

  const formMethods = useForm<FormData>({
    mode: 'all',
    defaultValues: getDefaultFormValues(
      template,
      paramsAccountName,
      isVeeamVBROnly,
      isAutoRepoFeatureEnabled,
    ),
    resolver: joiResolver(template.validator),
    shouldUnregister: false,
  });

  return (
    <ISVFormProvider template={template} formMethods={formMethods}>
      <ISVConfigurationInner formMethods={formMethods} />
    </ISVFormProvider>
  );
};
