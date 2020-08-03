// @flow

import React, { useEffect } from 'react';
import type { Action } from '../../types/actions';
import type { DispatchAPI } from 'redux';
import Loader from '../ui-elements/Loader';
import { signoutCallback } from '../actions';
import { useDispatch } from 'react-redux';

function LogoutCallback() {
    const dispatch: DispatchAPI<Action> = useDispatch();

    useEffect(() => {
        dispatch(signoutCallback());
    });

    return <Loader>
        You are getting logged out
    </Loader>;
}

export default LogoutCallback;
