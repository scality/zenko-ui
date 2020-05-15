import React, { useCallback, useEffect } from 'react';
import { Button } from '@scality/core-ui';
import { connect } from 'react-redux';
import { signin } from '../actions';

function Login(props) {
    const login = () => {
        props.signin();
    };

    return <div>
        <Button outlined onClick={login} text='Get Started'/>
    </div>;
}

function mapDispatchToProps(dispatch) {
    return {
        signin: () => dispatch(signin()),
    };
}

export default connect(null, mapDispatchToProps)(Login);
