// @flow
import { Redirect, Route, useLocation } from 'react-router-dom';
import React, { useEffect } from 'react';
import type { Action } from '../../types/actions';
import type { DispatchAPI } from 'redux';
import Loader from '../ui-elements/Loader';
import { signinCallback } from '../actions';
import { useDispatch } from 'react-redux';

function LoginCallback() {
    // const dispatch: DispatchAPI<Action> = useDispatch();
    //
    // useEffect(() => {
    //     dispatch(signinCallback());
    // });

    const location = useLocation();
    console.log('location.search!!!', location.search);
    // AFTER processing response from the authorization endpoint
    if (!location.search) {
        return <Redirect to={{ pathname: '/' }} />;
    }
    // return <Redirect to={{ pathname: '/' }} />;

    return (
        <Loader> Redirecting </Loader>
    );
}

export default LoginCallback;
