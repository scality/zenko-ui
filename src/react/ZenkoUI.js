import React, { useEffect, useState } from 'react';
import {clearError, loadClients, loadInstanceLatestStatus, loadInstanceStats} from './actions';
import Activity from './ui-elements/Activity';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Loader from './ui-elements/Loader';
import Routes from './Routes';
import { connect } from 'react-redux';

function ZenkoUI(props) {

    const [ loaded, setLoaded ] = useState(false);

    // When tokens are renewed, clients are updated with the new ID token.
    useEffect(() => {
        props.dispatch(loadClients()).then(() => {
            setLoaded(true);
        });
    }, [props.idToken, props.instanceIds]);

    useEffect(() => {
        const refreshIntervalStatsUnit = setInterval(
            () => props.dispatch(loadInstanceLatestStatus()), 10000);
        const refreshIntervalStatsSeries = setInterval(
            () => props.dispatch(loadInstanceStats()), 10000);
        return () => {
            clearInterval(refreshIntervalStatsUnit);
            clearInterval(refreshIntervalStatsSeries);
        };
    }, []);

    return (
        <div>
            { loaded ? <Routes/> : <Loader> Loading </Loader> }
            <ErrorHandlerModal
                show={props.showError}
                close={() => props.dispatch(clearError())} >
                {props.errorMessage}
            </ErrorHandlerModal>
            <Activity/>
        </div>
    );
}


function mapStateToProps(state) {
    return {
        showError: !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byModal',
        errorMessage: state.uiErrors.errorMsg,
        idToken: state.oidc.user.id_token,
        instanceIds: state.oidc.user.profile.instanceIds,
    };
}


export default connect(mapStateToProps)(ZenkoUI);
