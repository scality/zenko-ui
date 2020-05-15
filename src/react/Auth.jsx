import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router-dom';
import { clearError, loadConfig } from './actions';
import Callback from './oidc/Callback';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Login from './oidc/Login';
import PrivateRoute from './ui-elements/PrivateRoute';
import ReauthDialog from './ui-elements/ReauthDialog';
import ZenkoUI from './ZenkoUI';
import { connect } from 'react-redux';

function Auth(props) {

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        props.dispatch(loadConfig()).then(() => {
            setLoaded(true);
        });
    },[]);

    console.log('loaded!!!', loaded);

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
                <Route exact path="/login/callback" component={Callback}/>
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
