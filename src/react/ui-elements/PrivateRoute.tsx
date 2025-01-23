import { Navigate, Route } from 'react-router';
import React from 'react';
import { connect } from 'react-redux';

function PrivateRoute(props) {
  const { component, ...rest } = props;

  if (props.authenticated) {
    return <Route {...rest} component={component} />;
  } else {
    return <Navigate to="/login" />;
  }
}

function mapStateToProps(state) {
  return {
    authenticated: !!state.oidc.user && !state.oidc.user.expired,
    pathname: state.router.location.pathname,
  };
}

export default connect(mapStateToProps)(PrivateRoute);
