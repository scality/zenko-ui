import { applyMiddleware, compose, createStore } from 'redux';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import ZenkoUI from './ZenkoUI';
import thunk from 'redux-thunk';
import zenkoUIReducer from './reducers';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
    zenkoUIReducer,
    composeEnhancers(applyMiddleware(thunk)),
);


ReactDOM.render(
    <Provider store={store}>
        <ZenkoUI/>
    </Provider>,
    document.getElementById('app'));
