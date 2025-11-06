import {
  extractPemParts,
  parseCertificateFromPEM,
  ParsedCertificate,
} from '@scality/certchain';
import { useState, useEffect, useMemo } from 'react';
import { useK8sSecretQueries } from '../queries';

export type ZenkoCRCertificateBundle = {
  'ca.crt'?: string;
  secretName?: string;
  secretAttributes?: string;
};
export type SecretCertificate = {
  secretName: string;
  secretAttributes: string;
};

export type CertificateWithPEM = ParsedCertificate & {
  originalPEM: string;
};

const extractCertificateBundles = (
  certificateBundles: ZenkoCRCertificateBundle[],
) => {
  return certificateBundles
    .filter((certificateBundle) => certificateBundle['ca.crt'])
    .map((certificateBundle) => {
      return extractPemParts(certificateBundle['ca.crt']);
    });
};

const extractSecretCertificates = (
  extraCACerts: ZenkoCRCertificateBundle[],
): SecretCertificate[] => {
  return extraCACerts
    .filter((extraCACert) => extraCACert['secretName'])
    .map((extraCACert) => {
      return {
        secretName: extraCACert['secretName'],
        secretAttributes: extraCACert['secretAttributes'] ?? 'ca.crt',
      };
    });
};

const parseCertificateBundles = async (
  extractedCertificateBundles: { pem: string }[][],
): Promise<CertificateWithPEM[][]> => {
  return await Promise.all(
    extractedCertificateBundles.map(async (extractedCertificateBundle) => {
      return await Promise.all(
        extractedCertificateBundle.map(async (pemPart) => {
          const parsed = await parseCertificateFromPEM(pemPart.pem);
          return {
            ...parsed,
            originalPEM: pemPart.pem,
          };
        }),
      );
    }),
  );
};

export const useParseBundleCertificates = (
  certificateBundles: ZenkoCRCertificateBundle[],
) => {
  const [data, setData] = useState<CertificateWithPEM[][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const parse = async () => {
      try {
        const extractedCertificateBundles =
          extractCertificateBundles(certificateBundles);
        const parsedCertificates = await parseCertificateBundles(
          extractedCertificateBundles,
        );
        setData(parsedCertificates);
      } catch (error) {
        console.error('Error parsing certificates:', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (certificateBundles.length > 0) {
      parse();
    } else {
      setIsLoading(false);
    }
  }, [certificateBundles]);

  return { parsedCertificates: data, isLoading };
};

export const useParseSecretCertificates = (
  extraCACerts: ZenkoCRCertificateBundle[],
): { parsedSecretCertificates: CertificateWithPEM[][]; isLoading: boolean } => {
  const [parsedSecretCertificates, setParsedCertificates] = useState<
    CertificateWithPEM[][]
  >([]);

  const extractedSecretCertificates = useMemo(
    () => extractSecretCertificates(extraCACerts),
    [extraCACerts],
  );

  const secretNames = useMemo(
    () => extractedSecretCertificates.map((secret) => secret.secretName),
    [extractedSecretCertificates],
  );

  const secretQueries = useK8sSecretQueries(secretNames);

  const isLoading = secretQueries.status === 'loading';
  const hasErrors = secretQueries.status === 'error';

  useEffect(() => {
    if (isLoading) return;

    if (extractedSecretCertificates.length === 0 || hasErrors) {
      setParsedCertificates([]);
      return;
    }

    // Retrieve and parse certificates
    (async () => {
      try {
        // secretQueries.data is an array of secret data objects
        const secretsData = secretQueries.data;

        if (!secretsData || !Array.isArray(secretsData)) {
          setParsedCertificates([]);
          return;
        }

        const parsed = await Promise.all(
          secretsData.map(async (secretData, index) => {
            const attributeName =
              extractedSecretCertificates[index].secretAttributes;

            const certificateBase64 = secretData?.data?.[attributeName];
            if (!certificateBase64) {
              throw new Error(
                `Certificate not found in secret field: ${attributeName}`,
              );
            }

            // Decode base64 to get the PEM certificate
            const certificatePEM = atob(certificateBase64);
            // Extract PEM parts to handle certificate bundles
            const pemParts = extractPemParts(certificatePEM);
            return await Promise.all(
              pemParts.map(async (pemPart) => {
                const parsed = await parseCertificateFromPEM(pemPart.pem);
                return {
                  ...parsed,
                  originalPEM: pemPart.pem,
                };
              }),
            );
          }),
        );
        setParsedCertificates(parsed);
      } catch (err) {
        console.error('Error parsing secret certificates:', err);
        setParsedCertificates([]);
      }
    })();
  }, [isLoading, hasErrors, extractedSecretCertificates, secretQueries.data]);

  return {
    parsedSecretCertificates,
    isLoading,
  };
};
