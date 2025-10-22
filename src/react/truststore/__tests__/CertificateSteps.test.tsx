import { render, screen } from '@testing-library/react';
import * as React from 'react';
import {
  CertificateStepperContext,
  useCertificateStepper,
  CertificateSteps,
  CERTIFICATE_STEPS,
} from '../CertificateSteps';
import { Wrapper } from '../../utils/testUtil';

// Mock the components to avoid complex rendering
jest.mock('../ImportCertificate', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="import-certificate">Import a new Certificate</div>
  ),
}));

describe('useCertificateStepper', () => {
  it('should throw an error when used outside of the Provider', () => {
    const TestComponent = () => {
      useCertificateStepper();
      return null;
    };

    expect(() => render(<TestComponent />)).toThrow(
      'useCertificateStepper must be used within CertificateStepperProvider',
    );
  });

  it('should return context when used inside Provider', () => {
    const TestComponent = () => {
      const context = useCertificateStepper();
      return (
        <div data-testid="certificate-data">
          {context.certificateData?.certificate || 'null'}
        </div>
      );
    };

    render(
      <CertificateStepperContext.Provider
        value={{ certificateData: { certificate: 'TEST' } }}
      >
        <TestComponent />
      </CertificateStepperContext.Provider>,
    );

    expect(screen.getByTestId('certificate-data')).toHaveTextContent('TEST');
  });
});

describe('CertificateSteps', () => {
  it('should render stepper with correct steps', () => {
    render(
      <Wrapper>
        <CertificateSteps />
      </Wrapper>,
    );

    expect(screen.getByText(/Import Certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply Actions/i)).toBeInTheDocument();
  });

  it('should have correct number of steps', () => {
    expect(CERTIFICATE_STEPS).toHaveLength(2);
    expect(CERTIFICATE_STEPS[0].label).toBe('Import Certificate');
    expect(CERTIFICATE_STEPS[1].label).toBe('Apply Actions');
  });
});
