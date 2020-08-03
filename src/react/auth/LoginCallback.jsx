// @flow

import React, { useEffect } from 'react';
import type { Action } from '../../types/actions';
import type { DispatchAPI } from 'redux';
import Loader from '../ui-elements/Loader';
import { signinCallback } from '../actions';
import { useDispatch } from 'react-redux';

function LoginCallback() {
    const dispatch: DispatchAPI<Action> = useDispatch();

    useEffect(() => {
        dispatch(signinCallback());
    });

    return (
        <Loader> Redirecting </Loader>
    );
}

export default LoginCallback;
