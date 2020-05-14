import React, { useCallback, useEffect } from 'react';
import { userManager } from '../../js/userManager';

function Callback(props) {

    console.log('here!!!');
    useEffect(() => {
        userManager.signinRedirectCallback()
            .then((user) => {console.log('user!!!', user);})
            .catch((error) => {console.log('error!!!', error);});
    },[]);

    return <div>
        You are logged in
    </div>;
}

export default Callback;
