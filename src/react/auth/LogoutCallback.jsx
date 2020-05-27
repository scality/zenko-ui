import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { signoutCallback } from '../actions';

function LogoutCallback(props) {

    useEffect(() => {
        props.signoutCallback();
    },[]);

    return <div>
        You are logging out.
    </div>;
}

function mapDispatchToProps(dispatch) {
    return {
        signoutCallback: () => dispatch(signoutCallback()),
    };
}

export default connect(null, mapDispatchToProps)(LogoutCallback);
