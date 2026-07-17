import { Form, Icon, Stack, useToast } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ServiceError } from '../../api/crrConfiguratorClient';
import type { ProblemCode, VerifyRequestBody } from '../../api/types';
import { useCRRConfigurationVerifyMutation } from '../../hooks/useCRRConfigurationVerifyMutation';
import { DestinationAccountSection } from './DestinationAccountSection';
import { DestinationConnectionSection } from './DestinationConnectionSection';
import { ReplicationSection } from './ReplicationSection';
import { SourceSection } from './SourceSection';
import { type ConfigureFormValues, configureResolver, defaultConfigureValues, toVerifyBody } from './schema';

/** Step index for the wizard's Stepper.next() calls. */
export const CONFIGURE_STEP_INDEX = 0;

const errorCopy: Partial<Record<ProblemCode, string>> = {
  DestinationUnreachable: 'The destination cluster did not respond.',
  DestinationDnsResolutionFailed: 'One or more destination hostnames could not be resolved.',
  DestinationCertificateInvalid: 'The pasted certificate is not a valid PEM bundle.',
  DestinationAuthFailed: 'The destination refused these admin credentials.',
  AssumeRoleFailed: 'The destination rejected the storage-manager role assumption.',
  Unauthorized: 'Your session was rejected by the source cluster. Sign in again.',
  Forbidden: 'You need the Storage Manager role to run this wizard.',
};

const errorMessage = (error: unknown): string => {
  if (error instanceof ServiceError) {
    const code = error.problem.code as ProblemCode | undefined;
    return (code && errorCopy[code]) ?? error.problem.title ?? 'Connection to the destination failed.';
  }
  return (error as Error)?.message ?? 'Connection to the destination failed.';
};

export const ConfigureStep = () => {
  const { next } = useStepper(CONFIGURE_STEP_INDEX);
  const navigate = useBasenameRelativeNavigate();
  const { showToast } = useToast();
  const verify = useCRRConfigurationVerifyMutation();
  const lastVerifiedRef = useRef<string | null>(null);

  const formMethods = useForm<ConfigureFormValues>({
    mode: 'all',
    resolver: configureResolver,
    defaultValues: defaultConfigureValues,
  });
  const {
    handleSubmit,
    getValues,
    trigger,
    formState: { isValid },
  } = formMethods;

  const runVerify = async (body: VerifyRequestBody) => {
    await verify.mutateAsync(body);
    lastVerifiedRef.current = JSON.stringify(body);
  };

  const onCheckConnection = async () => {
    const valid = await trigger([
      'connectionMode',
      'url',
      'baseDomain',
      's3Endpoint',
      'username',
      'password',
      'certificate',
    ]);
    if (!valid) return;
    const body = toVerifyBody(getValues());
    try {
      await runVerify(body);
      showToast({ open: true, status: 'success', message: 'Destination reachable' });
    } catch (error) {
      showToast({ open: true, status: 'error', message: errorMessage(error) });
    }
  };

  const onContinue = handleSubmit(async (values) => {
    const body = toVerifyBody(values);
    const snapshot = JSON.stringify(body);
    if (lastVerifiedRef.current === snapshot) {
      next({ ...values });
      return;
    }
    try {
      await runVerify(body);
      next({ ...values });
    } catch (error) {
      showToast({ open: true, status: 'error', message: errorMessage(error) });
    }
  });

  return (
    <FormProvider {...formMethods}>
      <Form
        onSubmit={onContinue}
        requireMode="partial"
        layout={{ title: 'Configure Cross-Region Location', kind: 'page' }}
        rightActions={
          <Stack gap="r16">
            <Button type="button" variant="outline" label="Cancel" onClick={() => navigate('/locations')} />
            <Button
              type="submit"
              variant="primary"
              label="Continue"
              isLoading={verify.isLoading}
              disabled={!isValid}
              icon={<Icon name="Arrow-right" />}
            />
          </Stack>
        }
      >
        <SourceSection />
        <DestinationConnectionSection isCheckingConnection={verify.isLoading} onCheckConnection={onCheckConnection} />
        <DestinationAccountSection />
        <ReplicationSection />
      </Form>
    </FormProvider>
  );
};
