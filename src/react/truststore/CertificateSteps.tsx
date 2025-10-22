import { spacing, Stepper } from '@scality/core-ui';
import { createContext, useContext } from 'react';
import ImportCertificate from './ImportCertificate';
import { useTheme } from 'styled-components';
import { Box } from '@scality/core-ui/dist/next';

export enum CertificateStepsIndexes {
  ImportCertificate,
  ApplyActions,
}

export type CertificateData = {
  certificate: string;
};

export type CertificateStepperContextType = {
  certificateData: CertificateData | null;
};

export const CertificateStepperContext = createContext<
  CertificateStepperContextType | undefined
>(undefined);

export const useCertificateStepper = () => {
  const context = useContext(CertificateStepperContext);
  if (!context) {
    throw new Error(
      'useCertificateStepper must be used within CertificateStepperProvider',
    );
  }
  return context;
};

export const CERTIFICATE_STEPS = [
  {
    label: 'Import Certificate',
    Component: ImportCertificate,
  },
  {
    label: 'Apply Actions',
    // TODO: Add the Apply Actions component
    Component: () => <>Apply Actions</>,
  },
] as const;

export const CertificateSteps = () => {
  const theme = useTheme();

  const contextValue = {
    certificateData: null,
  };

  return (
    <CertificateStepperContext.Provider value={contextValue}>
      <Box
        height="100%"
        backgroundColor={theme.backgroundLevel4}
        paddingTop={spacing.r16}
        style={{
          boxSizing: 'border-box',
        }}
      >
        <Stepper steps={CERTIFICATE_STEPS} />
      </Box>
    </CertificateStepperContext.Provider>
  );
};
