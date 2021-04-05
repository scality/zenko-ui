import '../css/index.css';

import { history, store } from './store';
// import Auth from './Auth';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import ZenkoUI from './ZenkoUI';
import { theme } from './theme';

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
            <ThemeProvider theme={theme}>
                <ZenkoUI/>
            </ThemeProvider>
        </ConnectedRouter>
    </Provider>,
    document.getElementById('app'));
