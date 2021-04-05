// @flow

import React, { useEffect, useState } from 'react';
import { clearError, loadClients, loadAppConfig, loadInstanceLatestStatus, loadInstanceStats } from './actions';
import { useDispatch, useSelector } from 'react-redux';
import Activity from './ui-elements/Activity';
import type { AppState } from '../types/state';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Loader from './ui-elements/Loader';
import { Navbar } from './Navbar';
import ReauthDialog from './ui-elements/ReauthDialog';
import Routes from './Routes';
import { Container, MainContainer, NavbarContainer, RouteContainer, ZenkoUIContainer } from './ui-elements/Container';
import { Banner } from '@scality/core-ui';
import { Route, Switch } from 'react-router-dom';
import LoginCallback from './auth/LoginCallback';

function ZenkoUI() {
    const isConfigLoaded = useSelector((state: AppState) => state.auth.isConfigLoaded);
    const configFailure = useSelector((state: AppState) => state.auth.configFailure);
    const configFailureErrorMessage = useSelector((state: AppState) => state.uiErrors.errorType === 'byComponent' ?
        state.uiErrors.errorMsg : '');

    console.log("ZENKO UI RELOAD~~~~");
    // const idToken = useSelector((state: AppState) => state.oidc.user.id_token);
    // const instanceIds = useSelector((state: AppState) => state.oidc.user.profile.instanceIds);

    const dispatch = useDispatch();

    // When tokens are renewed, clients are updated with the new ID token.
    // useEffect(() => {
    //     dispatch(loadClients()).then(() => {
    //         setLoaded(true);
    //     });
    // }, [dispatch, idToken, instanceIds]);

    useEffect(() => {
        dispatch(loadAppConfig());
    },[dispatch]);

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

    function content() {
        if (configFailure) {
            return <Container>
                <Banner
                    icon={<i className="fas fa-exclamation-triangle" />}
                    title="Error: Unable to load the appplication"
                    variant="danger">
                    {configFailureErrorMessage}
                </Banner>
            </Container> ;
        }

        // if (isUserLoaded) {
        //     return (
        //         <ZenkoUIContainer>
        //             { loaded ? <Routes/> : <Loader> Loading </Loader> }
        //             <Activity/>
        //             <ErrorHandlerModal
        //                 show={showError}
        //                 close={() => dispatch(clearError())} >
        //                 {errorMessage}
        //             </ErrorHandlerModal>
        //         </ZenkoUIContainer>
        //     );
        // }

        if (isConfigLoaded) {
            return (
                <ZenkoUIContainer>
                    <Routes/>
                    <Activity/>
                    <ErrorHandlerModal/>
                </ZenkoUIContainer>
            );
        }

        return <Loader> Login in </Loader>;
    }

    return <MainContainer>
        <ReauthDialog/>
        {content()}
    </MainContainer>;
}

export default ZenkoUI;
