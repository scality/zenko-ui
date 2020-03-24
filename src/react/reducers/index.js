import auth from './auth';
import bucket from './bucket';
import { combineReducers } from 'redux';
import configuration from './configuration';
import { connectRouter } from 'connected-react-router';
import instanceStatus from './instanceStatus';
import instances from './instances';
import networkActivity from './networkActivity';
import secrets from './secrets';
import stats from './stats';
import uiErrors from './uiErrors';
import uiUser from './uiUser';
import user from './user';

const zenkoUIReducer = history => combineReducers({
    auth,
    bucket,
    configuration,
    user,
    instanceStatus,
    instances,
    networkActivity,
    uiErrors,
    uiUser,
    secrets,
    stats,
    router: connectRouter(history),
});

export default zenkoUIReducer;
