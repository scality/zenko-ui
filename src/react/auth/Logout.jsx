import React, { useEffect } from 'react';
import Loader from '../ui-elements/Loader';
import { connect } from 'react-redux';
import { signout, signin } from '../actions';

function Logout(props) {
    useEffect(() => {
        if (props.authenticated) {
            props.dispatch(signout());
        } else {
            props.dispatch(signin());
        }
    },[]);

    return <Loader>
        You are getting logged out.
    </Loader>;
}

function mapStateToProps(state) {
    return {
        authenticated: !!state.oidc.user && !state.oidc.user.expired,
    };
}


export default connect(mapStateToProps)(Logout);
