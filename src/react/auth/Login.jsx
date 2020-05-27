import { Container, ContainerFooter } from '../ui-elements/Container';
import React, {useEffect} from 'react';
import { Button } from '@scality/core-ui';
import Loader from '../ui-elements/Loader';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { signin } from '../actions';

function Login(props) {
    const { authenticated, dispatch, isSigningOut, location } = props;
    const path = location && location.state && location.state.path && location.state.path !== '/login' ? props.location.state.path : '/';
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

function mapStateToProps(state) {
    return {
        userManager: state.auth.userManager,
        authenticated: !!state.oidc.user && !state.oidc.user.expired,
        isSigningOut: !!state.auth.isSigningOut,
    };
}

export default connect(mapStateToProps)(Login);
