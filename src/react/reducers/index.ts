import auth from './auth';
import { combineReducers } from 'redux';
import instances from './instances';
import networkActivity from './networkActivity';
import uiErrors from './uiErrors';

const zenkoUIReducer = () =>
  combineReducers({
    auth,
    instances,
    networkActivity,
    uiErrors,
  });

export default zenkoUIReducer;
