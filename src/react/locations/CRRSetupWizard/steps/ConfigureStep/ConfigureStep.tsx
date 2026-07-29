import { Form, Icon, Stack, useToast } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { ServiceError } from '../../api/crrConfiguratorClient';
import type { HostAlias, ProblemCode, VerifyRequestBody, VerifyResponse } from '../../api/types';
import { DnsFallbackModal } from '../../DnsFallbackModal';
import { useCRRConfigurationVerifyMutation } from '../../hooks/useCRRConfigurationVerifyMutation';
import { DestinationAccountSection } from './DestinationAccountSection';
import { DestinationConnectionSection } from './DestinationConnectionSection';
import { ReplicationSection } from './ReplicationSection';
import { SourceSection } from './SourceSection';
import { type ConfigureFormValues, configureResolver, defaultConfigureValues, toVerifyBody } from './schema';

/** Step index for the wizard's Stepper.next() calls. */
export const CONFIGURE_STEP_INDEX = 0;

const errorCopy: Partial<Record<ProblemCode, string>> = {
  DestinationUnreachable: 'Failed to reach the destination. Check the URL and your network connection.',
  DestinationDnsResolutionFailed: 'Failed to resolve the destination hostnames.',
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

const unresolvedHostsFrom = (error: unknown): string[] | null => {
  if (error instanceof ServiceError && error.code === 'DestinationDnsResolutionFailed') {
    const hosts = error.problem.unresolvedHosts;
    if (hosts && hosts.length > 0) return hosts;
  }
  return null;
};

const mergeAliases = (existing: HostAlias[], added: HostAlias[]): HostAlias[] => {
  const byHost = new Map(existing.map((alias) => [alias.hostname, alias]));
  for (const alias of added) byHost.set(alias.hostname, alias);
  return [...byHost.values()];
};

export const ConfigureStep = () => {
  const { next } = useStepper(CONFIGURE_STEP_INDEX);
  const navigate = useBasenameRelativeNavigate();
  const { showToast } = useToast();
  const verify = useCRRConfigurationVerifyMutation();
  const lastVerifiedRef = useRef<string | null>(null);
  const [dnsFallbackHosts, setDnsFallbackHosts] = useState<string[] | null>(null);

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

  const handleVerifyError = (error: unknown) => {
    const hosts = unresolvedHostsFrom(error);
    if (hosts) {
      setDnsFallbackHosts(hosts);
      return;
    }
    showToast({ open: true, status: 'error', message: errorMessage(error) });
  };

  const runVerify = async (body: VerifyRequestBody): Promise<VerifyResponse> => {
    const response = await verify.mutateAsync(body);
    lastVerifiedRef.current = JSON.stringify(body);
    return response;
  };

  const destinationInstanceNameFrom = (response: VerifyResponse | undefined): string | undefined =>
    response?.ok && response.mode === 'management-network' ? response.instanceName : undefined;

  const onCheckConnection = async () => {
    try {
      await runVerify(toVerifyBody(getValues()));
      showToast({ open: true, status: 'success', message: 'Connection established' });
    } catch (error) {
      handleVerifyError(error);
    }
  };

  const onContinue = handleSubmit(async (values) => {
    const body = toVerifyBody(values);
    const snapshot = JSON.stringify(body);
    if (lastVerifiedRef.current === snapshot) {
      next({ ...values, destinationInstanceName: destinationInstanceNameFrom(verify.data) });
      return;
    }
    try {
      const response = await runVerify(body);
      next({ ...values, destinationInstanceName: destinationInstanceNameFrom(response) });
    } catch (error) {
      handleVerifyError(error);
    }
  });

  const watchedValues = watch();
  const isConnected = verify.isSuccess && lastVerifiedRef.current === JSON.stringify(toVerifyBody(watchedValues));
  const connectedInstanceName = isConnected ? destinationInstanceNameFrom(verify.data) : undefined;

  return (
    <FormProvider {...formMethods}>
      <DnsFallbackModal
        isOpen={dnsFallbackHosts !== null}
        unresolvedHosts={dnsFallbackHosts ?? []}
        initialAliases={getValues('hostAliases')}
        onCancel={() => setDnsFallbackHosts(null)}
        onSubmit={(aliases) => {
          setValue('hostAliases', mergeAliases(getValues('hostAliases'), aliases));
          setDnsFallbackHosts(null);
          onCheckConnection();
        }}
      />
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
        <DestinationConnectionSection
          isCheckingConnection={verify.isLoading}
          onCheckConnection={onCheckConnection}
          isConnected={isConnected}
          connectedInstanceName={connectedInstanceName}
        />
        <DestinationAccountSection />
        <ReplicationSection />
      </Form>
    </FormProvider>
  );
};
