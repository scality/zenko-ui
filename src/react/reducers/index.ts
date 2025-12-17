import auth from './auth';
import { combineReducers } from 'redux';
import instanceStatus from './instanceStatus';
import instances from './instances';
import networkActivity from './networkActivity';
import stats from './stats';
import uiErrors from './uiErrors';

const zenkoUIReducer = () =>
  combineReducers({
    auth,
    instanceStatus,
    instances,
    networkActivity,
    uiErrors,
    stats,
  });

export default zenkoUIReducer;
