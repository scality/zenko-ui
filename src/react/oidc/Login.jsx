import React, { useCallback, useEffect } from 'react';
import { Button } from '@scality/core-ui';
import { userManager } from '../../js/userManager';

function Login(props) {
    const login = () => {
        userManager.signinRedirect();
    };

    return <div>
        <Button outlined onClick={login} text='Get Started'/>
    </div>;
}

export default Login;
