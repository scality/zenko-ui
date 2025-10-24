import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { NewWrapper, renderWithCustomRoute } from '../../utils/testUtil';

import ImportCertificate from '../ImportCertificate';

describe('ImportCertificate', () => {
  const selectors = {
    continueButton: () => screen.getByRole('button', { name: /Import/i }),
    cancelButton: () => screen.getByRole('button', { name: /Cancel/i }),
    formTitle: () => screen.getByText(/Import a new Certificate/i),
    dragAndDropLabel: () => screen.getByText(/Drag and drop file here/i),
    certificateInput: () =>
      screen.getByPlaceholderText(/-----BEGIN CERTIFICATE-----/i),
  };
  it('should render', () => {
    render(<ImportCertificate />, { wrapper: NewWrapper() });
    expect(selectors.continueButton()).toBeDisabled();
    expect(selectors.formTitle()).toBeInTheDocument();
    expect(selectors.dragAndDropLabel()).toBeInTheDocument();
    expect(selectors.cancelButton()).toBeInTheDocument();
    expect(selectors.certificateInput()).toBeInTheDocument();
  });

  it('should enable Continue button if form is valid', async () => {
    render(<ImportCertificate />, { wrapper: NewWrapper() });
    expect(selectors.continueButton()).toBeDisabled();
    await userEvent.type(selectors.certificateInput(), 'TEST CERTIFICATE');
    expect(selectors.continueButton()).toBeEnabled();
  });
  it('should disable Continue button if form is invalid', async () => {
    render(<ImportCertificate />, { wrapper: NewWrapper() });
    expect(selectors.continueButton()).toBeDisabled();
    await userEvent.type(
      selectors.certificateInput(),
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. ',
    );
    expect(selectors.continueButton()).toBeEnabled();
    await userEvent.clear(selectors.certificateInput());
    expect(selectors.continueButton()).toBeDisabled();
  });

  it('should navigate to truststore page if Cancel button is clicked', async () => {
    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route
          path="/truststore/import-certificate"
          element={<ImportCertificate />}
        />
      </Routes>,
      '/truststore/import-certificate',
    );
    expect(selectors.formTitle()).toBeInTheDocument();
    expect(selectors.cancelButton()).toBeInTheDocument();
    await userEvent.click(selectors.cancelButton());
    expect(screen.getByText(/Truststore/i)).toBeInTheDocument();
  });

  it('should navigate to truststore page if import is successful and show success toast', async () => {
    renderWithCustomRoute(
      <Routes>
        <Route path="/truststore" element={<div>Truststore</div>} />
        <Route
          path="/truststore/import-certificate"
          element={<ImportCertificate />}
        />
      </Routes>,
      '/truststore/import-certificate',
    );

    await userEvent.type(selectors.certificateInput(), 'TEST CERTIFICATE');
    expect(selectors.continueButton()).toBeEnabled();
    await userEvent.click(selectors.continueButton());
    //TODO: Add test for success toast
  });

  it('should show error toast if import fails', async () => {
    //TODO: Add test for error toast
  });
});
