import { Form, Icon, InfoMessage, Stack, useToast } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ServiceError } from '../../api/crrConfiguratorClient';
import type { ProblemCode } from '../../api/types';
import { useCRRConfigurationVerifyMutation } from '../../hooks/useCRRConfigurationVerifyMutation';
import { useResolveEndpointMutation } from '../../hooks/useResolveEndpointMutation';
import { DestinationAccountSection, type ResolveStatus } from './DestinationAccountSection';
import { DestinationConnectionSection } from './DestinationConnectionSection';
import { ReplicationSection } from './ReplicationSection';
import { SourceSection } from './SourceSection';
import {
  type ConfigureFormValues,
  configureResolver,
  defaultConfigureValues,
  toResolveBody,
  toVerifyBody,
} from './schema';

/** Step index for the wizard's Stepper.next() calls. */
export const CONFIGURE_STEP_INDEX = 0;

const errorCopy: Partial<Record<ProblemCode, string>> = {
  DestinationUnreachable: 'Failed to reach the destination. Check the base domain and your network connection.',
  DestinationCertificateInvalid: 'The destination certificate is invalid.',
  DestinationAuthFailed: 'Failed to authenticate with the destination. Check your credentials.',
  AssumeRoleFailed: 'Failed to assume the replication role on the destination.',
  Unauthorized: 'Your session has expired. Sign in again.',
  Forbidden: 'You are not authorized to configure replication.',
};

const errorMessage = (error: unknown): string => {
  if (error instanceof ServiceError) {
    const code = error.problem.code as ProblemCode | undefined;
    return (code && errorCopy[code]) ?? error.problem.title ?? 'Failed to reach the destination.';
  }
  return (error as Error)?.message ?? 'Failed to reach the destination.';
};

export const ConfigureStep = () => {
  const { next } = useStepper(CONFIGURE_STEP_INDEX);
  const navigate = useBasenameRelativeNavigate();
  const { showToast } = useToast();
  const verify = useCRRConfigurationVerifyMutation();
  const resolveEndpoint = useResolveEndpointMutation();
  const lastVerifiedRef = useRef<string | null>(null);
  const pendingResolveRef = useRef<string | null>(null);
  const [resolveStatus, setResolveStatus] = useState<ResolveStatus>('idle');

  const formMethods = useForm<ConfigureFormValues>({
    mode: 'all',
    resolver: configureResolver,
    defaultValues: defaultConfigureValues,
  });
  const {
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { isValid },
  } = formMethods;

  const onConnect = async () => {
    const body = toVerifyBody(getValues());
    try {
      await verify.mutateAsync(body);
      lastVerifiedRef.current = JSON.stringify(body);
      // A fresh connection invalidates any prior endpoint choice.
      pendingResolveRef.current = null;
      setValue('selectedEndpoint', '', { shouldValidate: true });
      setResolveStatus('idle');
      showToast({ open: true, status: 'success', message: 'Connected' });
    } catch (error) {
      showToast({ open: true, status: 'error', message: errorMessage(error) });
    }
  };

  const onEndpointSelected = async (hostname: string) => {
    pendingResolveRef.current = hostname;
    setResolveStatus('checking');
    try {
      const { resolvable } = await resolveEndpoint.mutateAsync(
        toResolveBody({ ...getValues(), selectedEndpoint: hostname }),
      );
      // Drop a response that lost the race to a newer selection.
      if (pendingResolveRef.current !== hostname) return;
      setResolveStatus(resolvable ? 'resolvable' : 'unresolvable');
    } catch (error) {
      if (pendingResolveRef.current !== hostname) return;
      setResolveStatus('unresolvable');
      showToast({ open: true, status: 'error', message: errorMessage(error) });
    }
  };

  const onContinue = handleSubmit((values) => {
    if (resolveStatus !== 'resolvable') return;
    next({ ...values });
  });

  const watchedValues = watch();
  const isConnected = verify.isSuccess && lastVerifiedRef.current === JSON.stringify(toVerifyBody(watchedValues));
  const endpoints = isConnected ? (verify.data?.endpoints ?? []) : [];
  const canContinue = isValid && isConnected && resolveStatus === 'resolvable';

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
              disabled={!canContinue}
              icon={<Icon name="Arrow-right" />}
            />
          </Stack>
        }
      >
        <InfoMessage
          title="Cross-Region location"
          content="A location is created here, on the source site, pointing to a destination site. The destination automatically receives the resources required for replication."
          link="/artesca/docs/data_management/location_management/add_a_crr_location.html"
          linkText="Learn more"
        />
        <DestinationConnectionSection isConnecting={verify.isLoading} onConnect={onConnect} isConnected={isConnected} />
        <SourceSection />
        <DestinationAccountSection
          isConnected={isConnected}
          endpoints={endpoints}
          resolveStatus={resolveStatus}
          onEndpointSelected={onEndpointSelected}
        />
        <ReplicationSection />
      </Form>
    </FormProvider>
  );
};
