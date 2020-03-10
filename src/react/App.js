import '../../public/assets/css/index.css';

import { ConnectedRouter, routerMiddleware } from 'connected-react-router';
import { applyMiddleware, compose, createStore } from 'redux';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import ZenkoUI from './ZenkoUI';
import { createBrowserHistory as createHistory } from 'history';
import thunk from 'redux-thunk';
import zenkoUIReducer from './reducers';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const history = createHistory();

const store = createStore(
    zenkoUIReducer(history),
    composeEnhancers(applyMiddleware(thunk, routerMiddleware(history))),
);


ReactDOM.render(
    <Provider store={store}>
        <ConnectedRouter history={history}>
            <ZenkoUI/>
        </ConnectedRouter>
    </Provider>,
    document.getElementById('app'));
