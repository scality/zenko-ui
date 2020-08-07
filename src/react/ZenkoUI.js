// @flow

import React, { useEffect, useState } from 'react';
import { clearError, loadClients, loadInstanceLatestStatus, loadInstanceStats } from './actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../types/state';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Loader from './ui-elements/Loader';
import Routes from './Routes';

function ZenkoUI() {
    const [ loaded, setLoaded ] = useState(false);

    const showError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byModal');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);
    const idToken = useSelector((state: AppState) => state.oidc.user.id_token);
    const instanceIds = useSelector((state: AppState) => state.oidc.user.profile.instanceIds);

    const dispatch = useDispatch();

    // When tokens are renewed, clients are updated with the new ID token.
    useEffect(() => {
        dispatch(loadClients()).then(() => {
            setLoaded(true);
        });
    }, [dispatch, idToken, instanceIds]);

    // useEffect(() => {
    //     const refreshIntervalStatsUnit = setInterval(
    //         () => dispatch(loadInstanceLatestStatus()), 10000);
    //     const refreshIntervalStatsSeries = setInterval(
    //         () => dispatch(loadInstanceStats()), 10000);
    //     return () => {
    //         clearInterval(refreshIntervalStatsUnit);
    //         clearInterval(refreshIntervalStatsSeries);
    //     };
    // }, [dispatch]);

    return (
        <div>
            { loaded ? <Routes/> : <Loader> Loading </Loader> }
            <ErrorHandlerModal
                show={showError}
                close={() => dispatch(clearError())} >
                {errorMessage}
            </ErrorHandlerModal>
        </div>
    );
}

export default ZenkoUI;
