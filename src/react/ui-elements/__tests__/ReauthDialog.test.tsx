import ReauthDialog from '../ReauthDialog';
import { reduxMount, renderWithRouterMatch } from '../../utils/testUtil';
import { screen } from '@testing-library/react';
const defaultMessage = 'We need to log you in.';

describe('class <ReauthDialog />', () => {
  const modalTitle = 'Authentication Error';

  it('should not render the ReauthDialog component if the network activity authFailure is false', () => {
    renderWithRouterMatch(<ReauthDialog />, undefined, {
      networkActivity: {
        authFailure: false,
      },
      router: {
        location: {
          pathname: '/',
        },
      },
    });
    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });
  it('should not render the ReauthDialog component if the network activity authFailure is false even if error is of type byAuth', () => {
    renderWithRouterMatch(<ReauthDialog />, undefined, {
      networkActivity: {
        authFailure: false,
      },
      uiErrors: {
        errorMsg: 'error message test',
        errorType: 'byAuth',
      },
      router: {
        location: {
          pathname: '/',
        },
      },
    });
    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });
  it('should render the ReauthDialog component with default message if the network activity authFailure is true', () => {
    renderWithRouterMatch(<ReauthDialog />, undefined, {
      networkActivity: {
        authFailure: true,
      },
      router: {
        location: {
          pathname: '/',
        },
      },
    });

    expect(screen.getByText(modalTitle)).toBeInTheDocument();
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });
  it('should render the ReauthDialog component with provided error message if the network activity authFailure is true and error is of type byAuth', () => {
    const errorMessage = 'test error message';
    renderWithRouterMatch(<ReauthDialog />, undefined, {
      networkActivity: {
        authFailure: true,
      },
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byAuth',
      },
      router: {
        location: {
          pathname: '/',
        },
      },
    });
    expect(screen.getByText(modalTitle)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  it('should render the ReauthDialog component with default message if the network activity authFailure is true and error is of type byModal', () => {
    const errorMessage = 'test error message';
    renderWithRouterMatch(<ReauthDialog />, undefined, {
      networkActivity: {
        authFailure: true,
      },
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byModal',
      },
      router: {
        location: {
          pathname: '/',
        },
      },
    });
    expect(screen.getByText(modalTitle)).toBeInTheDocument();
    expect(screen.getByText(defaultMessage)).toBeInTheDocument();
  });
});
