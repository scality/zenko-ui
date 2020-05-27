import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import { clearError, loadConfig } from './actions';
import { connect, useStore } from 'react-redux';
import { store } from './App';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import LoginCallback from './auth/LoginCallback';
import LogoutCallback from './auth/LogoutCallback';
import { OidcProvider } from 'redux-oidc';
import PrivateRoute from './ui-elements/PrivateRoute';
import ReauthDialog from './ui-elements/ReauthDialog';
import ZenkoUI from './ZenkoUI';

function Auth(props) {
    useEffect(() => {
        props.dispatch(loadConfig());
    },[]);

    return <div>
        <ReauthDialog/>
        <ErrorHandlerModal
            show={props.showError}
            close={() => props.dispatch(clearError())} >
            {props.errorMessage}
        </ErrorHandlerModal>
        {
            props.isUserLoaded && props.userManager ?
                <OidcProvider store={store} userManager={props.userManager}>
                    <Switch>
                        <Route exact path="/login/callback" component={LoginCallback}/>
                        <Route exact path="/logout/callback" component={LogoutCallback}/>
                        <PrivateRoute component={ZenkoUI} />
                    </Switch>
                </OidcProvider>
                : <div> LOADING... </div>
        }
    </div>;
}


function mapStateToProps(state) {
    return {
        showError: !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byModal',
        errorMessage: state.uiErrors.errorMsg,
        isUserLoaded: state.auth.isUserLoaded,
        userManager: state.auth.userManager,
        // needReauth: state.networkActivity.authFailure,
        // isLoaded: !!(state.auth.clients && state.auth.clients.iamClient),
    };
}


export default connect(mapStateToProps)(Auth);
