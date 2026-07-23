import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useAddCertificateToZenkoConfigurationMutation } from '../../../../js/mutations';
import { getZenkoCRQuery } from '../../../queries';
import type { ZenkoCR } from '../../../truststore/Truststore';

/** True when the PEM is already in the source truststore, so importing it again is a no-op. */
export const isCertificateAlreadyImported = (zenkoCR: ZenkoCR | undefined, certificate: string): boolean =>
  (zenkoCR?.spec?.egress?.extraCACerts ?? []).some((bundle) => bundle['ca.crt'] === certificate);

/**
 * Imports the destination CA certificate into the source cluster's truststore
 * (Zenko CR `spec.egress.extraCACerts`). Idempotent: if the certificate is
 * already present the step is a no-op, so re-runs and retries do not append
 * duplicate entries.
 */
export const useImportDestinationCertificateMutation = () => {
  const { data: zenkoCR } = useQuery(getZenkoCRQuery());
  const queryClient = useQueryClient();
  const hasEgress = !!zenkoCR?.spec?.egress;
  const hasExtraCACerts = !!zenkoCR?.spec?.egress?.extraCACerts;
  const addCertificate = useAddCertificateToZenkoConfigurationMutation({ hasEgress, hasExtraCACerts });

  return useMutation({
    mutationFn: async ({ certificate }: { certificate: string }) => {
      // Read the latest cached CR at execution time, not the render-time snapshot.
      const currentCR = queryClient.getQueryData<ZenkoCR>(['zenkoCR']) ?? zenkoCR;
      if (isCertificateAlreadyImported(currentCR, certificate)) {
        return;
      }
      await addCertificate.mutateAsync({ certificate });
    },
  });
};
