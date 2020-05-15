import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import { clearError, loadConfig } from './actions';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Login from './oidc/Login';
import LoginCallback from './oidc/LoginCallback';
import LogoutCallback from './oidc/LogoutCallback';
import PrivateRoute from './ui-elements/PrivateRoute';
import ReauthDialog from './ui-elements/ReauthDialog';
import SilentRefresh from './oidc/SilentRefresh';
import ZenkoUI from './ZenkoUI';
import { connect } from 'react-redux';

function Auth(props) {

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        console.log('AUTH useEffect!!!');
        props.dispatch(loadConfig()).then(() => {
            setLoaded(true);
        });
    },[]);

    return <div>
        <ReauthDialog/>
        <ErrorHandlerModal
            show={props.showError}
            close={() => props.dispatch(clearError())} >
            {props.errorMessage}
        </ErrorHandlerModal>
        { loaded &&
            <Switch>
                <Route exact path="/login" component={Login}/>
                <Route exact path="/login/callback" component={LoginCallback}/>
                <Route exact path="/silent/refresh" component={SilentRefresh}/>
                <Route exact path="/logout/callback" component={LogoutCallback}/>
                <PrivateRoute component={ZenkoUI} />
            </Switch>
        }
    </div>;
}


function mapStateToProps(state) {
    return {
        showError: !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byModal',
        errorMessage: state.uiErrors.errorMsg,
        // needReauth: state.networkActivity.authFailure,
        // isLoaded: !!(state.auth.clients && state.auth.clients.iamClient),
    };
}


export default connect(mapStateToProps)(Auth);
