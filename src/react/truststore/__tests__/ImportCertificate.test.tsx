import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithCustomRoute } from '../../utils/testUtil';
import { CertificateStepperContext } from '../CertificateSteps';
import ImportCertificate from '../ImportCertificate';

const mockNext = jest.fn();
// Mock stepper hook
jest.mock(
  '@scality/core-ui/dist/components/steppers/Stepper.component',
  () => ({
    useStepper: () => ({
      next: mockNext,
    }),
  }),
);
describe('ImportCertificate', () => {
  it('should render', () => {
    renderWithCustomRoute(
      <CertificateStepperContext.Provider value={{ certificateData: null }}>
        <ImportCertificate />
      </CertificateStepperContext.Provider>,
      '/truststore/import-certificate',
    );

    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
    expect(screen.getByText(/Import a new Certificate/i)).toBeInTheDocument();
    expect(screen.getByText(/Drag and drop file here/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/i),
    ).toBeInTheDocument();
  });

  it('should enable Continue button if form is valid', async () => {
    renderWithCustomRoute(
      <CertificateStepperContext.Provider value={{ certificateData: null }}>
        <ImportCertificate />
      </CertificateStepperContext.Provider>,
      '/truststore/import-certificate',
    );
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
    await userEvent.type(
      screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/i),
      'TEST CERTIFICATE',
    );
    expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
  });
  it('should disable Continue button if form is invalid', async () => {
    renderWithCustomRoute(
      <CertificateStepperContext.Provider value={{ certificateData: null }}>
        <ImportCertificate />
      </CertificateStepperContext.Provider>,
      '/truststore/import-certificate',
    );
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
    await userEvent.type(
      screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/i),
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. ',
    );
    expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
    await userEvent.clear(
      screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/i),
    );
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it('should navigate to truststore page if Cancel button is clicked', async () => {
    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route
          path="/truststore/import-certificate"
          element={
            <CertificateStepperContext.Provider
              value={{ certificateData: null }}
            >
              <ImportCertificate />
            </CertificateStepperContext.Provider>
          }
        />
      </Routes>,
      '/truststore/import-certificate',
    );
    expect(screen.getByText(/Import a new Certificate/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
  });

  it('should call next step with certificate data if form is valid', async () => {
    renderWithCustomRoute(
      <CertificateStepperContext.Provider value={{ certificateData: null }}>
        <ImportCertificate />
      </CertificateStepperContext.Provider>,
      '/truststore/import-certificate',
    );

    await userEvent.type(
      screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/i),
      'TEST CERTIFICATE',
    );
    expect(screen.getByRole('button', { name: /Continue/i })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: /Continue/i }));
    expect(mockNext).toHaveBeenCalledWith({ certificate: 'TEST CERTIFICATE' });
  });
});
