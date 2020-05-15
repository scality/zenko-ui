import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { signinCallback } from '../actions';

function Callback(props) {

    useEffect(() => {
        props.signinCallback();
    },[]);

    return <div>
        You are logged in
    </div>;
}

function mapDispatchToProps(dispatch) {
    return {
        signinCallback: () => dispatch(signinCallback()),
    };
}

export default connect(null, mapDispatchToProps)(Callback);
