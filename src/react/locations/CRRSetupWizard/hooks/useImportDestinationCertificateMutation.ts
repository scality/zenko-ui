import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useAddCertificateToZenkoConfigurationMutation, useWaitForZenkoDeployment } from '../../../../js/mutations';
import { getZenkoCRQuery } from '../../../queries';
import type { ZenkoCR } from '../../../truststore/Truststore';

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
export const useImportDestinationCertificateMutation = () => {
  const { data: zenkoCR } = useQuery(getZenkoCRQuery());
  const queryClient = useQueryClient();
  const hasEgress = !!zenkoCR?.spec?.egress;
  const hasExtraCACerts = !!zenkoCR?.spec?.egress?.extraCACerts;
  // So the wait cannot outlive the step when the user exits or cancels.
  const cancelledRef = useRef(false);
  const isCancelled = () => cancelledRef.current;
  const addCertificate = useAddCertificateToZenkoConfigurationMutation({
    hasEgress,
    hasExtraCACerts,
    isCancelled,
  });
  const waitForZenkoDeployment = useWaitForZenkoDeployment();
  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  return useMutation({
    mutationFn: async ({ certificate }: { certificate: string }) => {
      const retryTimestamp = Date.now();
      const normalized = normalizeCertificate(certificate);
      // Read the latest cached CR at execution time, not the render-time snapshot.
      const currentCR = queryClient.getQueryData<ZenkoCR>(['zenkoCR']) ?? zenkoCR;
      if (isCertificateAlreadyImported(currentCR, normalized)) {
        await waitForZenkoDeployment({ isCancelled, since: retryTimestamp });
        return;
      }
      await addCertificate.mutateAsync({ certificate: normalized });
    },
  });
};
