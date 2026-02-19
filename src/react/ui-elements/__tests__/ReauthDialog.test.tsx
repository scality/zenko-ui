import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { ThemeProvider } from 'styled-components';
import ErrorProvider, { useAuthError, useAuthFailure, useModalError } from '../../ErrorProvider';
import { theme } from '../../utils/testUtil';
import ReauthDialog from '../ReauthDialog';

jest.mock('../../account/AccountRoleSelectButtonAndModal', () => ({
  __esModule: true,
  default: () => <button type="button">Switch Account</button>,
}));

const TestWrapper = ({ children, initialRoute = '/' }: { children: React.ReactNode; initialRoute?: string }) => (
  <ThemeProvider theme={theme}>
    <MemoryRouter initialEntries={[initialRoute]}>
      <ErrorProvider>{children}</ErrorProvider>
    </MemoryRouter>
  </ThemeProvider>
);

const TriggerAuthFailure = () => {
  const { setAuthFailure } = useAuthFailure();
  useEffect(() => {
    setAuthFailure();
  }, [setAuthFailure]);
  return null;
};

const TriggerAuthError = ({ message }: { message: string }) => {
  const { showAuthError } = useAuthError();
  const { setAuthFailure } = useAuthFailure();
  useEffect(() => {
    showAuthError(message);
    setAuthFailure();
  }, [message, showAuthError, setAuthFailure]);
  return null;
};

const defaultMessage = 'We need to log you in.';
const modalTitle = 'Authentication Error';

describe('ReauthDialog', () => {
  it('should not render when authFailure is false', () => {
    render(
      <TestWrapper>
        <ReauthDialog />
      </TestWrapper>,
    );
    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });

  it('should render with default message when authFailure is true', () => {
    render(
      <TestWrapper>
        <TriggerAuthFailure />
        <ReauthDialog />
      </TestWrapper>,
    );

    expect(screen.getByText(modalTitle)).toBeInTheDocument();
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });

  it('should render with provided error message when authFailure is true and authError is set', () => {
    const errorMessage = 'test error message';
    render(
      <TestWrapper>
        <TriggerAuthError message={errorMessage} />
        <ReauthDialog />
      </TestWrapper>,
    );
    expect(screen.getByText(modalTitle)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show "Access denied" when on accounts path with authError', () => {
    const errorMessage = 'some error';
    render(
      <TestWrapper initialRoute="/accounts/test-account">
        <TriggerAuthError message={errorMessage} />
        <ReauthDialog />
      </TestWrapper>,
    );
    expect(screen.getByText(modalTitle)).toBeInTheDocument();
    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });

  it('should render with default message when authFailure is true but error is modal type (not auth)', () => {
    const TriggerModalErrorAndAuthFailure = () => {
      const { showModalError } = useModalError();
      const { setAuthFailure } = useAuthFailure();
      useEffect(() => {
        showModalError('some modal error');
        setAuthFailure();
      }, [showModalError, setAuthFailure]);
      return null;
    };

    render(
      <TestWrapper>
        <TriggerModalErrorAndAuthFailure />
        <ReauthDialog />
      </TestWrapper>,
    );
    expect(screen.getByText(modalTitle)).toBeInTheDocument();
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });
});
