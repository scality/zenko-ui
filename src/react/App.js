import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import ZenkoUI from './ZenkoUI';
import thunk from 'redux-thunk';
import zenkoUIReducer from './reducers';

const store = createStore(zenkoUIReducer, applyMiddleware(thunk));


ReactDOM.render(
    <Provider store={store}>
        <ZenkoUI/>
    </Provider>,
    document.getElementById('app'));
