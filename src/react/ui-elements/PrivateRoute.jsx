import React from 'react';
import { Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { signin } from '../actions';

function PrivateRoute(props) {
    const { component, ...rest } = props;
    if (props.authenticated) {
        return <Route {...rest} component={component} />;
    } else {
        props.signin(props.pathname);
        return null;
    }
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
