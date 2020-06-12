import React, { useEffect } from 'react';
import Loader from './Loader';
import { Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { signin } from '../actions';

function PrivateRoute(props) {
    const { component, authenticated, pathname, ...rest } = props;
    useEffect(() => {
        if (!authenticated) {
            props.signin(pathname);
        }
    });

    if (authenticated) {
        return <Route {...rest} component={component} />;
    }

    return <Loader> Redirecting to the login in page </Loader>;
}

function mapStateToProps(state) {
    return {
        pathname: state.router.location.pathname,
        authenticated: !!state.oidc.user && !state.oidc.user.expired,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        signin: pathname => dispatch(signin(pathname)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(PrivateRoute);
