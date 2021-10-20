import { applyMiddleware, compose, createStore } from 'redux';
import { createBrowserHistory as createHistory } from 'history';
import logger from 'redux-logger';
import { routerMiddleware } from 'connected-react-router';
import thunk from 'redux-thunk';
import zenkoUIReducer from './reducers';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export const history = createHistory();

export const store = createStore(
  zenkoUIReducer(history),
  composeEnhancers(applyMiddleware(thunk, routerMiddleware(history), logger)),
);
