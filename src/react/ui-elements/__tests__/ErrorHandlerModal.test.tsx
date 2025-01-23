import { render, screen } from '@testing-library/react';
import ErrorHandlerModal from '../ErrorHandlerModal';
import { renderWithRouterMatch } from '../../utils/testUtil';

describe('ErrorHandlerModal', () => {
  const errorMessage = 'test error message';

  it('ErrorHandlerModal should render', () => {
    renderWithRouterMatch(<></>, undefined, {
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byModal',
      },
    });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('ErrorHandlerModal should not render if errorType is set to "byAuth"', () => {
    renderWithRouterMatch(<ErrorHandlerModal />, undefined, {
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byAuth',
      },
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ErrorHandlerModal should not render if errorType and errorMessage are null', () => {
    renderWithRouterMatch(<ErrorHandlerModal />, undefined, {
      uiErrors: {
        errorMsg: null,
        errorType: null,
      },
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
