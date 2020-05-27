import React, { useEffect } from 'react';
import Loader from '../ui-elements/Loader';
import { connect } from 'react-redux';
import { signoutCallback } from '../actions';

function LogoutCallback(props) {

    useEffect(() => {
        props.signoutCallback();
    },[]);

    return <Loader>
        You are getting logged out
    </Loader>;
}

function mapDispatchToProps(dispatch) {
    return {
        signoutCallback: () => dispatch(signoutCallback()),
    };
}

export default connect(null, mapDispatchToProps)(LogoutCallback);
