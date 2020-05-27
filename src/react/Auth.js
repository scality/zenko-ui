import { Container, MainContainer } from './ui-elements/Container';
import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import { Banner } from '@scality/core-ui';
import Loader from './ui-elements/Loader';
import Login from './auth/Login';
import LoginCallback from './auth/LoginCallback';
import LogoutCallback from './auth/LogoutCallback';
import { OidcProvider } from 'redux-oidc';
import PrivateRoute from './ui-elements/PrivateRoute';
import ReauthDialog from './ui-elements/ReauthDialog';
import ZenkoUI from './ZenkoUI';
import { connect } from 'react-redux';
import { loadAppConfig } from './actions';
import { store } from './store';

function Auth(props) {
    useEffect(() => {
        props.dispatch(loadAppConfig());
    },[]);

    function content() {
        if (props.configFailure) {
            return <Container>
                <Banner
                    icon={<i className="fas fa-exclamation-triangle" />}
                    title="Error: Unable to load the appplication"
                    variant="danger">
                    {props.errorMessage}
                </Banner>
            </Container> ;
        }

        if (props.isUserLoaded) {
            return <OidcProvider store={store} userManager={props.userManager}>
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


function mapStateToProps(state) {
    return {
        isUserLoaded: state.auth.isUserLoaded,
        userManager: state.auth.userManager,
        errorMessage: state.uiErrors.errorType === 'byComponent' ?
            state.uiErrors.errorMsg : '',
        configFailure: state.auth.configFailure,
    };
}


export default connect(mapStateToProps)(Auth);
