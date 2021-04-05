// @flow
import { Redirect, useLocation } from 'react-router-dom';
import Loader from '../ui-elements/Loader';
import React from 'react';

function LoginCallback() {
    const location = useLocation();
    // AFTER processing response from the authorization endpoint, shell UI redirect to /login/callback
    if (!location.search) {
        return <Redirect to={{ pathname: '/' }} />;
    }

    return (
        <Loader> Redirecting </Loader>
    );
}

export default LoginCallback;
