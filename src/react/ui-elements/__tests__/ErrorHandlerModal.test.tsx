import { screen } from '@testing-library/react';
import ErrorHandlerModal from '../ErrorHandlerModal';
import { reduxMount, renderWithRouterMatch } from '../../utils/testUtil';

describe('ErrorHandlerModal', () => {
  const errorMessage = 'test error message';
  it('ErrorHandlerModal should render', () => {
    // I put <></> because  ErrorHandlerModal is already in `renderWithRouterMatch`
    // We will remove/change this component anyway
    renderWithRouterMatch(<></>, undefined, {
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byModal',
      },
    });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
  it('ErrorHandlerModal should not render if errorType is set to "byAuth"', () => {
    const { component } = reduxMount(<ErrorHandlerModal />, {
      uiErrors: {
        errorMsg: errorMessage,
        errorType: 'byAuth',
      },
    });
    expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(true);
  });
  it('ErrorHandlerModal should not render if children errorType and errorMessage are set to null', () => {
    const { component } = reduxMount(<ErrorHandlerModal />, {
      uiErrors: {
        errorMsg: null,
        errorType: null,
      },
    });
    expect(component.find(ErrorHandlerModal).isEmptyRender()).toBe(true);
  });
});
