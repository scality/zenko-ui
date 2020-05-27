import '../css/index.css';

import { ConnectedRouter, routerMiddleware } from 'connected-react-router';
import { applyMiddleware, compose, createStore } from 'redux';
import {
    jade,
    turquoise,
    yellowOrange,
    warmRed,
    white,
} from '@scality/core-ui/src/lib/style/theme';
import Auth from './Auth';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from 'styled-components';
import { createBrowserHistory as createHistory } from 'history';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import zenkoUIReducer from './reducers';

// const whyDidYouRender = require('@welldone-software/why-did-you-render');
// whyDidYouRender(React, {
//     trackAllPureComponents: true,
// });

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const history = createHistory();

export const store = createStore(
    zenkoUIReducer(history),
    composeEnhancers(applyMiddleware(thunk, routerMiddleware(history), logger)),
);


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
