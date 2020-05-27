import '../css/index.css';

import { history, store } from './store';
import {
    jade,
    turquoise,
    yellowOrange,
    warmRed,
    white,
} from '@scality/core-ui/src/lib/style/theme';
import Auth from './Auth';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';

// const whyDidYouRender = require('@welldone-software/why-did-you-render');
// whyDidYouRender(React, {
//     trackAllPureComponents: true,
// });

const theme = {
    name: 'Dark Theme',
    brand: {
        base: '#19161D',
        baseContrast1: '#26232A',
        primary: white,
        secondary: '#a7a7a7',
        success: jade,
        info: turquoise,
        warning: yellowOrange,
        danger: warmRed,
        background: '#0a0a0b',
        backgroundContrast1: '#16161a',
        backgroundContrast2: '#08080A',
        text: white,
        border: white,
    },
};


ReactDOM.render(
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <ThemeProvider theme={theme}>
                <Auth/>
            </ThemeProvider>
        </ConnectedRouter>
    </Provider>,
    document.getElementById('app'));
