import { extractPemParts, parseCertificateFromPEM } from '@scality/certchain';
import { useState, useEffect, useMemo } from 'react';
import { useK8sSecretQueries } from '../queries';
import { ParsedCertificatesBundleWithIndex } from './Truststore';

export type ZenkoCRCertificateBundle = {
  'ca.crt'?: string;
  secretName?: string;
  secretAttributeName?: string;
};

export type ZenkoCRCertificateBundleWithIndex = ZenkoCRCertificateBundle & {
  index: number;
};
export type SecretCertificate = {
  secretName: string;
  secretAttributes: string;
  index: number;
};

const extractCertificateBundles = (
  certificateBundles: ZenkoCRCertificateBundleWithIndex[],
) => {
  return certificateBundles
    .filter((certificateBundle) => certificateBundle['ca.crt'])
    .map((certificateBundle) => {
      return {
        pemParts: extractPemParts(certificateBundle['ca.crt']),
        index: certificateBundle.index,
      };
    });
};

const extractSecretCertificates = (
  extraCACerts: ZenkoCRCertificateBundleWithIndex[],
): (SecretCertificate & { index: number })[] => {
  return extraCACerts
    .filter((extraCACert) => extraCACert['secretName'])
    .map((extraCACert) => {
      return {
        secretName: extraCACert['secretName'],
        secretAttributes: extraCACert['secretAttributeName'] ?? 'ca.crt',
        index: extraCACert.index,
      };
    });
};

const parseCertificateBundles = async (
  extractedCertificateBundles: {
    pemParts: { pem: string }[];
    index: number;
  }[],
): Promise<ParsedCertificatesBundleWithIndex[]> => {
  return await Promise.all(
    extractedCertificateBundles.map(async (extractedCertificateBundle) => {
      const parsedCertificates = await Promise.all(
        extractedCertificateBundle.pemParts.map(async (pemPart) => {
          const parsed = await parseCertificateFromPEM(pemPart.pem);
          return {
            ...parsed,
            originalPEM: pemPart.pem,
          };
        }),
      );
      return {
        parsedCertificates,
        index: extractedCertificateBundle.index,
      };
    }),
  );
};

export const useParseBundleCertificates = (
  certificateBundles: ZenkoCRCertificateBundleWithIndex[],
) => {
  const [data, setData] = useState<ParsedCertificatesBundleWithIndex[]>([]);
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
  extraCACerts: ZenkoCRCertificateBundleWithIndex[],
): {
  parsedSecretCertificates: ParsedCertificatesBundleWithIndex[];
  isLoading: boolean;
} => {
  const [parsedSecretCertificates, setParsedCertificates] = useState<
    ParsedCertificatesBundleWithIndex[]
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
          secretsData.map(async (secretData, dataIndex) => {
            const attributeName =
              extractedSecretCertificates[dataIndex].secretAttributes;

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
            const parsedCerts = await Promise.all(
              pemParts.map(async (pemPart) => {
                const parsed = await parseCertificateFromPEM(pemPart.pem);
                return {
                  ...parsed,
                  originalPEM: pemPart.pem,
                };
              }),
            );
            return {
              parsedCertificates: parsedCerts,
              index: extractedSecretCertificates[dataIndex].index ?? 0,
            };
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
