import { handleErrorMessage, networkAuthFailure } from '../actions';
import { CallbackComponent } from 'redux-oidc';
import Loader from '../ui-elements/Loader';
import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

function LoginCallback(props) {
    return (
        <CallbackComponent
            userManager={props.userManager}
            successCallback={user => {
                const path = (user.state && user.state.path) || '/';
                props.dispatch(push(path));
            }}
            errorCallback={error => {
                const message = `Failed to process response from the authorization endpoint: ${error.message || '(unknown reason)'}`;
                props.dispatch(handleErrorMessage(message, 'byAuth'));
                props.dispatch(networkAuthFailure());
            }}
        >
            <Loader> Redirecting </Loader>
        </CallbackComponent>
    );
}

function mapStateToProps(state) {
    return {
        userManager: state.auth.userManager,
    };
}

export default connect(mapStateToProps)(LoginCallback);
