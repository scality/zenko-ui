import React from 'react';
import ReauthDialog from '../ReauthDialog';
import { reduxMount } from '../../utils/testUtil';
const defaultMessage = 'We need to log you in.';
describe('class <ReauthDialog />', () => {
  it('should not render the ReauthDialog component if the network activity authFailure is false', () => {
    const { component } = reduxMount(<ReauthDialog />, {
      networkActivity: {
        authFailure: false,
      },
      router: {
        location: {
          pathname: '/',
        },
      },
    });
    expect(component.find('Modal#reauth-dialog-modal')).toHaveLength(0);
  });
  it('should not render the ReauthDialog component if the network activity authFailure is false even if error is of type byAuth', () => {
    const { component } = reduxMount(<ReauthDialog />, {
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
    expect(component.find('Modal#reauth-dialog-modal')).toHaveLength(0);
  });
  it('should render the ReauthDialog component with default message if the network activity authFailure is true', () => {
    const { component } = reduxMount(<ReauthDialog />, {
      networkActivity: {
        authFailure: true,
      },
      router: {
        location: {
          pathname: '/',
        },
      },
    });
    expect(component.find('Modal#reauth-dialog-modal')).toHaveLength(1);
    expect(component.find('div.sc-modal-body').text()).toContain(
      defaultMessage,
    );
  });
  it('should render the ReauthDialog component with provided error message if the network activity authFailure is true and error is of type byAuth', () => {
    const errorMessage = 'test error message';
    const { component } = reduxMount(<ReauthDialog />, {
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
    expect(component.find('Modal#reauth-dialog-modal')).toHaveLength(1);
    expect(component.find('div.sc-modal-body').text()).toContain(errorMessage);
  });
  it('should render the ReauthDialog component with default message if the network activity authFailure is true and error is of type byModal', () => {
    const errorMessage = 'test error message';
    const { component } = reduxMount(<ReauthDialog />, {
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
    expect(component.find('Modal#reauth-dialog-modal')).toHaveLength(1);
    expect(component.find('div.sc-modal-body').text()).toContain(
      defaultMessage,
    );
  });
});
