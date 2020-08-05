// @flow

import { Container, MainContainer } from './ui-elements/Container';
import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../types/actions';
import type { AppState } from '../types/state';
import { Banner } from '@scality/core-ui';
import type { DispatchAPI } from 'redux';
import Loader from './ui-elements/Loader';
import Login from './auth/Login';
import LoginCallback from './auth/LoginCallback';
import LogoutCallback from './auth/LogoutCallback';
import { OidcProvider } from 'redux-oidc';
import PrivateRoute from './ui-elements/PrivateRoute';
import ReauthDialog from './ui-elements/ReauthDialog';
import ZenkoUI from './ZenkoUI';
import { loadAppConfig } from './actions';
import { store } from './store';


function Auth() {
    const isUserLoaded = useSelector((state: AppState) => state.auth.isUserLoaded);
    const userManager = useSelector((state: AppState) => state.auth.userManager);
    const configFailure = useSelector((state: AppState) => state.auth.configFailure);
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorType === 'byComponent' ?
        state.uiErrors.errorMsg : '');

    const dispatch: DispatchAPI<Action> = useDispatch();

    useEffect(() => {
        dispatch(loadAppConfig());
    },[dispatch]);

    function content() {
        if (configFailure) {
            return <Container>
                <Banner
                    icon={<i className="fas fa-exclamation-triangle" />}
                    title="Error: Unable to load the appplication"
                    variant="danger">
                    {errorMessage}
                </Banner>
            </Container> ;
        }

        if (isUserLoaded) {
            return <OidcProvider store={store} userManager={userManager}>
                <Switch>
                    <Route exact path="/login" component={Login}/>
                    <Route exact path="/login/callback" component={LoginCallback}/>
                    <Route exact path="/logout/callback" component={LogoutCallback}/>
                    <PrivateRoute component={ZenkoUI} />
                </Switch>
            </OidcProvider>;
        }

        return <Loader> Login in </Loader>;
    }

    return <MainContainer>
        <ReauthDialog/>
        {content()}
    </MainContainer>;
}


export default Auth;
