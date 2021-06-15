import '../css/index.css';

import { history, store } from './store';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import ZenkoUI from './ZenkoUI';

// const whyDidYouRender = require('@welldone-software/why-did-you-render');
// whyDidYouRender(React, {
//     trackAllPureComponents: true,
//     trackExtraHooks: [
//         [require('react-redux/lib'), 'useSelector'],
//     ],
// });

ReactDOM.render(
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <ZenkoUI/>
        </ConnectedRouter>
    </Provider>,
    document.getElementById('app'));
