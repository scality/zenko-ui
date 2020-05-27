import React, { useEffect } from 'react';

import Loader from '../ui-elements/Loader';
import { connect } from 'react-redux';
import { signinCallback } from '../actions';

function LoginCallback(props) {

    useEffect(() => {
        props.dispatch(signinCallback());
    });

    return (
        <Loader> Redirecting </Loader>
    );
}

function mapStateToProps(state) {
    return {
        userManager: state.auth.userManager,
    };
}

export default connect(mapStateToProps)(LoginCallback);
