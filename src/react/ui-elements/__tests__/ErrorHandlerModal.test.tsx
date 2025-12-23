import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import ErrorHandlerModal, { DumbErrorModal } from '../ErrorHandlerModal';
import { theme } from '../../utils/testUtil';
import ErrorProvider, { useModalError } from '../../ErrorProvider';
import { useEffect } from 'react';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <ErrorProvider>{children}</ErrorProvider>
  </ThemeProvider>
);

const TriggerModalError = ({ message }: { message: string }) => {
  const { showModalError } = useModalError();
  useEffect(() => {
    showModalError(message);
  }, [message, showModalError]);
  return null;
};

describe('ErrorHandlerModal', () => {
  const errorMessage = 'test error message';

  it('ErrorHandlerModal should render when modal error is set', () => {
    render(
      <TestWrapper>
        <TriggerModalError message={errorMessage} />
        <ErrorHandlerModal />
      </TestWrapper>,
    );
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('ErrorHandlerModal should not render when no error is set', () => {
    render(
      <TestWrapper>
        <ErrorHandlerModal />
      </TestWrapper>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('DumbErrorModal should render error message when isOpen is true', () => {
    render(
      <ThemeProvider theme={theme}>
        <DumbErrorModal
          close={jest.fn()}
          isOpen={true}
          errorMessage={errorMessage}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('DumbErrorModal should not render when isOpen is false', () => {
    render(
      <ThemeProvider theme={theme}>
        <DumbErrorModal
          close={jest.fn()}
          isOpen={false}
          errorMessage={errorMessage}
        />
      </ThemeProvider>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
