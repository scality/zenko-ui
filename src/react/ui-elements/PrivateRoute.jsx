import React from 'react';
import { Route } from 'react-router-dom';
import { connect } from 'react-redux';
import { signin } from '../actions';

function PrivateRoute(props) {
    const { component, ...rest } = props;
    if (props.authenticated) {
        return <Route {...rest} component={component} />;
    } else {
        props.signin();
        return null;
    }
}

function mapStateToProps(state) {
    return {
        authenticated: !!state.oidc.user && !state.oidc.user.expired,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        signin: locationName => dispatch(signin(locationName)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(PrivateRoute);
