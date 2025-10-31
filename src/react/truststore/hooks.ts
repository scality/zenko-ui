import {
  parseCertificateFromPEM,
  extractPemParts,
  Certificate,
  CertificateSubject,
} from '@scality/certchain';
import { useState, useEffect } from 'react';

export type ZenkoCRCertificateBundle = {
  'ca.crt': string;
};

const extractCertificateBundles = (
  certificateBundles: ZenkoCRCertificateBundle[],
) => {
  return certificateBundles.map((certificateBundle) => {
    return extractPemParts(certificateBundle['ca.crt']);
  });
};

const parseCertificateBundles = async (
  extractedCertificateBundles: { pem: string }[][],
) => {
  return await Promise.all(
    extractedCertificateBundles.map(async (extractedCertificateBundle) => {
      return await Promise.all(
        extractedCertificateBundle.map(async (pemPart) => {
          return await parseCertificateFromPEM(pemPart.pem);
        }),
      );
    }),
  );
};

export const useParseBundleCertificates = (
  certificateBundles: ZenkoCRCertificateBundle[],
) => {
  const [data, setData] = useState<(Certificate & CertificateSubject)[][]>([]);
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
