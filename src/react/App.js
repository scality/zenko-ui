import '../css/index.css';

import { ConnectedRouter, routerMiddleware } from 'connected-react-router';
import { applyMiddleware, compose, createStore } from 'redux';
import Auth from './Auth';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import { createBrowserHistory as createHistory } from 'history';
import logger from 'redux-logger';
import thunk from 'redux-thunk';
import zenkoUIReducer from './reducers';

const whyDidYouRender = require('@welldone-software/why-did-you-render');
whyDidYouRender(React, {
    trackAllPureComponents: true,
});

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const history = createHistory();

export const store = createStore(
    zenkoUIReducer(history),
    composeEnhancers(applyMiddleware(thunk, routerMiddleware(history))),
);


ReactDOM.render(
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <Auth/>
        </ConnectedRouter>
    </Provider>,
    document.getElementById('app'));
