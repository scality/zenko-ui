import { Redirect, Route } from 'react-router-dom';
import React from 'react';
import { connect } from 'react-redux';

function PrivateRoute(props) {
    const { component, ...rest } = props;
    if (props.authenticated) {
        return <Route {...rest} component={component} />;
    } else {
        return <Redirect to={{
            pathname: '/login', state: { path: props.pathname } }} />;
    }
}

function mapStateToProps(state) {
    return {
        authenticated: !!state.oidc.user && !state.oidc.user.expired,
        pathname: state.router.location.pathname,
    };
}

export default connect(mapStateToProps)(PrivateRoute);
