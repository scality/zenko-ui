import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useAddCertificateToZenkoConfigurationMutation, useWaitForZenkoDeployment } from '../../../../js/mutations';
import { getZenkoCRQuery } from '../../../queries';
import type { ZenkoCR } from '../../../truststore/Truststore';

const ROLLOUT_WINDOW_MS = 6 * 60_000;
const ROLLOUT_INTERVAL_MS = 1_000;

export const normalizeCertificate = (certificate: string): string => certificate.replace(/\r\n/g, '\n').trim();

/** True when the PEM is already in the source truststore, so importing it again is a no-op. */
export const isCertificateAlreadyImported = (zenkoCR: ZenkoCR | undefined, certificate: string): boolean =>
  (zenkoCR?.spec?.egress?.extraCACerts ?? []).some(
    (bundle) => normalizeCertificate(bundle['ca.crt']) === normalizeCertificate(certificate),
  );

/**
 * Imports the destination CA certificate into the source cluster's truststore
 * (Zenko CR `spec.egress.extraCACerts`). Idempotent: if the certificate is
 * already present the step is a no-op, so re-runs and retries do not append
 * duplicate entries. Either way the step only completes once the Zenko
 * rollout has settled, so the destination's certificate is trusted by then.
 */
export const useImportDestinationCertificateMutation = ({
  windowMs = ROLLOUT_WINDOW_MS,
  intervalMs = ROLLOUT_INTERVAL_MS,
}: {
  windowMs?: number;
  intervalMs?: number;
} = {}) => {
  const { data: zenkoCR } = useQuery(getZenkoCRQuery());
  const queryClient = useQueryClient();
  const hasEgress = !!zenkoCR?.spec?.egress;
  const hasExtraCACerts = !!zenkoCR?.spec?.egress?.extraCACerts;
  const addCertificate = useAddCertificateToZenkoConfigurationMutation({
    hasEgress,
    hasExtraCACerts,
    pollTimeoutMs: windowMs,
  });
  const waitForZenkoDeployment = useWaitForZenkoDeployment();
  const waitRef = useRef(waitForZenkoDeployment);
  waitRef.current = waitForZenkoDeployment;

  // So the wait cannot outlive the step when the user exits or cancels.
  const cancelledRef = useRef(false);
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return useMutation({
    mutationFn: async ({ certificate }: { certificate: string }) => {
      const normalized = normalizeCertificate(certificate);
      // Read the latest cached CR at execution time, not the render-time snapshot.
      const currentCR = queryClient.getQueryData<ZenkoCR>(['zenkoCR']) ?? zenkoCR;
      if (isCertificateAlreadyImported(currentCR, normalized)) {
        await waitRef.current({
          timeoutMs: windowMs,
          intervalMs,
          isCancelled: () => cancelledRef.current,
        });
        return;
      }
      await addCertificate.mutateAsync({ certificate: normalized });
    },
  });
};
