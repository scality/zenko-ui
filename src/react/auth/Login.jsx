// @flow

import { Container, ContainerFooter } from '../ui-elements/Container';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../types/actions';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui';
import type { DispatchAPI } from 'redux';
import Loader from '../ui-elements/Loader';
import { push } from 'connected-react-router';
import { signin } from '../actions';

function Login() {
    const dispatch: DispatchAPI<Action> = useDispatch();
    const authenticated = useSelector((state: AppState) => !!state.oidc.user && !state.oidc.user.expired);
    const isSigningOut = useSelector((state: AppState) => !!state.auth.isSigningOut);
    const path = useSelector((state: AppState) => state.router.location && state.router.location.state && state.router.location.state.path);

    useEffect(() => {
        if (!authenticated && !isSigningOut) {
            dispatch(signin(path));
        }
    });

    return <div>
        {
            authenticated ?
                <Container>
                    You are already logged in.
                    <ContainerFooter>
                        <Button outlined text="Go back" onClick={() => dispatch(push(path))} />
                    </ContainerFooter>
                </Container> :
                <Loader> Redirecting to the login in page </Loader>
        }
    </div>;
}

export default Login;
